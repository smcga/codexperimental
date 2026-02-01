type UniformLocations = {
  u_time: WebGLUniformLocation | null;
  u_resolution: WebGLUniformLocation | null;
  u_rms: WebGLUniformLocation | null;
  u_bass: WebGLUniformLocation | null;
  u_mid: WebGLUniformLocation | null;
  u_treble: WebGLUniformLocation | null;
  u_beat: WebGLUniformLocation | null;
  u_beatStrength: WebGLUniformLocation | null;
  u_quality: WebGLUniformLocation | null;
  u_warp: WebGLUniformLocation | null;
  u_hueShift: WebGLUniformLocation | null;
  u_exposure: WebGLUniformLocation | null;
  u_seed: WebGLUniformLocation | null;
};

export type WebGLUniforms = {
  time: number;
  resolution: [number, number];
  rms: number;
  bass: number;
  mid: number;
  treble: number;
  beat: number;
  beatStrength: number;
  quality: number;
  warp: number;
  hueShift: number;
  exposure: number;
  seed: number;
};

const VERTEX_SHADER_SOURCE = `#version 300 es
in vec2 a_position;
out vec2 v_uv;

void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

export class WebGLEffectBase {
  readonly canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private vao: WebGLVertexArrayObject;
  private framebuffer: WebGLFramebuffer | null = null;
  private colorTexture: WebGLTexture | null = null;
  private width = 1;
  private height = 1;
  private uniforms: UniformLocations;

  constructor(fragmentSource: string, canvas?: HTMLCanvasElement) {
    const glCanvas = canvas ?? document.createElement("canvas");
    const gl = glCanvas.getContext("webgl2");
    if (!gl) {
      throw new Error("WebGL2 unavailable");
    }
    this.canvas = glCanvas;
    this.gl = gl;
    this.program = this.createProgram(fragmentSource);
    this.vao = this.createFullScreenVao();
    this.uniforms = this.resolveUniformLocations();
  }

  render(ctx2d: CanvasRenderingContext2D, targetWidth: number, targetHeight: number, uniforms: WebGLUniforms): void {
    const gl = this.gl;
    this.ensureSize(uniforms.resolution[0], uniforms.resolution[1]);
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    gl.viewport(0, 0, this.width, this.height);
    this.setUniforms(uniforms);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);

    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.framebuffer);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    gl.blitFramebuffer(0, 0, this.width, this.height, 0, 0, this.width, this.height, gl.COLOR_BUFFER_BIT, gl.NEAREST);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    ctx2d.drawImage(this.canvas, 0, 0, targetWidth, targetHeight);
  }

  private createProgram(fragmentSource: string): WebGLProgram {
    const gl = this.gl;
    const vertexShader = this.compileShader(gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
    const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fragmentSource);
    const program = gl.createProgram();
    if (!program) {
      throw new Error("Unable to create WebGL program");
    }
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.bindAttribLocation(program, 0, "a_position");
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(program) ?? "Unknown WebGL program error";
      gl.deleteProgram(program);
      throw new Error(info);
    }
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return program;
  }

  private compileShader(type: number, source: string): WebGLShader {
    const gl = this.gl;
    const shader = gl.createShader(type);
    if (!shader) {
      throw new Error("Unable to create shader");
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader) ?? "Unknown shader compile error";
      gl.deleteShader(shader);
      throw new Error(info);
    }
    return shader;
  }

  private createFullScreenVao(): WebGLVertexArrayObject {
    const gl = this.gl;
    const vao = gl.createVertexArray();
    if (!vao) {
      throw new Error("Unable to create WebGL VAO");
    }
    gl.bindVertexArray(vao);
    const buffer = gl.createBuffer();
    if (!buffer) {
      throw new Error("Unable to create WebGL buffer");
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    const vertices = new Float32Array([-1, -1, 3, -1, -1, 3]);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    return vao;
  }

  private resolveUniformLocations(): UniformLocations {
    const gl = this.gl;
    const get = (name: string) => gl.getUniformLocation(this.program, name);
    return {
      u_time: get("u_time"),
      u_resolution: get("u_resolution"),
      u_rms: get("u_rms"),
      u_bass: get("u_bass"),
      u_mid: get("u_mid"),
      u_treble: get("u_treble"),
      u_beat: get("u_beat"),
      u_beatStrength: get("u_beatStrength"),
      u_quality: get("u_quality"),
      u_warp: get("u_warp"),
      u_hueShift: get("u_hueShift"),
      u_exposure: get("u_exposure"),
      u_seed: get("u_seed")
    };
  }

  private setUniforms(uniforms: WebGLUniforms): void {
    const gl = this.gl;
    if (this.uniforms.u_time) {
      gl.uniform1f(this.uniforms.u_time, uniforms.time);
    }
    if (this.uniforms.u_resolution) {
      gl.uniform2f(this.uniforms.u_resolution, uniforms.resolution[0], uniforms.resolution[1]);
    }
    if (this.uniforms.u_rms) {
      gl.uniform1f(this.uniforms.u_rms, uniforms.rms);
    }
    if (this.uniforms.u_bass) {
      gl.uniform1f(this.uniforms.u_bass, uniforms.bass);
    }
    if (this.uniforms.u_mid) {
      gl.uniform1f(this.uniforms.u_mid, uniforms.mid);
    }
    if (this.uniforms.u_treble) {
      gl.uniform1f(this.uniforms.u_treble, uniforms.treble);
    }
    if (this.uniforms.u_beat) {
      gl.uniform1f(this.uniforms.u_beat, uniforms.beat);
    }
    if (this.uniforms.u_beatStrength) {
      gl.uniform1f(this.uniforms.u_beatStrength, uniforms.beatStrength);
    }
    if (this.uniforms.u_quality) {
      gl.uniform1f(this.uniforms.u_quality, uniforms.quality);
    }
    if (this.uniforms.u_warp) {
      gl.uniform1f(this.uniforms.u_warp, uniforms.warp);
    }
    if (this.uniforms.u_hueShift) {
      gl.uniform1f(this.uniforms.u_hueShift, uniforms.hueShift);
    }
    if (this.uniforms.u_exposure) {
      gl.uniform1f(this.uniforms.u_exposure, uniforms.exposure);
    }
    if (this.uniforms.u_seed) {
      gl.uniform1f(this.uniforms.u_seed, uniforms.seed);
    }
  }

  private ensureSize(width: number, height: number): void {
    if (width === this.width && height === this.height) {
      return;
    }
    this.width = Math.max(1, Math.floor(width));
    this.height = Math.max(1, Math.floor(height));
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    const gl = this.gl;
    if (this.colorTexture) {
      gl.deleteTexture(this.colorTexture);
    }
    if (this.framebuffer) {
      gl.deleteFramebuffer(this.framebuffer);
    }
    const texture = gl.createTexture();
    if (!texture) {
      throw new Error("Unable to create WebGL texture");
    }
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const framebuffer = gl.createFramebuffer();
    if (!framebuffer) {
      throw new Error("Unable to create WebGL framebuffer");
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.framebuffer = framebuffer;
    this.colorTexture = texture;
  }
}
