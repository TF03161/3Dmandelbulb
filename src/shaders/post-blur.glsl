#version 300 es
// Gaussian Blur shader (separable - horizontal or vertical pass)
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uTexture;
uniform vec2 uDirection; // (1,0) for horizontal, (0,1) for vertical
uniform vec2 uResolution;

// 9-tap Gaussian kernel
const float weights[5] = float[5](0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216);

void main() {
  vec2 texelSize = 1.0 / uResolution;
  vec3 result = texture(uTexture, vUv).rgb * weights[0];

  for(int i = 1; i < 5; i++) {
    vec2 offset = uDirection * texelSize * float(i);
    result += texture(uTexture, vUv + offset).rgb * weights[i];
    result += texture(uTexture, vUv - offset).rgb * weights[i];
  }

  fragColor = vec4(result, 1.0);
}
