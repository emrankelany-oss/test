import { VERT, SIM_FRAG, LIGHT_FRAG } from "./shaders.js";

// Tuned defaults: single image (no tiling), tight intense blue lamp, near-black base.
const DEFAULTS = {
  radius: 240, riseSpeed: 0.25, decaySpeed: 0.015, spread: 0.32, simScale: 0.4,
  lowColor: [0.05, 0.06, 0.08], highColor: [0.45, 0.78, 0.95],
  backgroundColor: [0.03, 0.04, 0.05, 1],
  reliefIntensity: 28, parallax: 12, baseAmbient: 0.06, activeAmbient: 0.28,
  diffuse: 3.0, specular: 2.6, shininess: 28,
  textureBrightnessPower: 0.8, textureBrightnessMin: 0.3, textureBrightnessMax: 1,
  minAlpha: 0.0, mouseLightHeight: 140, mouseLightRadius: 220,
  mouseLightIntensity: 1.6, shadowStrength: 0.4,
  repeatX: 1, repeatY: 1, dprCap: 2,
};

export class ReliefLampEngine {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.options = { ...DEFAULTS, ...options };
    this.mouse = { x: -9999, y: -9999 };
    this.scrollY = 0;
    this.width = 0; this.height = 0;
    this.simW = 0; this.simH = 0;
    this.dpr = Math.min(window.devicePixelRatio || 1, this.options.dprCap);
    this.ping = 0;
    this.heightTex = []; this.heightFbo = [];
    this.imageTexture = null; this.imgRes = [1, 1]; this.hasImage = false;
    this.raf = 0; this.isPaused = false;
    this.loopTick = () => this.loop();

    const gl = canvas.getContext("webgl", {
      alpha: false, depth: false, antialias: false, premultipliedAlpha: false,
    });
    if (!gl) throw new Error("WebGL not supported");
    this.gl = gl;
    this.initGL();
  }

  compileShader(type, src) {
    const gl = this.gl;
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(s);
      gl.deleteShader(s);
      throw new Error("Shader compile failed: " + log);
    }
    return s;
  }

  linkProgram(vsSrc, fsSrc) {
    const gl = this.gl;
    const vs = this.compileShader(gl.VERTEX_SHADER, vsSrc);
    const fs = this.compileShader(gl.FRAGMENT_SHADER, fsSrc);
    const p = gl.createProgram();
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.bindAttribLocation(p, 0, "a_position");
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(p);
      gl.deleteProgram(p);
      throw new Error("Program link failed: " + log);
    }
    gl.deleteShader(vs); gl.deleteShader(fs);
    return p;
  }

  initGL() {
    const gl = this.gl;
    this.progUpdate = this.linkProgram(VERT, SIM_FRAG);
    this.progRender = this.linkProgram(VERT, LIGHT_FRAG);

    this.vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    const u = (prog, name) => gl.getUniformLocation(prog, name);
    this.uUpdate = {
      prev: u(this.progUpdate, "u_prev"), tex: u(this.progUpdate, "u_tex"),
      simRes: u(this.progUpdate, "u_simRes"), resolution: u(this.progUpdate, "u_resolution"),
      imgRes: u(this.progUpdate, "u_imgRes"), repeat: u(this.progUpdate, "u_repeat"),
      scrollY: u(this.progUpdate, "u_scrollY"), mouse: u(this.progUpdate, "u_mouse"),
      radius: u(this.progUpdate, "u_radius"), rise: u(this.progUpdate, "u_rise"),
      decay: u(this.progUpdate, "u_decay"), spread: u(this.progUpdate, "u_spread"),
      tbp: u(this.progUpdate, "u_texBrightnessPower"),
      tbmin: u(this.progUpdate, "u_texBrightnessMin"),
      tbmax: u(this.progUpdate, "u_texBrightnessMax"),
    };
    this.uRender = {
      height: u(this.progRender, "u_height"), tex: u(this.progRender, "u_tex"),
      resolution: u(this.progRender, "u_resolution"), simRes: u(this.progRender, "u_simRes"),
      imgRes: u(this.progRender, "u_imgRes"), scrollY: u(this.progRender, "u_scrollY"),
      repeat: u(this.progRender, "u_repeat"),
      lowColor: u(this.progRender, "u_lowColor"), highColor: u(this.progRender, "u_highColor"),
      minAlpha: u(this.progRender, "u_minAlpha"),
      reliefIntensity: u(this.progRender, "u_reliefIntensity"),
      parallax: u(this.progRender, "u_parallax"),
      baseAmbient: u(this.progRender, "u_baseAmbient"),
      activeAmbient: u(this.progRender, "u_activeAmbient"),
      diffuse: u(this.progRender, "u_diffuse"), specular: u(this.progRender, "u_specular"),
      shininess: u(this.progRender, "u_shininess"), mouse: u(this.progRender, "u_mouse"),
      mlh: u(this.progRender, "u_mouseLightHeight"),
      mlr: u(this.progRender, "u_mouseLightRadius"),
      mli: u(this.progRender, "u_mouseLightIntensity"),
      shadow: u(this.progRender, "u_shadowStrength"),
      hasImage: u(this.progRender, "u_hasImage"),
    };

    const [r, g, b, a] = this.options.backgroundColor;
    gl.clearColor(r, g, b, a);
    gl.disable(gl.DEPTH_TEST);
  }

  createHeightTarget(w, h) {
    const gl = this.gl;
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    return { tex, fbo };
  }

  allocTargets() {
    const gl = this.gl;
    for (const t of this.heightTex) gl.deleteTexture(t);
    for (const f of this.heightFbo) gl.deleteFramebuffer(f);
    this.heightTex = []; this.heightFbo = [];
    this.simW = Math.max(2, Math.floor(this.width * this.options.simScale));
    this.simH = Math.max(2, Math.floor(this.height * this.options.simScale));
    for (let i = 0; i < 2; i++) {
      const { tex, fbo } = this.createHeightTarget(this.simW, this.simH);
      this.heightTex.push(tex); this.heightFbo.push(fbo);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  resize(cssW, cssH) {
    const w = Math.max(1, Math.floor(cssW));
    const h = Math.max(1, Math.floor(cssH));
    this.width = Math.floor(w * this.dpr);
    this.height = Math.floor(h * this.dpr);
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.style.width = w + "px";
    this.canvas.style.height = h + "px";
    this.allocTargets();
  }

  setImage(url) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => {
      const gl = this.gl;
      if (this.imageTexture) gl.deleteTexture(this.imageTexture);
      this.imageTexture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.imageTexture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      this.imgRes = [img.naturalWidth, img.naturalHeight];
      this.hasImage = true;
    };
    img.onerror = () => { this.hasImage = false; };
    img.src = url;
  }

  setScroll(y) { this.scrollY = y; }
  setMouse(x, y) { this.mouse.x = x; this.mouse.y = y; }
  clearMouse() { this.mouse.x = -9999; this.mouse.y = -9999; }

  start() { if (!this.raf) this.raf = requestAnimationFrame(this.loopTick); }
  pause() { this.isPaused = true; if (this.raf) { cancelAnimationFrame(this.raf); this.raf = 0; } }
  resume() { if (this.isPaused) { this.isPaused = false; if (!this.raf) this.raf = requestAnimationFrame(this.loopTick); } }

  loop() {
    this.raf = 0;
    if (this.isPaused) return;
    const gl = this.gl;
    const o = this.options;
    const i = this.ping, t = 1 - this.ping;

    // --- Sim pass ---
    gl.useProgram(this.progUpdate);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.heightFbo[t]);
    gl.viewport(0, 0, this.simW, this.simH);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.heightTex[i]);
    gl.uniform1i(this.uUpdate.prev, 0);
    if (this.hasImage) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.imageTexture);
      gl.uniform1i(this.uUpdate.tex, 1);
    }
    const mx = this.mouse.x * this.dpr * (this.simW / this.width);
    const my = (this.height - this.mouse.y * this.dpr) * (this.simH / this.height);
    gl.uniform2f(this.uUpdate.simRes, this.simW, this.simH);
    gl.uniform2f(this.uUpdate.resolution, this.width, this.height);
    gl.uniform2f(this.uUpdate.imgRes, this.imgRes[0], this.imgRes[1]);
    gl.uniform2f(this.uUpdate.repeat, o.repeatX, o.repeatY);
    gl.uniform1f(this.uUpdate.scrollY, this.scrollY * this.dpr);
    gl.uniform2f(this.uUpdate.mouse, mx, my);
    gl.uniform1f(this.uUpdate.radius, o.radius * this.options.simScale);
    gl.uniform1f(this.uUpdate.rise, o.riseSpeed);
    gl.uniform1f(this.uUpdate.decay, o.decaySpeed);
    gl.uniform1f(this.uUpdate.spread, o.spread);
    gl.uniform1f(this.uUpdate.tbp, o.textureBrightnessPower);
    gl.uniform1f(this.uUpdate.tbmin, o.textureBrightnessMin);
    gl.uniform1f(this.uUpdate.tbmax, o.textureBrightnessMax);
    this.drawQuad(this.progUpdate);

    // --- Lighting pass ---
    gl.useProgram(this.progRender);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.width, this.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.heightTex[t]);
    gl.uniform1i(this.uRender.height, 0);
    if (this.hasImage) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.imageTexture);
      gl.uniform1i(this.uRender.tex, 1);
    }
    gl.uniform2f(this.uRender.resolution, this.width, this.height);
    gl.uniform2f(this.uRender.simRes, this.simW, this.simH);
    gl.uniform2f(this.uRender.imgRes, this.imgRes[0], this.imgRes[1]);
    gl.uniform1f(this.uRender.scrollY, this.scrollY * this.dpr);
    gl.uniform2f(this.uRender.repeat, o.repeatX, o.repeatY);
    gl.uniform3fv(this.uRender.lowColor, o.lowColor);
    gl.uniform3fv(this.uRender.highColor, o.highColor);
    gl.uniform1f(this.uRender.minAlpha, o.minAlpha);
    gl.uniform1f(this.uRender.reliefIntensity, o.reliefIntensity);
    gl.uniform1f(this.uRender.parallax, o.parallax);
    gl.uniform1f(this.uRender.baseAmbient, o.baseAmbient);
    gl.uniform1f(this.uRender.activeAmbient, o.activeAmbient);
    gl.uniform1f(this.uRender.diffuse, o.diffuse);
    gl.uniform1f(this.uRender.specular, o.specular);
    gl.uniform1f(this.uRender.shininess, o.shininess);
    gl.uniform2f(this.uRender.mouse, this.mouse.x * this.dpr, this.height - this.mouse.y * this.dpr);
    gl.uniform1f(this.uRender.mlh, o.mouseLightHeight);
    gl.uniform1f(this.uRender.mlr, o.mouseLightRadius);
    gl.uniform1f(this.uRender.mli, o.mouseLightIntensity);
    gl.uniform1f(this.uRender.shadow, o.shadowStrength);
    gl.uniform1i(this.uRender.hasImage, this.hasImage ? 1 : 0);
    this.drawQuad(this.progRender);

    this.ping = t;
    this.raf = requestAnimationFrame(this.loopTick);
  }

  drawQuad(prog) {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    const loc = gl.getAttribLocation(prog, "a_position");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  destroy() {
    this.pause();
    const gl = this.gl;
    if (this.imageTexture) gl.deleteTexture(this.imageTexture);
    for (const t of this.heightTex) gl.deleteTexture(t);
    for (const f of this.heightFbo) gl.deleteFramebuffer(f);
    if (this.vbo) gl.deleteBuffer(this.vbo);
    if (this.progUpdate) gl.deleteProgram(this.progUpdate);
    if (this.progRender) gl.deleteProgram(this.progRender);
    const ext = gl.getExtension("WEBGL_lose_context");
    if (ext) ext.loseContext();
  }
}
