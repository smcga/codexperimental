export type WebGLStatus = "ok" | "fallback";

let currentStatus: WebGLStatus = "ok";

export function setWebGLStatus(status: WebGLStatus): void {
  currentStatus = status;
}

export function getWebGLStatusLabel(): "OK" | "FALLBACK" {
  return currentStatus === "ok" ? "OK" : "FALLBACK";
}
