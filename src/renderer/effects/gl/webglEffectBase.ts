import { setWebGLStatus } from "./webglStatus";

export type WebGLUniformPayload = {
  time: number;
  resolution: [number, number];
  rms: number;
  bass: number;
  mid: number;
  treble: number;
  beat: number;
  beatStrength: number;
  warp: number;
  hueShift: number;
  exposure: number;
  seed: number;
  steps: number;
  quality?: number;
  aspect?: number;
  speed?: number;
  camOffset?: [number, number];
  mode?: number;
  cameraRadius?: number;
  cameraHeight?: number;
  cameraOrbitSpeed?: number;
  paletteSpeed?: number;
  audioReact?: number;
  beatKick?: number;
  fractalScale?: number;
};

const VERTEX_SHADER_SOURCE = `#version 300 es
precision highp float;

const vec2 positions[3] = vec2[3](
  vec2(-1.0, -1.0),
  vec2(3.0, -1.0),
  vec2(-1.0, 3.0)
);

void main() {
  gl_Position = vec4(positions[gl_VertexID], 0.0, 1.0);
}
`;

const QUALITY_SCALES: Record<number, number> = {
  1: 0.85,
  2: 1.1,
  3: 1.4
};

export class WebGLEffectBase {
  private canvas: HTMLCanvasElement | null = null;
  private gl: WebGL2RenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private vao: WebGLVertexArrayObject | null = null;
  private framebuffer: WebGLFramebuffer | null = null;
  private colorTexture: WebGLTexture | null = null;
  private uniformLocations: Record<string, WebGLUniformLocation | null> = {};
  private size = { width: 0, height: 0 };
  private errorMessage: string | null = null;
  private warned = false;

  constructor(
    private fragmentShaderSource: string,
    private effectName: string,
    private vertexShaderSource: string = VERTEX_SHADER_SOURCE
  ) {
    this.init();
  }

  get lastError(): string | null {
    return this.errorMessage;
  }

  renderToCanvas2D(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    uniforms: WebGLUniformPayload,
    quality: number
  ): boolean {
    if (!this.gl || !this.program || !this.canvas || this.errorMessage) {
      this.setFallbackStatus(this.errorMessage ?? "WebGL2 unavailable");
      return false;
    }

    const qualityScale = QUALITY_SCALES[quality] ?? QUALITY_SCALES[2];
    this.resize(width, height, qualityScale);

    const rendered = this.renderFrame(uniforms);
    if (!rendered) {
      return false;
    }
    this.drawToCanvas2D(ctx, 0, 0, width, height);
    return true;
  }

  renderFrame(uniforms: WebGLUniformPayload): boolean {
    if (!this.gl || !this.program || !this.canvas || this.errorMessage) {
      this.setFallbackStatus(this.errorMessage ?? "WebGL2 unavailable");
      return false;
    }

    const gl = this.gl;
    const { width, height } = this.size;
    if (width === 0 || height === 0) {
      return false;
    }

    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    gl.viewport(0, 0, width, height);

    const resolvedUniforms = { ...uniforms, resolution: [width, height] as [number, number] };
    this.setUniforms(resolvedUniforms);

    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.framebuffer);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    gl.blitFramebuffer(0, 0, width, height, 0, 0, width, height, gl.COLOR_BUFFER_BIT, gl.NEAREST);

    setWebGLStatus({ mode: "ok" });
    return true;
  }

  drawToCanvas2D(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): void {
    if (!this.canvas) {
      return;
    }
    ctx.drawImage(this.canvas, x, y, width, height);
  }

  private init(): void {
    this.canvas = document.createElement("canvas");
    const gl = this.canvas.getContext("webgl2", { antialias: false, preserveDrawingBuffer: false });
    if (!gl) {
      this.errorMessage = "WebGL2 unavailable";
      this.setFallbackStatus(this.errorMessage);
      return;
    }
    this.gl = gl;
    const program = this.createProgram(gl, this.vertexShaderSource, this.fragmentShaderSource);
    if (!program) {
      this.errorMessage = "WebGL2 shader compile failed";
      this.setFallbackStatus(this.errorMessage);
      return;
    }
    this.program = program;
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);

    this.framebuffer = gl.createFramebuffer();
    this.colorTexture = gl.createTexture();
    if (!this.framebuffer || !this.colorTexture) {
      this.errorMessage = "WebGL2 framebuffer allocation failed";
      this.setFallbackStatus(this.errorMessage);
      return;
    }

    this.uniformLocations = {
      u_time: gl.getUniformLocation(program, "u_time"),
      u_resolution: gl.getUniformLocation(program, "u_resolution"),
      u_rms: gl.getUniformLocation(program, "u_rms"),
      u_bass: gl.getUniformLocation(program, "u_bass"),
      u_mid: gl.getUniformLocation(program, "u_mid"),
      u_treble: gl.getUniformLocation(program, "u_treble"),
      u_beat: gl.getUniformLocation(program, "u_beat"),
      u_beatStrength: gl.getUniformLocation(program, "u_beatStrength"),
      u_warp: gl.getUniformLocation(program, "u_warp"),
      u_speed: gl.getUniformLocation(program, "u_speed"),
      u_camOffset: gl.getUniformLocation(program, "u_camOffset"),
      u_hueShift: gl.getUniformLocation(program, "u_hueShift"),
      u_exposure: gl.getUniformLocation(program, "u_exposure"),
      u_seed: gl.getUniformLocation(program, "u_seed"),
      u_steps: gl.getUniformLocation(program, "u_steps"),
      u_quality: gl.getUniformLocation(program, "u_quality"),
      u_aspect: gl.getUniformLocation(program, "u_aspect"),
      u_mode: gl.getUniformLocation(program, "u_mode"),
      u_cameraRadius: gl.getUniformLocation(program, "u_cameraRadius"),
      u_cameraHeight: gl.getUniformLocation(program, "u_cameraHeight"),
      u_cameraOrbitSpeed: gl.getUniformLocation(program, "u_cameraOrbitSpeed"),
      u_paletteSpeed: gl.getUniformLocation(program, "u_paletteSpeed"),
      u_audioReact: gl.getUniformLocation(program, "u_audioReact"),
      u_beatKick: gl.getUniformLocation(program, "u_beatKick"),
      u_fractalScale: gl.getUniformLocation(program, "u_fractalScale")
    };

    gl.disable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
  }

  resize(width: number, height: number, scale = 1): void {
    if (!this.canvas || !this.gl || !this.framebuffer || !this.colorTexture) {
      return;
    }
    const internalWidth = Math.max(1, Math.floor(width * scale));
    const internalHeight = Math.max(1, Math.floor(height * scale));
    if (this.size.width === internalWidth && this.size.height === internalHeight) {
      return;
    }
    this.size = { width: internalWidth, height: internalHeight };
    this.canvas.width = internalWidth;
    this.canvas.height = internalHeight;

    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.colorTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, internalWidth, internalHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.colorTexture, 0);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  setUniforms(payload: WebGLUniformPayload): void {
    if (!this.gl) {
      return;
    }
    const gl = this.gl;
    const set1f = (uniformName: string, value: number | undefined): void => {
      if (typeof value !== "number" || !Number.isFinite(value)) {
        return;
      }
      const location = this.uniformLocations[uniformName];
      if (location) {
        gl.uniform1f(location, value);
      }
    };
    const resLocation = this.uniformLocations.u_resolution;
    if (resLocation) {
      gl.uniform2f(resLocation, payload.resolution[0], payload.resolution[1]);
    }
    set1f("u_time", payload.time);
    set1f("u_rms", payload.rms);
    set1f("u_bass", payload.bass);
    set1f("u_mid", payload.mid);
    set1f("u_treble", payload.treble);
    set1f("u_beat", payload.beat);
    set1f("u_beatStrength", payload.beatStrength);
    set1f("u_warp", payload.warp);
    set1f("u_speed", payload.speed);
    set1f("u_hueShift", payload.hueShift);
    set1f("u_exposure", payload.exposure);
    set1f("u_seed", payload.seed);
    set1f("u_quality", payload.quality);
    set1f("u_aspect", payload.aspect);
    set1f("u_cameraRadius", payload.cameraRadius);
    set1f("u_cameraHeight", payload.cameraHeight);
    set1f("u_cameraOrbitSpeed", payload.cameraOrbitSpeed);
    set1f("u_paletteSpeed", payload.paletteSpeed);
    set1f("u_audioReact", payload.audioReact);
    set1f("u_beatKick", payload.beatKick);
    set1f("u_fractalScale", payload.fractalScale);

    const modeLocation = this.uniformLocations.u_mode;
    if (modeLocation && Number.isFinite(payload.mode)) {
      gl.uniform1i(modeLocation, payload.mode ?? 0);
    }

    const camOffsetLocation = this.uniformLocations.u_camOffset;
    if (camOffsetLocation && payload.camOffset) {
      gl.uniform2f(camOffsetLocation, payload.camOffset[0], payload.camOffset[1]);
    }

    const stepsLocation = this.uniformLocations.u_steps;
    if (stepsLocation && Number.isFinite(payload.steps)) {
      gl.uniform1i(stepsLocation, payload.steps);
    }
  }

  private createProgram(gl: WebGL2RenderingContext, vertexSource: string, fragmentSource: string): WebGLProgram | null {
    const vertexShader = this.compileShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this.compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    if (!vertexShader || !fragmentShader) {
      return null;
    }
    const program = gl.createProgram();
    if (!program) {
      return null;
    }
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(program) ?? "Unknown program link error";
      this.reportErrorOnce(`WebGL2 program link failed: ${info}`);
      gl.deleteProgram(program);
      return null;
    }
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return program;
  }

  private compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
    const shader = gl.createShader(type);
    if (!shader) {
      return null;
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader) ?? "Unknown shader compile error";
      this.reportErrorOnce(`WebGL2 shader compile failed: ${info}`);
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  private reportErrorOnce(message: string): void {
    if (this.warned) {
      return;
    }
    this.warned = true;
    console.warn(`[${this.effectName}] ${message}`);
  }

  private setFallbackStatus(reason: string): void {
    setWebGLStatus({ mode: "fallback", reason });
  }
}
