#version 300 es
// TAA (Temporal Anti-Aliasing) accumulation shader
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uCurrent;   // Current frame
uniform sampler2D uHistory;   // Previous accumulated frame
uniform float uBlend;         // Blend factor (e.g., 0.9 for 90% history)
uniform bool uReset;          // Reset accumulation

void main() {
  vec3 current = texture(uCurrent, vUv).rgb;

  if (uReset) {
    fragColor = vec4(current, 1.0);
  } else {
    vec3 history = texture(uHistory, vUv).rgb;
    vec3 result = mix(current, history, uBlend);
    fragColor = vec4(result, 1.0);
  }
}
