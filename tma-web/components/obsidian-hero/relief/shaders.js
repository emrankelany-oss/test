// Verbatim from docs/obsidian-assembly-study.md. Do not edit the GLSL bodies.

export const VERT = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

export const SIM_FRAG = `
  precision mediump float;
  varying vec2 v_uv;
  uniform sampler2D u_prev;
  uniform sampler2D u_tex;
  uniform vec2 u_simRes;
  uniform vec2 u_resolution;
  uniform vec2 u_imgRes;
  uniform vec2 u_repeat;
  uniform float u_scrollY;
  uniform vec2 u_mouse;
  uniform float u_radius;
  uniform float u_rise;
  uniform float u_decay;
  uniform float u_spread;
  uniform float u_texBrightnessPower;
  uniform float u_texBrightnessMin;
  uniform float u_texBrightnessMax;
  float H(vec2 uv) { return texture2D(u_prev, uv).r; }
  float lum(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
  void main() {
    vec2 st = v_uv * u_simRes;
    float h = H(v_uv);
    vec2 texel = 1.0 / u_simRes;
    float hL = H(v_uv + vec2(-texel.x, 0.0));
    float hR = H(v_uv + vec2( texel.x, 0.0));
    float hU = H(v_uv + vec2(0.0, -texel.y));
    float hD = H(v_uv + vec2(0.0,  texel.y));
    float avg = (hL + hR + hU + hD) * 0.25;
    h = mix(h, avg, clamp(u_spread, 0.0, 1.0));
    h = max(h - u_decay, 0.0);
    float dist = distance(st, u_mouse);
    if (dist < u_radius) {
      vec2 screenPos = v_uv * u_resolution;
      float pageY = (u_resolution.y - screenPos.y) + u_scrollY;
      vec2 texUV = vec2(screenPos.x, pageY) / u_imgRes;
      texUV *= u_repeat;
      texUV = fract(texUV);
      vec3 texSample = texture2D(u_tex, texUV).rgb;
      float texBrightness = lum(texSample);
      texBrightness = pow(texBrightness, u_texBrightnessPower);
      float t = 1.0 - smoothstep(0.0, u_radius, dist);
      t = t * t * t;
      float texInfluence = mix(u_texBrightnessMin, u_texBrightnessMax, texBrightness);
      float riseAmount = u_rise * t * texInfluence;
      h = clamp(h + riseAmount, 0.0, 1.0);
    }
    gl_FragColor = vec4(h, 0.0, 0.0, 1.0);
  }
`;

export const LIGHT_FRAG = `
  precision mediump float;
  varying vec2 v_uv;
  uniform sampler2D u_height;
  uniform sampler2D u_tex;
  uniform vec2  u_resolution;
  uniform vec2  u_simRes;
  uniform vec2  u_imgRes;
  uniform float u_scrollY;
  uniform vec2  u_repeat;
  uniform vec3  u_lowColor;
  uniform vec3  u_highColor;
  uniform float u_minAlpha;
  uniform float u_reliefIntensity;
  uniform float u_parallax;
  uniform float u_baseAmbient;
  uniform float u_activeAmbient;
  uniform float u_diffuse;
  uniform float u_specular;
  uniform float u_shininess;
  uniform vec2 u_mouse;
  uniform float u_mouseLightHeight;
  uniform float u_mouseLightRadius;
  uniform float u_mouseLightIntensity;
  uniform float u_shadowStrength;
  uniform int u_hasImage;
  float lum(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
  vec3 calcNormal(vec2 uv, vec2 res, float intensity, float centerLum) {
    vec2 texel = 1.0 / res;
    float cx = lum(texture2D(u_tex, uv + vec2(texel.x, 0.0)).rgb) - centerLum;
    float cy = lum(texture2D(u_tex, uv + vec2(0.0, texel.y)).rgb) - centerLum;
    return normalize(vec3(-cx * intensity, -cy * intensity, 1.0));
  }
  vec3 calcHeightNormal(vec2 uv, vec2 res, float centerHeight) {
    vec2 texel = 1.0 / res;
    float cx = texture2D(u_height, uv + vec2(texel.x, 0.0)).r - centerHeight;
    float cy = texture2D(u_height, uv + vec2(0.0, texel.y)).r - centerHeight;
    return normalize(vec3(-cx * 20.0, -cy * 20.0, 1.0));
  }
  void main() {
    if (u_hasImage == 0) { gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }
    float heightValue = texture2D(u_height, v_uv).r;
    float pageY = (u_resolution.y - gl_FragCoord.y) + u_scrollY;
    vec2 texUV = vec2(gl_FragCoord.x, pageY) / u_imgRes;
    texUV *= u_repeat;
    texUV = fract(texUV);
    vec3 baseSample = texture2D(u_tex, texUV).rgb;
    float texHeight = lum(baseSample);
    float combinedHeight = heightValue * texHeight;
    float heightT = clamp(combinedHeight, 0.0, 1.0);
    vec3 albedo = mix(u_lowColor, u_highColor, heightT);
    vec3 nTex = calcNormal(texUV, u_imgRes, u_reliefIntensity * combinedHeight, texHeight);
    vec3 nHeight = calcHeightNormal(v_uv, u_simRes, heightValue);
    vec3 combinedNormal = normalize(vec3(nTex.xy + nHeight.xy * combinedHeight, 1.0));
    vec2 parallaxUV = texUV + (combinedNormal.xy * (u_parallax / u_imgRes) * combinedHeight);
    parallaxUV = fract(parallaxUV);
    float parallaxLum = lum(texture2D(u_tex, parallaxUV).rgb);
    vec3 finalNormal = calcNormal(parallaxUV, u_imgRes, u_reliefIntensity * combinedHeight, parallaxLum);
    finalNormal = normalize(vec3(finalNormal.xy + nHeight.xy * combinedHeight, 1.0));
    const vec3 L = vec3(0.4472, 0.5367, 0.7155);
    const vec3 V = vec3(0.0, 0.0, 1.0);
    float fixedDiff = max(dot(finalNormal, L), 0.0);
    vec3 fixedR = reflect(-L, finalNormal);
    float fixedSpec = pow(max(dot(V, fixedR), 0.0), u_shininess);
    vec3 fixedLighting = combinedHeight * (u_diffuse * fixedDiff + u_specular * fixedSpec) * albedo;
    vec3 mouseLighting = vec3(0.0);
    if (u_mouse.x > -9000.0) {
      vec2 screenPos = gl_FragCoord.xy;
      vec3 mousePos3D = vec3(u_mouse.x, u_mouse.y, u_mouseLightHeight);
      vec3 surfacePos = vec3(screenPos, combinedHeight * u_reliefIntensity);
      vec3 toMouse = mousePos3D - surfacePos;
      float mouseDist = length(toMouse);
      vec3 mouseDir = normalize(toMouse);
      float mouseLightAttenuation = 1.0 - smoothstep(0.0, u_mouseLightRadius, mouseDist);
      float mouseLightNdotL = max(dot(finalNormal, mouseDir), 0.0);
      float shadow = 1.0;
      if (combinedHeight > 0.05) {
        float angleToLight = max(0.0, -mouseDir.z);
        float shadowAmount = combinedHeight * angleToLight * u_shadowStrength;
        shadow = 1.0 - (shadowAmount * mouseLightAttenuation);
        shadow = clamp(shadow, 0.2, 1.0);
      }
      float mouseDiff = mouseLightNdotL * u_diffuse * mouseLightAttenuation * u_mouseLightIntensity * shadow;
      vec3 mouseR = reflect(-mouseDir, finalNormal);
      float mouseSpec = pow(max(dot(V, mouseR), 0.0), u_shininess * 0.8) * u_specular * mouseLightAttenuation * u_mouseLightIntensity * shadow;
      mouseLighting = (mouseDiff + mouseSpec) * albedo;
    }
    float ambient = mix(u_baseAmbient, u_activeAmbient, combinedHeight);
    vec3 lit = albedo * ambient + fixedLighting + mouseLighting;
    vec3 color = mix(albedo, lit, combinedHeight);
    float alpha = mix(u_minAlpha, 1.0, smoothstep(0.0, 0.05, heightValue));
    gl_FragColor = vec4(color, alpha);
  }
`;
