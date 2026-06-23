#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Merge two phpMyAdmin-style INSERT dumps for `pmw_message` without dropping rows.

The second file's `id` values are shifted so every new id is > max(id) in the
first file, avoiding duplicate primary keys on import.

Usage:
  python tools/merge_pmw_message_sql.py ^
    "C:\\Users\\niego\\Downloads\\pmw_message (1).sql" ^
    "C:\\Users\\niego\\Downloads\\pmw_message.sql" ^
    -o "C:\\Users\\niego\\Downloads\\pmw_message_merged.sql"

Then import `pmw_message_merged.sql` in MySQL (phpMyAdmin / mysql CLI).

If the table already has rows (#1062 duplicate PRIMARY), pass the current max id:
  python tools/merge_pmw_message_sql.py ... -o out.sql -b 5000
  (-b / --ensure-above-id: shift ALL ids so min(id) > N; use SELECT MAX(id) FROM pmw_message;)
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

VALUE_LINE = re.compile(r"^\((\d+)\s*,")


def read_text(path: Path) -> str:
    for enc in ("utf-8-sig", "utf-8", "gbk"):
        try:
            return path.read_text(encoding=enc)
        except UnicodeDecodeError:
            continue
    return path.read_text(encoding="utf-8", errors="replace")


def extract_insert_parts(text: str) -> tuple[str, list[str]]:
    """Return (header line ending with VALUES, list of value lines without header)."""
    lines = text.splitlines()
    header_idx = None
    for i, line in enumerate(lines):
        if "INSERT INTO" in line and "pmw_message" in line and "VALUES" in line:
            header_idx = i
            break
    if header_idx is None:
        raise ValueError("Could not find INSERT INTO `pmw_message` ... VALUES in file")

    header = lines[header_idx].strip()
    value_lines: list[str] = []
    for line in lines[header_idx + 1 :]:
        s = line.strip()
        if not s or s.startswith("--"):
            continue
        if VALUE_LINE.match(s):
            value_lines.append(s)
    if not value_lines:
        raise ValueError("No value rows found after INSERT header")
    return header, value_lines


def ids_from_value_lines(value_lines: list[str]) -> list[int]:
    out: list[int] = []
    for s in value_lines:
        m = VALUE_LINE.match(s)
        if m:
            out.append(int(m.group(1)))
    return out


def remap_line_leading_id(line: str, offset: int) -> str:
    m = VALUE_LINE.match(line.strip())
    if not m:
        return line
    old = int(m.group(1))
    new_id = old + offset
    stripped = line.strip()
    return VALUE_LINE.sub(f"({new_id},", stripped, count=1)


def ensure_comma_not_semicolon(s: str) -> str:
    s = s.rstrip()
    if s.endswith(");"):
        return s[:-2] + "),"
    if s.endswith(","):
        return s
    return s + ","


def ensure_semicolon(s: str) -> str:
    s = s.rstrip().rstrip(",")
    if s.endswith(");"):
        return s
    if s.endswith(")"):
        return s + ";"
    return s + ";"


def apply_id_shift_all(lines: list[str], extra_offset: int) -> list[str]:
    if extra_offset == 0:
        return lines
    n = len(lines)
    out: list[str] = []
    for i, row in enumerate(lines):
        mapped = remap_line_leading_id(row, extra_offset)
        out.append(
            ensure_comma_not_semicolon(mapped) if i < n - 1 else ensure_semicolon(mapped)
        )
    return out


def merge_sql(
    primary_path: Path, secondary_path: Path, ensure_above_id: int | None
) -> str:
    h1, v1 = extract_insert_parts(read_text(primary_path))
    _, v2 = extract_insert_parts(read_text(secondary_path))

    ids1 = ids_from_value_lines(v1)
    ids2 = ids_from_value_lines(v2)
    max1 = max(ids1)
    min2 = min(ids2)
    offset = max(0, max1 - min2 + 1)

    body: list[str] = []
    for row in v1:
        body.append(ensure_comma_not_semicolon(row.strip()))

    for i, row in enumerate(v2):
        mapped = remap_line_leading_id(row, offset)
        body.append(
            ensure_comma_not_semicolon(mapped)
            if i < len(v2) - 1
            else ensure_semicolon(mapped.rstrip().rstrip(","))
        )

    all_ids = ids1 + [x + offset for x in ids2]
    min_all, max_all = min(all_ids), max(all_ids)
    report = (
        f"-- merge_pmw_message_sql: primary rows={len(v1)} max_id={max1}, "
        f"secondary rows={len(v2)} min_id={min2} max_id={max(ids2)}, "
        f"id_offset applied to secondary={offset}, merged id range {min_all}..{max_all}"
    )

    extra = 0
    if ensure_above_id is not None and ensure_above_id >= 0:
        merged_ids = ids_from_value_lines(body)
        min_m = min(merged_ids)
        extra = max(0, ensure_above_id - min_m + 1)
        if extra > 0:
            body = apply_id_shift_all(body, extra)
            fid = ids_from_value_lines(body)
            report += (
                f", ensure_above_id={ensure_above_id}, extra_shift={extra}, "
                f"final id range {min(fid)}..{max(fid)}"
            )
        else:
            report += f", ensure_above_id={ensure_above_id} (no extra shift)"

    parts = [report, "", h1, ""] + body + [""]
    return "\n".join(parts)


def main() -> int:
    ap = argparse.ArgumentParser(description="Merge two pmw_message INSERT dumps without id collisions.")
    ap.add_argument("primary_sql", type=Path, help="First file: ids are kept as-is")
    ap.add_argument("secondary_sql", type=Path, help="Second file: ids are shifted up if needed")
    ap.add_argument("-o", "--output", type=Path, required=True, help="Output .sql path")
    ap.add_argument(
        "-b",
        "--ensure-above-id",
        type=int,
        default=None,
        metavar="N",
        help="Shift ALL ids so min(id) > N (use SELECT MAX(id) FROM pmw_message)",
    )
    args = ap.parse_args()

    merged = merge_sql(args.primary_sql, args.secondary_sql, args.ensure_above_id)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(merged, encoding="utf-8")
    print(f"Wrote {args.output} ({len(merged)} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
