import { clamp } from "../../../util/math";

type SsaoPostParams = {
  radius: number;
  intensity: number;
  bias: number;
  samples: number;
  luminanceInfluence: number;
  edgeBoost: number;
};

const VERTEX_SHADER = `#version 300 es
precision highp float;

const vec2 positions[3] = vec2[3](
  vec2(-1.0, -1.0),
  vec2(3.0, -1.0),
  vec2(-1.0, 3.0)
);

out vec2 v_uv;

void main() {
  vec2 pos = positions[gl_VertexID];
  v_uv = pos * 0.5 + 0.5;
  gl_Position = vec4(pos, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform sampler2D u_source;
uniform vec2 u_resolution;
uniform float u_radius;
uniform float u_intensity;
uniform float u_bias;
uniform float u_samples;
uniform float u_luminanceInfluence;
uniform float u_edgeBoost;

const int MAX_SAMPLES = 8;
const vec2 KERNEL[MAX_SAMPLES] = vec2[MAX_SAMPLES](
  vec2(1.0, 0.0),
  vec2(0.707, 0.707),
  vec2(0.0, 1.0),
  vec2(-0.707, 0.707),
  vec2(-1.0, 0.0),
  vec2(-0.707, -0.707),
  vec2(0.0, -1.0),
  vec2(0.707, -0.707)
);

float luminance(vec3 c) {
  return dot(c, vec3(0.299, 0.587, 0.114));
}

void main() {
  vec4 centerColor = texture(u_source, v_uv);
  float lum = luminance(centerColor.rgb);
  float sampleCount = clamp(u_samples, 1.0, float(MAX_SAMPLES));
  float occlusion = 0.0;

  for (int i = 0; i < MAX_SAMPLES; i += 1) {
    if (float(i) >= sampleCount) {
      break;
    }
    vec2 pxOffset = (KERNEL[i] * u_radius) / max(u_resolution, vec2(1.0));
    vec2 sampleUv = clamp(v_uv + pxOffset, vec2(0.0), vec2(1.0));
    vec3 neighbor = texture(u_source, sampleUv).rgb;
    float nLum = luminance(neighbor);
    float diff = nLum - lum;
    float dist = max(length(pxOffset * u_resolution), 0.001);
    float rangeCheck = smoothstep(1.0, 0.0, dist / max(u_radius, 0.001));
    float lumWeight = mix(1.0, 1.0 - lum, clamp(u_luminanceInfluence, 0.0, 1.0));
    occlusion += step(u_bias, diff) * rangeCheck * lumWeight;
  }

  occlusion /= sampleCount;
  float edge = abs(dFdx(lum)) + abs(dFdy(lum));
  occlusion += edge * u_edgeBoost;
  occlusion = clamp(occlusion, 0.0, 0.92);

  float ao = clamp(1.0 - (occlusion * u_intensity), 0.2, 1.0);
  fragColor = vec4(centerColor.rgb * ao, centerColor.a);
}
`;

export class SsaoPostWebGLEffect {
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext | null;
  private program: WebGLProgram | null = null;
  private vao: WebGLVertexArrayObject | null = null;
  private sourceTexture: WebGLTexture | null = null;
  private outputTexture: WebGLTexture | null = null;
  private framebuffer: WebGLFramebuffer | null = null;
  private uniforms: Record<string, WebGLUniformLocation | null> = {};
  private width = 0;
  private height = 0;

  constructor() {
    this.canvas = document.createElement("canvas");
    this.gl = this.canvas.getContext("webgl2", { antialias: false, preserveDrawingBuffer: false });
    if (!this.gl) {
      return;
    }
    this.init(this.gl);
  }

  get available(): boolean {
    return Boolean(this.gl && this.program);
  }

  apply(source: CanvasImageSource, width: number, height: number, params: SsaoPostParams): boolean {
    if (!this.gl || !this.program || !this.sourceTexture || !this.outputTexture || !this.framebuffer) {
      return false;
    }

    this.resize(width, height);

    const gl = this.gl;
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.sourceTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    gl.viewport(0, 0, this.width, this.height);

    gl.uniform1i(this.uniforms.u_source, 0);
    gl.uniform2f(this.uniforms.u_resolution, this.width, this.height);
    gl.uniform1f(this.uniforms.u_radius, clamp(params.radius, 1, 32));
    gl.uniform1f(this.uniforms.u_intensity, clamp(params.intensity, 0, 1.2));
    gl.uniform1f(this.uniforms.u_bias, clamp(params.bias, -1, 1));
    gl.uniform1f(this.uniforms.u_samples, clamp(params.samples, 1, 8));
    gl.uniform1f(this.uniforms.u_luminanceInfluence, clamp(params.luminanceInfluence, 0, 1));
    gl.uniform1f(this.uniforms.u_edgeBoost, clamp(params.edgeBoost, 0, 2));

    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.framebuffer);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    gl.blitFramebuffer(0, 0, this.width, this.height, 0, 0, this.width, this.height, gl.COLOR_BUFFER_BIT, gl.NEAREST);
    return true;
  }

  drawTo(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.drawImage(this.canvas, 0, 0, width, height);
  }

  private init(gl: WebGL2RenderingContext): void {
    const vertex = this.compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragment = this.compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vertex || !fragment) {
      return;
    }

    const program = gl.createProgram();
    if (!program) {
      return;
    }
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      return;
    }

    this.program = program;
    this.vao = gl.createVertexArray();
    this.sourceTexture = gl.createTexture();
    this.outputTexture = gl.createTexture();
    this.framebuffer = gl.createFramebuffer();

    if (!this.vao || !this.sourceTexture || !this.outputTexture || !this.framebuffer) {
      this.program = null;
      return;
    }

    gl.bindTexture(gl.TEXTURE_2D, this.sourceTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.bindTexture(gl.TEXTURE_2D, this.outputTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    this.uniforms = {
      u_source: gl.getUniformLocation(program, "u_source"),
      u_resolution: gl.getUniformLocation(program, "u_resolution"),
      u_radius: gl.getUniformLocation(program, "u_radius"),
      u_intensity: gl.getUniformLocation(program, "u_intensity"),
      u_bias: gl.getUniformLocation(program, "u_bias"),
      u_samples: gl.getUniformLocation(program, "u_samples"),
      u_luminanceInfluence: gl.getUniformLocation(program, "u_luminanceInfluence"),
      u_edgeBoost: gl.getUniformLocation(program, "u_edgeBoost")
    };
  }

  private resize(width: number, height: number): void {
    if (!this.gl || !this.outputTexture || !this.framebuffer) {
      return;
    }
    if (this.width === width && this.height === height) {
      return;
    }
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.outputTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.outputTexture, 0);
  }

  private compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
    const shader = gl.createShader(type);
    if (!shader) {
      return null;
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      return null;
    }
    return shader;
  }
}
