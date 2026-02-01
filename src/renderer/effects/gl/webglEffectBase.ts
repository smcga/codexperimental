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
  1: 0.7,
  2: 1.0,
  3: 1.3
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

  constructor(private fragmentShaderSource: string, private effectName: string) {
    this.init();
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

    const gl = this.gl;
    const qualityScale = QUALITY_SCALES[quality] ?? QUALITY_SCALES[2];
    const internalWidth = Math.max(1, Math.floor(width * qualityScale));
    const internalHeight = Math.max(1, Math.floor(height * qualityScale));
    this.resize(internalWidth, internalHeight);

    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    gl.viewport(0, 0, internalWidth, internalHeight);

    const resolvedUniforms = { ...uniforms, resolution: [internalWidth, internalHeight] as [number, number] };
    this.setUniforms(resolvedUniforms);

    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.framebuffer);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    gl.blitFramebuffer(
      0,
      0,
      internalWidth,
      internalHeight,
      0,
      0,
      internalWidth,
      internalHeight,
      gl.COLOR_BUFFER_BIT,
      gl.NEAREST
    );

    ctx.drawImage(this.canvas, 0, 0, width, height);
    setWebGLStatus({ mode: "ok" });
    return true;
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
    const program = this.createProgram(gl, VERTEX_SHADER_SOURCE, this.fragmentShaderSource);
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
      u_hueShift: gl.getUniformLocation(program, "u_hueShift"),
      u_exposure: gl.getUniformLocation(program, "u_exposure"),
      u_seed: gl.getUniformLocation(program, "u_seed"),
      u_steps: gl.getUniformLocation(program, "u_steps")
    };

    gl.disable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
  }

  private resize(width: number, height: number): void {
    if (!this.canvas || !this.gl || !this.framebuffer || !this.colorTexture) {
      return;
    }
    if (this.size.width === width && this.size.height === height) {
      return;
    }
    this.size = { width, height };
    this.canvas.width = width;
    this.canvas.height = height;

    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.colorTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.colorTexture, 0);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  private setUniforms(payload: WebGLUniformPayload): void {
    if (!this.gl) {
      return;
    }
    const gl = this.gl;
    const set1f = (name: keyof WebGLUniformPayload, value: number): void => {
      const location = this.uniformLocations[`u_${name}`];
      if (location) {
        gl.uniform1f(location, value);
      }
    };
    const resLocation = this.uniformLocations.u_resolution;
    if (resLocation) {
      gl.uniform2f(resLocation, payload.resolution[0], payload.resolution[1]);
    }
    set1f("time", payload.time);
    set1f("rms", payload.rms);
    set1f("bass", payload.bass);
    set1f("mid", payload.mid);
    set1f("treble", payload.treble);
    set1f("beat", payload.beat);
    set1f("beatStrength", payload.beatStrength);
    set1f("warp", payload.warp);
    set1f("hueShift", payload.hueShift);
    set1f("exposure", payload.exposure);
    set1f("seed", payload.seed);

    const stepsLocation = this.uniformLocations.u_steps;
    if (stepsLocation) {
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
