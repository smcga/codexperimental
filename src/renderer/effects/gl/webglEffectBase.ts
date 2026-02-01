export type WebglEffectUniforms = {
  time: number;
  resolution: [number, number];
  audio: {
    rms: number;
    bass: number;
    mid: number;
    treble: number;
    beat: number;
    beatStrength: number;
  };
  params: {
    warp: number;
    hueShift: number;
    exposure: number;
    seed: number;
    quality: number;
    aspect: number;
  };
};

export class WebglEffectBase {
  readonly canvas: HTMLCanvasElement;
  readonly gl: WebGL2RenderingContext | null;
  private program: WebGLProgram | null = null;
  private vao: WebGLVertexArrayObject | null = null;
  private framebuffer: WebGLFramebuffer | null = null;
  private colorTexture: WebGLTexture | null = null;
  private uniformLocations: Record<string, WebGLUniformLocation | null> = {};
  private internalWidth = 0;
  private internalHeight = 0;
  private hasLoggedError = false;
  isReady = false;
  lastError: string | null = null;

  constructor(vertexSource: string, fragmentSource: string) {
    this.canvas = document.createElement("canvas");
    const gl = this.canvas.getContext("webgl2", { antialias: false, preserveDrawingBuffer: false });
    this.gl = gl;
    if (!gl) {
      this.fail("WebGL2 not supported");
      return;
    }

    const program = this.createProgram(vertexSource, fragmentSource);
    if (!program) {
      return;
    }
    this.program = program;
    this.createGeometry();
    this.cacheUniformLocations();
    this.isReady = true;
  }

  private fail(message: string): void {
    this.lastError = message;
    this.isReady = false;
    if (!this.hasLoggedError) {
      this.hasLoggedError = true;
      // eslint-disable-next-line no-console
      console.warn(`[WebGL] ${message}`);
    }
  }

  private createShader(type: number, source: string): WebGLShader | null {
    if (!this.gl) {
      return null;
    }
    const shader = this.gl.createShader(type);
    if (!shader) {
      this.fail("Unable to create shader");
      return null;
    }
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const info = this.gl.getShaderInfoLog(shader) ?? "Unknown shader error";
      this.gl.deleteShader(shader);
      this.fail(info);
      return null;
    }
    return shader;
  }

  private createProgram(vertexSource: string, fragmentSource: string): WebGLProgram | null {
    if (!this.gl) {
      return null;
    }
    const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentSource);
    if (!vertexShader || !fragmentShader) {
      return null;
    }

    const program = this.gl.createProgram();
    if (!program) {
      this.fail("Unable to create shader program");
      return null;
    }

    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    this.gl.deleteShader(vertexShader);
    this.gl.deleteShader(fragmentShader);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      const info = this.gl.getProgramInfoLog(program) ?? "Unknown program link error";
      this.gl.deleteProgram(program);
      this.fail(info);
      return null;
    }
    return program;
  }

  private createGeometry(): void {
    if (!this.gl || !this.program) {
      return;
    }
    const gl = this.gl;
    const vao = gl.createVertexArray();
    const vbo = gl.createBuffer();
    if (!vao || !vbo) {
      this.fail("Unable to create geometry buffers");
      return;
    }
    this.vao = vao;
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    const vertices = new Float32Array([-1, -1, 3, -1, -1, 3]);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    const positionLocation = gl.getAttribLocation(this.program, "a_position");
    if (positionLocation >= 0) {
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    }
    gl.bindVertexArray(null);
  }

  private cacheUniformLocations(): void {
    if (!this.gl || !this.program) {
      return;
    }
    const gl = this.gl;
    this.uniformLocations = {
      u_time: gl.getUniformLocation(this.program, "u_time"),
      u_resolution: gl.getUniformLocation(this.program, "u_resolution"),
      u_rms: gl.getUniformLocation(this.program, "u_rms"),
      u_bass: gl.getUniformLocation(this.program, "u_bass"),
      u_mid: gl.getUniformLocation(this.program, "u_mid"),
      u_treble: gl.getUniformLocation(this.program, "u_treble"),
      u_beat: gl.getUniformLocation(this.program, "u_beat"),
      u_beatStrength: gl.getUniformLocation(this.program, "u_beatStrength"),
      u_warp: gl.getUniformLocation(this.program, "u_warp"),
      u_hueShift: gl.getUniformLocation(this.program, "u_hueShift"),
      u_exposure: gl.getUniformLocation(this.program, "u_exposure"),
      u_seed: gl.getUniformLocation(this.program, "u_seed"),
      u_quality: gl.getUniformLocation(this.program, "u_quality"),
      u_aspect: gl.getUniformLocation(this.program, "u_aspect")
    };
  }

  resize(width: number, height: number, scale: number): void {
    if (!this.gl || !this.program) {
      return;
    }
    const nextWidth = Math.max(1, Math.floor(width * scale));
    const nextHeight = Math.max(1, Math.floor(height * scale));
    if (nextWidth === this.internalWidth && nextHeight === this.internalHeight) {
      return;
    }

    this.internalWidth = nextWidth;
    this.internalHeight = nextHeight;
    this.canvas.width = nextWidth;
    this.canvas.height = nextHeight;

    const gl = this.gl;
    if (this.framebuffer) {
      gl.deleteFramebuffer(this.framebuffer);
      this.framebuffer = null;
    }
    if (this.colorTexture) {
      gl.deleteTexture(this.colorTexture);
      this.colorTexture = null;
    }

    const texture = gl.createTexture();
    const framebuffer = gl.createFramebuffer();
    if (!texture || !framebuffer) {
      this.fail("Unable to create framebuffer resources");
      return;
    }

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, nextWidth, nextHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
      this.fail("Framebuffer incomplete");
      return;
    }

    this.colorTexture = texture;
    this.framebuffer = framebuffer;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  setUniforms(uniforms: WebglEffectUniforms): void {
    if (!this.gl || !this.program) {
      return;
    }
    const gl = this.gl;
    gl.useProgram(this.program);
    const locations = this.uniformLocations;
    if (locations.u_time) {
      gl.uniform1f(locations.u_time, uniforms.time);
    }
    if (locations.u_resolution) {
      gl.uniform2f(locations.u_resolution, uniforms.resolution[0], uniforms.resolution[1]);
    }
    if (locations.u_rms) {
      gl.uniform1f(locations.u_rms, uniforms.audio.rms);
    }
    if (locations.u_bass) {
      gl.uniform1f(locations.u_bass, uniforms.audio.bass);
    }
    if (locations.u_mid) {
      gl.uniform1f(locations.u_mid, uniforms.audio.mid);
    }
    if (locations.u_treble) {
      gl.uniform1f(locations.u_treble, uniforms.audio.treble);
    }
    if (locations.u_beat) {
      gl.uniform1f(locations.u_beat, uniforms.audio.beat);
    }
    if (locations.u_beatStrength) {
      gl.uniform1f(locations.u_beatStrength, uniforms.audio.beatStrength);
    }
    if (locations.u_warp) {
      gl.uniform1f(locations.u_warp, uniforms.params.warp);
    }
    if (locations.u_hueShift) {
      gl.uniform1f(locations.u_hueShift, uniforms.params.hueShift);
    }
    if (locations.u_exposure) {
      gl.uniform1f(locations.u_exposure, uniforms.params.exposure);
    }
    if (locations.u_seed) {
      gl.uniform1f(locations.u_seed, uniforms.params.seed);
    }
    if (locations.u_quality) {
      gl.uniform1f(locations.u_quality, uniforms.params.quality);
    }
    if (locations.u_aspect) {
      gl.uniform1f(locations.u_aspect, uniforms.params.aspect);
    }
  }

  renderFrame(): void {
    if (!this.gl || !this.program || !this.framebuffer || !this.vao) {
      return;
    }
    const gl = this.gl;
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    gl.viewport(0, 0, this.internalWidth, this.internalHeight);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.framebuffer);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    gl.blitFramebuffer(
      0,
      0,
      this.internalWidth,
      this.internalHeight,
      0,
      0,
      this.canvas.width,
      this.canvas.height,
      gl.COLOR_BUFFER_BIT,
      gl.LINEAR
    );
    gl.bindVertexArray(null);
  }

  drawToCanvas2D(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): void {
    ctx.drawImage(this.canvas, x, y, width, height);
  }
}
