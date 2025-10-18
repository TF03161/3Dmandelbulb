#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uTexture;
uniform int uTonemapMode; // 0 = None, 1 = Reinhard, 2 = ACES, 3 = Uncharted2
uniform float uExposure;

// Reinhard tone mapping
vec3 reinhardTonemap(vec3 color) {
  return color / (1.0 + color);
}

// ACES Filmic Tone Mapping
// https://knarkowicz.wordpress.com/2016/01/06/aces-filmic-tone-mapping-curve/
vec3 acesTonemap(vec3 x) {
  float a = 2.51;
  float b = 0.03;
  float c = 2.43;
  float d = 0.59;
  float e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

// Uncharted 2 Tone Mapping
// http://filmicworlds.com/blog/filmic-tonemapping-operators/
vec3 uncharted2Tonemap(vec3 x) {
  float A = 0.15;
  float B = 0.50;
  float C = 0.10;
  float D = 0.20;
  float E = 0.02;
  float F = 0.30;
  return ((x * (A * x + C * B) + D * E) / (x * (A * x + B) + D * F)) - E / F;
}

vec3 uncharted2(vec3 color) {
  float W = 11.2; // White point
  vec3 curr = uncharted2Tonemap(color * 2.0);
  vec3 whiteScale = 1.0 / uncharted2Tonemap(vec3(W));
  return curr * whiteScale;
}

void main() {
  vec3 hdrColor = texture(uTexture, vUv).rgb;

  // Apply exposure
  hdrColor *= uExposure;

  vec3 ldrColor;

  if (uTonemapMode == 1) {
    // Reinhard
    ldrColor = reinhardTonemap(hdrColor);
  } else if (uTonemapMode == 2) {
    // ACES
    ldrColor = acesTonemap(hdrColor);
  } else if (uTonemapMode == 3) {
    // Uncharted 2
    ldrColor = uncharted2(hdrColor);
  } else {
    // No tone mapping, just clamp
    ldrColor = clamp(hdrColor, 0.0, 1.0);
  }

  // Gamma correction (sRGB)
  ldrColor = pow(ldrColor, vec3(1.0 / 2.2));

  fragColor = vec4(ldrColor, 1.0);
}
