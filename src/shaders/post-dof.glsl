#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uScene;
uniform vec2 uResolution;
uniform float uFocusDistance; // Focus plane distance
uniform float uAperture; // Aperture size (larger = more blur)
uniform float uMaxBlur; // Maximum blur radius

// Simplified hexagonal bokeh pattern
const int SAMPLES = 13;
const vec2 poissonDisk[SAMPLES] = vec2[](
  vec2(0.0, 0.0),
  vec2(0.5, 0.0),
  vec2(-0.5, 0.0),
  vec2(0.0, 0.5),
  vec2(0.0, -0.5),
  vec2(0.433, 0.25),
  vec2(-0.433, 0.25),
  vec2(0.433, -0.25),
  vec2(-0.433, -0.25),
  vec2(0.75, 0.0),
  vec2(-0.75, 0.0),
  vec2(0.0, 0.75),
  vec2(0.0, -0.75)
);

// Estimate depth from luminance (simple approximation)
float estimateDepth(vec3 color) {
  // Darker areas tend to be further away in raymarched fractals
  float lum = dot(color, vec3(0.299, 0.587, 0.114));
  return mix(0.5, 1.0, lum); // Map luminance to estimated depth
}

float getBlurRadius(vec3 color) {
  float depth = estimateDepth(color);
  // Calculate Circle of Confusion (CoC)
  float coc = abs(depth - uFocusDistance) * uAperture;
  return clamp(coc, 0.0, uMaxBlur);
}

void main() {
  // Sample color at current pixel
  vec3 centerColor = texture(uScene, vUv).rgb;
  float blurRadius = getBlurRadius(centerColor);

  // If blur radius is very small, just return the original color
  if (blurRadius < 0.5) {
    fragColor = vec4(centerColor, 1.0);
    return;
  }

  // Accumulate color with bokeh sampling
  vec3 color = vec3(0.0);
  float totalWeight = 0.0;

  vec2 pixelSize = 1.0 / uResolution;

  for (int i = 0; i < SAMPLES; i++) {
    vec2 offset = poissonDisk[i] * blurRadius * pixelSize * 20.0; // Scale for visible effect
    vec2 sampleUV = vUv + offset;

    // Clamp UV to valid range
    if (sampleUV.x < 0.0 || sampleUV.x > 1.0 || sampleUV.y < 0.0 || sampleUV.y > 1.0) {
      continue;
    }

    // Sample color
    vec3 sampleColor = texture(uScene, sampleUV).rgb;
    float weight = 1.0;

    color += sampleColor * weight;
    totalWeight += weight;
  }

  color /= max(totalWeight, 1.0);

  fragColor = vec4(color, 1.0);
}
