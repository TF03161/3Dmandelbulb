#version 300 es
// Brightness extraction for bloom
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uTexture;
uniform float uThreshold; // Brightness threshold (e.g., 0.8)

// Luminance calculation
float luminance(vec3 color) {
  return dot(color, vec3(0.2126, 0.7152, 0.0722));
}

void main() {
  vec3 color = texture(uTexture, vUv).rgb;
  float lum = luminance(color);

  // Extract bright areas above threshold
  float brightness = max(0.0, lum - uThreshold);
  vec3 bloom = color * (brightness / max(lum, 0.0001));

  fragColor = vec4(bloom, 1.0);
}
