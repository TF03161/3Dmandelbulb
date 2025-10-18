#version 300 es
// Final composition: FXAA + Bloom + Chromatic Aberration + Tonemapping
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uScene;      // Original scene
uniform sampler2D uBloom;      // Blurred bloom
uniform vec2 uResolution;
uniform float uBloomStrength;  // Bloom intensity
uniform float uChroma;         // Chromatic aberration amount
uniform float uVignette;       // Vignette intensity
uniform float uExposure;       // Exposure
uniform float uSaturation;     // Saturation
uniform float uGamma;          // Gamma correction
uniform int uTonemapMode;      // 0=None, 1=Reinhard, 2=ACES, 3=Uncharted2
uniform bool uHDREnabled;      // HDR enabled or not

// Luminance
float luma(vec3 c) {
  return dot(c, vec3(0.299, 0.587, 0.114));
}

// FXAA (lightweight anti-aliasing)
vec3 fxaa(sampler2D tex, vec2 uv, vec2 res) {
  vec2 px = 1.0 / res;
  vec3 m = texture(tex, uv).rgb;
  float lumM = luma(m);

  float lumN = luma(texture(tex, uv + vec2(0.0, -px.y)).rgb);
  float lumS = luma(texture(tex, uv + vec2(0.0,  px.y)).rgb);
  float lumE = luma(texture(tex, uv + vec2( px.x, 0.0)).rgb);
  float lumW = luma(texture(tex, uv + vec2(-px.x, 0.0)).rgb);

  float lumMin = min(lumM, min(min(lumN, lumS), min(lumE, lumW)));
  float lumMax = max(lumM, max(max(lumN, lumS), max(lumE, lumW)));
  float range = lumMax - lumMin;

  if (range < max(0.0312, lumMax * 0.125)) {
    return m;
  }

  vec2 dir = vec2((lumS - lumN) + (lumE - lumW) * 2.0, (lumE - lumW) + (lumS - lumN) * 2.0);
  float dirReduce = max((lumN + lumS + lumE + lumW) * 0.25 * 0.0625, 0.0078125);
  float invDirAdjust = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirReduce);

  dir = clamp(dir * invDirAdjust, vec2(-8.0), vec2(8.0)) * px;

  vec3 rgbA = 0.5 * (
    texture(tex, uv + dir * (1.0/3.0 - 0.5)).rgb +
    texture(tex, uv + dir * (2.0/3.0 - 0.5)).rgb
  );
  vec3 rgbB = rgbA * 0.5 + 0.25 * (
    texture(tex, uv + dir * -0.5).rgb +
    texture(tex, uv + dir *  0.5).rgb
  );

  float lumB = luma(rgbB);
  if (lumB < lumMin || lumB > lumMax) {
    return rgbA;
  }
  return rgbB;
}

// Reinhard Tonemapping
vec3 reinhardTonemap(vec3 color) {
  return color / (1.0 + color);
}

// ACES Filmic Tonemapping
vec3 acesTonemap(vec3 x) {
  const float a = 2.51;
  const float b = 0.03;
  const float c = 2.43;
  const float d = 0.59;
  const float e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

// Uncharted 2 Tonemapping
vec3 uncharted2Tonemap(vec3 x) {
  const float A = 0.15;
  const float B = 0.50;
  const float C = 0.10;
  const float D = 0.20;
  const float E = 0.02;
  const float F = 0.30;
  return ((x * (A * x + C * B) + D * E) / (x * (A * x + B) + D * F)) - E / F;
}

vec3 uncharted2(vec3 color) {
  const float W = 11.2; // White point
  vec3 curr = uncharted2Tonemap(color * 2.0);
  vec3 whiteScale = 1.0 / uncharted2Tonemap(vec3(W));
  return curr * whiteScale;
}

void main() {
  vec2 uv = vUv;

  // Chromatic Aberration (radial distortion)
  vec3 color;
  if (uChroma > 0.0) {
    vec2 center = uv - 0.5;
    float dist = length(center);
    vec2 offset = normalize(center) * dist * uChroma;

    float r = fxaa(uScene, uv - offset, uResolution).r;
    float g = fxaa(uScene, uv, uResolution).g;
    float b = fxaa(uScene, uv + offset, uResolution).b;
    color = vec3(r, g, b);
  } else {
    // FXAA without chromatic aberration
    color = fxaa(uScene, uv, uResolution);
  }

  // Add bloom
  vec3 bloom = texture(uBloom, uv).rgb;
  color += bloom * uBloomStrength;

  // Exposure
  color *= uExposure;

  // Tonemapping (HDR to LDR)
  if (uHDREnabled) {
    if (uTonemapMode == 1) {
      // Reinhard
      color = reinhardTonemap(color);
    } else if (uTonemapMode == 2) {
      // ACES
      color = acesTonemap(color);
    } else if (uTonemapMode == 3) {
      // Uncharted 2
      color = uncharted2(color);
    } else {
      // No tonemapping, just clamp
      color = clamp(color, 0.0, 1.0);
    }
  }

  // Saturation
  float gray = dot(color, vec3(0.299, 0.587, 0.114));
  color = mix(vec3(gray), color, uSaturation);

  // Vignette
  if (uVignette > 0.0) {
    vec2 vignetteUv = uv * (1.0 - uv);
    float vig = vignetteUv.x * vignetteUv.y * 16.0;
    vig = pow(vig, uVignette);
    color *= vig;
  }

  // Gamma correction
  color = pow(color, vec3(1.0 / uGamma));

  fragColor = vec4(color, 1.0);
}
