/**
 * Root-absolute paths for static assets (work from any /en/briefs/… depth).
 */
export function sitePath(rel) {
  const r = String(rel).replace(/^\/+/, "");
  return `/${r}`;
}
