export type WebGLStatus = {
  mode: "ok" | "fallback";
  reason?: string;
};

let status: WebGLStatus = { mode: "ok" };

export function setWebGLStatus(next: WebGLStatus): void {
  status = next;
}

export function getWebGLStatus(): WebGLStatus {
  return status;
}

export function getWebGLStatusLabel(): string {
  return status.mode === "ok" ? "OK" : "FALLBACK";
}
