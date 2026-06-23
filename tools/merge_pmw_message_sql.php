<?php
/**
 * Merge two phpMyAdmin-style INSERT dumps for `pmw_message` without dropping rows.
 * Shifts `id` in the second file so all new ids are > max(id) in the first file.
 *
 * Usage:
 *   php tools/merge_pmw_message_sql.php ^
 *     "C:\Users\niego\Downloads\pmw_message (1).sql" ^
 *     "C:\Users\niego\Downloads\pmw_message.sql" ^
 *     -o "C:\Users\niego\Downloads\pmw_message_merged.sql"
 *
 * If the table already has rows (duplicate PRIMARY #1062), pass the current
 * maximum id so all new ids sit above it:
 *   php ... -o out.sql -b 5000
 *   (-b is short for --ensure-above-id; use SELECT MAX(id) FROM pmw_message;)
 */

function read_text(string $path): string
{
    $raw = @file_get_contents($path);
    if ($raw === false) {
        fwrite(STDERR, "Cannot read: {$path}\n");
        exit(1);
    }
    if (substr($raw, 0, 3) === "\xEF\xBB\xBF") {
        $raw = substr($raw, 3);
    }
    return $raw;
}

/** @return array{0: string, 1: string[]} */
function extract_insert_parts(string $text): array
{
    $lines = preg_split("/\r\n|\n|\r/", $text);
    $headerIdx = null;
    foreach ($lines as $i => $line) {
        if (strpos($line, 'INSERT INTO') !== false
            && strpos($line, 'pmw_message') !== false
            && strpos($line, 'VALUES') !== false) {
            $headerIdx = $i;
            break;
        }
    }
    if ($headerIdx === null) {
        throw new RuntimeException('Could not find INSERT INTO `pmw_message` ... VALUES');
    }
    $header = trim($lines[$headerIdx]);
    $valueLines = [];
    for ($j = $headerIdx + 1, $n = count($lines); $j < $n; $j++) {
        $s = trim($lines[$j]);
        if ($s === '' || strpos($s, '--') === 0) {
            continue;
        }
        if (preg_match('/^\(\d+\s*,/', $s)) {
            $valueLines[] = $s;
        }
    }
    if ($valueLines === []) {
        throw new RuntimeException('No value rows found after INSERT header');
    }
    return [$header, $valueLines];
}

/** @param string[] $valueLines */
function ids_from_value_lines(array $valueLines): array
{
    $ids = [];
    foreach ($valueLines as $s) {
        if (preg_match('/^\((\d+)\s*,/', $s, $m)) {
            $ids[] = (int) $m[1];
        }
    }
    return $ids;
}

function remap_line_leading_id(string $line, int $offset): string
{
    $s = trim($line);
    if (!preg_match('/^\((\d+)\s*,/', $s, $m)) {
        return $line;
    }
    $newId = (int) $m[1] + $offset;
    return preg_replace('/^\(\d+\s*,/', '(' . $newId . ',', $s, 1);
}

function ensure_comma_not_semicolon(string $s): string
{
    $s = rtrim($s);
    if (substr($s, -2) === ');') {
        return substr($s, 0, -2) . '),';
    }
    if (substr($s, -1) === ',') {
        return $s;
    }
    return $s . ',';
}

function ensure_semicolon(string $s): string
{
    $s = rtrim($s);
    $s = rtrim($s, ',');
    if (substr($s, -2) === ');') {
        return $s;
    }
    if (substr($s, -1) === ')') {
        return $s . ';';
    }
    return $s . ';';
}

/** @param string[] $lines */
function apply_id_shift_all(array $lines, int $extraOffset): array
{
    if ($extraOffset === 0) {
        return $lines;
    }
    $out = [];
    $n = count($lines);
    foreach ($lines as $i => $row) {
        $mapped = remap_line_leading_id($row, $extraOffset);
        $out[] = $i < $n - 1 ? ensure_comma_not_semicolon($mapped) : ensure_semicolon($mapped);
    }
    return $out;
}

/**
 * @param string[] $v1
 * @param string[] $v2
 * @return array{0: string, 1: string[], 2: string} header, body lines (last ends with ;), comment line
 */
function merge_body_lines(string $h1, array $v1, array $v2): array
{
    $ids1 = ids_from_value_lines($v1);
    $ids2 = ids_from_value_lines($v2);
    $max1 = max($ids1);
    $min2 = min($ids2);
    $offset = max(0, $max1 - $min2 + 1);

    $body = [];
    $n1 = count($v1);
    foreach ($v1 as $i => $row) {
        $line = trim($row);
        $body[] = ensure_comma_not_semicolon($line);
    }

    $n2 = count($v2);
    foreach ($v2 as $i => $row) {
        $mapped = remap_line_leading_id($row, $offset);
        $body[] = $i < $n2 - 1 ? ensure_comma_not_semicolon($mapped) : ensure_semicolon($mapped);
    }

    $allIds = ids_from_value_lines($v1);
    foreach (ids_from_value_lines($v2) as $oid) {
        $allIds[] = $oid + $offset;
    }
    $minAll = min($allIds);
    $maxAll = max($allIds);

    $comment = '-- merge_pmw_message_sql.php: primary rows=' . count($v1) . ' max_id=' . $max1
        . ', secondary rows=' . count($v2) . ' min_id=' . $min2 . ' max_id=' . max($ids2)
        . ', id_offset applied to secondary=' . $offset
        . ', merged id range ' . $minAll . '..' . $maxAll;

    return [$h1, $body, $comment];
}

/** @param string[] $bodyLines */
function merge_sql_final(string $h1, array $bodyLines, string $comment, ?int $ensureAboveId): string
{
    $extra = 0;
    if ($ensureAboveId !== null && $ensureAboveId >= 0) {
        $ids = ids_from_value_lines($bodyLines);
        $minMerged = min($ids);
        $extra = max(0, $ensureAboveId - $minMerged + 1);
        if ($extra > 0) {
            $bodyLines = apply_id_shift_all($bodyLines, $extra);
            $ids2 = ids_from_value_lines($bodyLines);
            $comment .= ', ensure_above_id=' . $ensureAboveId . ', extra_shift=' . $extra
                . ', final id range ' . min($ids2) . '..' . max($ids2);
        } else {
            $comment .= ', ensure_above_id=' . $ensureAboveId . ' (no extra shift; merged min already higher)';
        }
    }

    $out = [$comment, '', $h1, ''];
    foreach ($bodyLines as $line) {
        $out[] = $line;
    }
    $out[] = '';

    return implode("\n", $out);
}

// --- CLI ---
$argv = $_SERVER['argv'] ?? [];
if (count($argv) < 5) {
    fwrite(STDERR, "Usage: php merge_pmw_message_sql.php <primary.sql> <secondary.sql> -o <out.sql> [-b N]\n");
    fwrite(STDERR, "  -b N / --ensure-above-id N   shift ALL ids so min(id) > N (use SELECT MAX(id) FROM pmw_message)\n");
    exit(1);
}

$primary = $argv[1];
$secondary = $argv[2];
$outPath = null;
$ensureAboveId = null;
for ($i = 3; $i < count($argv); $i++) {
    if ($argv[$i] === '-o' && isset($argv[$i + 1])) {
        $outPath = $argv[$i + 1];
        continue;
    }
    if (($argv[$i] === '-b' || $argv[$i] === '--ensure-above-id') && isset($argv[$i + 1])) {
        $ensureAboveId = (int) $argv[$i + 1];
        if ($ensureAboveId < 0) {
            fwrite(STDERR, "ensure-above-id must be >= 0\n");
            exit(1);
        }
        continue;
    }
}
if ($outPath === null) {
    fwrite(STDERR, "Missing -o output path\n");
    exit(1);
}

try {
    [$h1, $v1] = extract_insert_parts(read_text($primary));
    [, $v2] = extract_insert_parts(read_text($secondary));
    [$h1, $body, $comment] = merge_body_lines($h1, $v1, $v2);
    $merged = merge_sql_final($h1, $body, $comment, $ensureAboveId);
} catch (Throwable $e) {
    fwrite(STDERR, $e->getMessage() . "\n");
    exit(1);
}

$dir = dirname($outPath);
if ($dir !== '' && $dir !== '.' && !is_dir($dir)) {
    @mkdir($dir, 0777, true);
}
if (file_put_contents($outPath, $merged) === false) {
    fwrite(STDERR, "Cannot write: {$outPath}\n");
    exit(1);
}

fwrite(STDOUT, 'Wrote ' . $outPath . ' (' . strlen($merged) . " bytes)\n");
