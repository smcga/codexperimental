export function isDebugMode(search: string): boolean {
  return new URLSearchParams(search).get("debug") === "1";
}
