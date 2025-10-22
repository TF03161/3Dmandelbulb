#version 300 es
precision highp float;

out vec4 fragColor;
in vec2 vUv;

uniform vec2 uResolution;
uniform float uTime;
uniform vec3 uCamPos;
uniform mat3 uCamRot;
uniform float uFov;

uniform int uMaxIterations;
uniform float uPowerBase;
uniform float uPowerAmp;
uniform float uScale;
uniform float uEpsilon;
uniform int uMaxSteps;
uniform float uAOInt;
uniform float uReflect;
uniform vec3 uSeed;
uniform float uPalSpeed;
uniform float uPalSpread;
uniform float uJuliaMix;
uniform float uTwist;
uniform float uMorphOn;
uniform float uFold;
uniform float uBoxSize;
uniform int uMaterialMode;
uniform float uBumpStrength;
uniform float uIor;
uniform float uShadowSoft;
uniform float uSpecPow;
uniform vec3 uLightDir;
uniform vec2 uJitter;

// Mode selection
uniform int uMode;

// Color palette mode
uniform int uColorMode;

// Flower of Life parameters
uniform float uFloRadius;
uniform float uFloSpacing;
uniform float uFloThickness;
uniform float uFloExtrude;
uniform float uFloTwist;
uniform float uFloSpiral;
uniform float uFloHarmonic;
uniform float uFloHyper;
uniform float uFloComplexity;

// Fibonacci Shell parameters
uniform float uFibSpiral;
uniform float uFibBend;
uniform float uFibWarp;
uniform float uFibOffset;
uniform float uFibLayer;
uniform float uFibInward;
uniform float uFibBandGap;
uniform float uFibVortex;

// Mandelbox parameters
uniform float uMbScale;
uniform float uMbMinRadius;
uniform float uMbFixedRadius;
uniform int uMbIter;

// Metatron Cube parameters
uniform float uMetaRadius;
uniform float uMetaSpacing;
uniform float uMetaNode;
uniform float uMetaStrut;
uniform float uMetaLayer;
uniform float uMetaTwist;

// Gyroid Cathedral parameters
uniform float uGyroLevel;
uniform float uGyroScale;
uniform float uGyroMod;

// Typhoon parameters
uniform float uTyEye;
uniform float uTyPull;
uniform float uTyWall;
uniform float uTySpin;
uniform float uTyBand;
uniform float uTyNoise;

// Quaternion Julia parameters
uniform vec4 uQuatC;
uniform float uQuatPower;
uniform float uQuatScale;

// Cosmic Bloom parameters
uniform float uCosRadius;
uniform float uCosExpansion;
uniform float uCosRipple;
uniform float uCosSpiral;

// Parametric Tower parameters
uniform float uTowerBaseRadius;
uniform float uTowerTopRadius;
uniform float uTowerHeight;
uniform float uTowerFloorCount;
uniform float uTowerFloorHeight;
uniform float uTowerTwist;
uniform int uTowerShapeType;
uniform int uTowerTaperingType;
uniform int uTowerTwistingType;
uniform float uTowerBalconyDepth;    // バルコニーの深さ (0.0-0.2)
uniform float uTowerBalconyRatio;    // バルコニーの頻度 (0.0-1.0)
uniform float uTowerWindowSize;      // 窓のサイズ (0.0-1.0)
uniform int uTowerFacadeType;        // ファサードタイプ (0=grid, 1=curtain wall, 2=panels)
// Additional Tower parameters
uniform float uTowerShapeComplexity; // Shape detail level (3-32)
uniform float uTowerCornerRadius;    // Corner rounding (0-1)
uniform float uTowerTwistLevels;     // Twist segments (5-50)
uniform float uTowerFloorVariation;  // Floor variation (0-0.5)
uniform float uTowerAsymmetry;       // Asymmetry factor (0-1)
uniform float uTowerFacadeGridX;     // Horizontal grid spacing
uniform float uTowerFacadeGridZ;     // Vertical grid spacing
uniform float uTowerPanelDepth;      // Panel depth variation
uniform float uTowerTaperingAmount;  // Tapering amount (0-1)

vec3 monoBg = vec3(0.0); // Pure black background
const float PI = 3.14159265358979323846;
const float TAU = 6.28318530717958647692;
const float GOLDEN_RATIO = 1.6180339887498948482;

vec3 hue2rgb(float h) {
  h = fract(h);
  float r = abs(h * 6.0 - 3.0) - 1.0;
  float g = 2.0 - abs(h * 6.0 - 2.0);
  float b = 2.0 - abs(h * 6.0 - 4.0);
  return clamp(vec3(r, g, b), 0.0, 1.0);
}

// Neon Rainbow Palette (same as original HTML)
vec3 neonPalette(float x, vec3 shift) {
  float h = fract(x + shift.x);
  vec3 c = hue2rgb(h);
  c = pow(c, vec3(0.8));
  c *= 0.7 + 0.3 * sin(TAU * (x * 1.5 + shift.y));
  return clamp(c, 0.0, 1.0);
}

// Professional 5-color palette system (30 modes)
vec3 getColorPalette(float t, int mode, vec3 shift) {
  // Mode -1: Neon Rainbow (continuous hue rotation - same as HTML)
  if (mode == -1) {
    return neonPalette(t, shift);
  }

  t = fract(t + shift.x);

  // 5 colors per palette
  vec3 c1, c2, c3, c4, c5;
  float sat = 1.0;
  float bright = 1.0;

  // Natural & Organic (0-4)
  if (mode == 0) { // Forest Canopy
    c1 = vec3(0.102, 0.302, 0.180); c2 = vec3(0.180, 0.490, 0.306); c3 = vec3(0.302, 0.659, 0.416);
    c4 = vec3(0.482, 0.769, 0.498); c5 = vec3(0.659, 0.902, 0.639);
    sat = 0.9; bright = 0.95;
  } else if (mode == 1) { // Ocean Breeze
    c1 = vec3(0.0, 0.239, 0.361); c2 = vec3(0.0, 0.467, 0.745); c3 = vec3(0.0, 0.659, 0.910);
    c4 = vec3(0.282, 0.792, 0.894); c5 = vec3(0.565, 0.878, 0.937);
    sat = 1.0; bright = 1.0;
  } else if (mode == 2) { // Desert Sunset
    c1 = vec3(0.831, 0.647, 0.455); c2 = vec3(0.902, 0.722, 0.612); c3 = vec3(0.957, 0.820, 0.682);
    c4 = vec3(0.980, 0.890, 0.776); c5 = vec3(1.0, 0.898, 0.831);
    sat = 0.85; bright = 1.05;
  } else if (mode == 3) { // Mountain Mist
    c1 = vec3(0.290, 0.373, 0.416); c2 = vec3(0.420, 0.506, 0.537); c3 = vec3(0.545, 0.639, 0.655);
    c4 = vec3(0.659, 0.773, 0.773); c5 = vec3(0.773, 0.878, 0.878);
    sat = 0.7; bright = 0.95;
  } else if (mode == 4) { // Cherry Blossom
    c1 = vec3(1.0, 0.620, 0.733); c2 = vec3(1.0, 0.702, 0.820); c3 = vec3(1.0, 0.784, 0.890);
    c4 = vec3(1.0, 0.878, 0.941); c5 = vec3(1.0, 0.961, 0.980);
    sat = 0.8; bright = 1.1;
  }
  // Vibrant & Energetic (5-9)
  else if (mode == 5) { // Electric Neon
    c1 = vec3(1.0, 0.0, 0.431); c2 = vec3(0.514, 0.220, 0.925); c3 = vec3(0.227, 0.525, 1.0);
    c4 = vec3(0.0, 0.961, 1.0); c5 = vec3(0.024, 1.0, 0.647);
    sat = 1.3; bright = 1.2;
  } else if (mode == 6) { // Cyberpunk
    c1 = vec3(1.0, 0.0, 0.502); c2 = vec3(0.749, 0.0, 1.0); c3 = vec3(0.502, 0.0, 1.0);
    c4 = vec3(0.251, 0.0, 1.0); c5 = vec3(0.0, 0.502, 1.0);
    sat = 1.25; bright = 1.15;
  } else if (mode == 7) { // Tropical Paradise
    c1 = vec3(1.0, 0.0, 0.431); c2 = vec3(0.984, 0.337, 0.027); c3 = vec3(1.0, 0.745, 0.043);
    c4 = vec3(0.541, 0.788, 0.149); c5 = vec3(0.0, 0.961, 0.831);
    sat = 1.2; bright = 1.1;
  } else if (mode == 8) { // Aurora Borealis
    c1 = vec3(0.0, 1.0, 0.529); c2 = vec3(0.0, 0.898, 1.0); c3 = vec3(0.0, 0.722, 1.0);
    c4 = vec3(0.486, 0.227, 0.929); c5 = vec3(0.753, 0.149, 0.827);
    sat = 1.1; bright = 1.0;
  } else if (mode == 9) { // Sunset Blaze
    c1 = vec3(1.0, 0.306, 0.314); c2 = vec3(0.988, 0.569, 0.227); c3 = vec3(0.976, 0.839, 0.180);
    c4 = vec3(0.918, 0.890, 0.455); c5 = vec3(0.886, 0.957, 0.780);
    sat = 1.05; bright = 1.05;
  }
  // Cosmic & Mystical (10-14)
  else if (mode == 10) { // Deep Space
    c1 = vec3(0.039, 0.055, 0.153); c2 = vec3(0.102, 0.122, 0.302); c3 = vec3(0.176, 0.208, 0.380);
    c4 = vec3(0.290, 0.314, 0.451); c5 = vec3(0.420, 0.439, 0.537);
    sat = 0.8; bright = 0.9;
  } else if (mode == 11) { // Nebula Dream
    c1 = vec3(0.357, 0.039, 0.569); c2 = vec3(0.545, 0.247, 0.808); c3 = vec3(0.710, 0.396, 0.847);
    c4 = vec3(0.851, 0.549, 0.878); c5 = vec3(0.953, 0.706, 0.902);
    sat = 1.05; bright = 1.0;
  } else if (mode == 12) { // Stardust
    c1 = vec3(0.298, 0.114, 0.584); c2 = vec3(0.486, 0.227, 0.929); c3 = vec3(0.655, 0.545, 0.980);
    c4 = vec3(0.769, 0.710, 0.992); c5 = vec3(0.878, 0.906, 1.0);
    sat = 0.95; bright = 1.05;
  } else if (mode == 13) { // Galaxy Spiral
    c1 = vec3(0.118, 0.227, 0.541); c2 = vec3(0.216, 0.180, 0.639); c3 = vec3(0.388, 0.400, 0.945);
    c4 = vec3(0.659, 0.333, 0.969); c5 = vec3(0.925, 0.282, 0.600);
    sat = 1.1; bright = 1.0;
  } else if (mode == 14) { // Cosmic Dust
    c1 = vec3(0.192, 0.180, 0.506); c2 = vec3(0.298, 0.114, 0.584); c3 = vec3(0.439, 0.102, 0.459);
    c4 = vec3(0.624, 0.071, 0.224); c5 = vec3(0.745, 0.071, 0.235);
    sat = 1.0; bright = 0.95;
  }
  // Monochrome & Minimal (15-19)
  else if (mode == 15) { // Charcoal
    c1 = vec3(0.059, 0.059, 0.059); c2 = vec3(0.149, 0.149, 0.149); c3 = vec3(0.247, 0.247, 0.247);
    c4 = vec3(0.349, 0.349, 0.349); c5 = vec3(0.451, 0.451, 0.451);
    sat = 0.5; bright = 1.0;
  } else if (mode == 16) { // Pure Blue
    c1 = vec3(0.0, 0.122, 0.247); c2 = vec3(0.0, 0.239, 0.478); c3 = vec3(0.0, 0.384, 0.800);
    c4 = vec3(0.0, 0.518, 1.0); c5 = vec3(0.302, 0.651, 1.0);
    sat = 1.2; bright = 1.0;
  } else if (mode == 17) { // Royal Purple
    c1 = vec3(0.102, 0.0, 0.200); c2 = vec3(0.200, 0.0, 0.400); c3 = vec3(0.302, 0.0, 0.600);
    c4 = vec3(0.400, 0.0, 0.800); c5 = vec3(0.502, 0.0, 1.0);
    sat = 1.15; bright = 1.0;
  } else if (mode == 18) { // Emerald
    c1 = vec3(0.0, 0.200, 0.102); c2 = vec3(0.0, 0.400, 0.200); c3 = vec3(0.0, 0.600, 0.302);
    c4 = vec3(0.0, 0.800, 0.400); c5 = vec3(0.0, 1.0, 0.502);
    sat = 1.1; bright = 1.0;
  } else if (mode == 19) { // Crimson
    c1 = vec3(0.200, 0.0, 0.0); c2 = vec3(0.400, 0.0, 0.0); c3 = vec3(0.600, 0.0, 0.0);
    c4 = vec3(0.800, 0.0, 0.0); c5 = vec3(1.0, 0.102, 0.102);
    sat = 1.2; bright = 1.0;
  }
  // Pastel & Soft (20-24)
  else if (mode == 20) { // Cotton Candy
    c1 = vec3(1.0, 0.784, 0.867); c2 = vec3(1.0, 0.686, 0.800); c3 = vec3(0.741, 0.878, 0.996);
    c4 = vec3(0.635, 0.824, 1.0); c5 = vec3(0.804, 0.706, 0.859);
    sat = 0.75; bright = 1.1;
  } else if (mode == 21) { // Mint Cream
    c1 = vec3(0.847, 0.953, 0.863); c2 = vec3(0.718, 0.894, 0.780); c3 = vec3(0.584, 0.835, 0.698);
    c4 = vec3(0.455, 0.776, 0.616); c5 = vec3(0.322, 0.718, 0.533);
    sat = 0.8; bright = 1.05;
  } else if (mode == 22) { // Lavender Dreams
    c1 = vec3(0.878, 0.667, 1.0); c2 = vec3(0.780, 0.490, 1.0); c3 = vec3(0.616, 0.306, 0.867);
    c4 = vec3(0.482, 0.173, 0.749); c5 = vec3(0.353, 0.098, 0.604);
    sat = 0.9; bright = 1.0;
  } else if (mode == 23) { // Peach Sorbet
    c1 = vec3(1.0, 0.898, 0.925); c2 = vec3(1.0, 0.761, 0.820); c3 = vec3(1.0, 0.702, 0.776);
    c4 = vec3(1.0, 0.561, 0.671); c5 = vec3(0.984, 0.435, 0.573);
    sat = 0.85; bright = 1.1;
  } else if (mode == 24) { // Sky Blue
    c1 = vec3(0.792, 0.941, 0.973); c2 = vec3(0.678, 0.910, 0.957); c3 = vec3(0.565, 0.878, 0.937);
    c4 = vec3(0.282, 0.792, 0.894); c5 = vec3(0.0, 0.706, 0.847);
    sat = 0.85; bright = 1.05;
  }
  // Warm & Cozy (25-29)
  else if (mode == 25) { // Autumn Leaves
    c1 = vec3(0.839, 0.157, 0.157); c2 = vec3(0.969, 0.498, 0.0); c3 = vec3(0.988, 0.749, 0.286);
    c4 = vec3(0.918, 0.886, 0.718); c5 = vec3(0.0, 0.188, 0.286);
    sat = 1.0; bright = 1.0;
  } else if (mode == 26) { // Golden Hour
    c1 = vec3(0.969, 0.145, 0.522); c2 = vec3(0.710, 0.098, 0.620); c3 = vec3(0.447, 0.055, 0.718);
    c4 = vec3(0.337, 0.043, 0.678); c5 = vec3(0.282, 0.078, 0.659);
    sat = 1.15; bright = 1.05;
  } else if (mode == 27) { // Campfire
    c1 = vec3(1.0, 0.282, 0.0); c2 = vec3(1.0, 0.420, 0.0); c3 = vec3(1.0, 0.522, 0.0);
    c4 = vec3(1.0, 0.635, 0.0); c5 = vec3(1.0, 0.741, 0.0);
    sat = 1.2; bright = 1.1;
  } else if (mode == 28) { // Terracotta
    c1 = vec3(0.608, 0.133, 0.149); c2 = vec3(0.682, 0.125, 0.071); c3 = vec3(0.733, 0.243, 0.012);
    c4 = vec3(0.792, 0.404, 0.008); c5 = vec3(0.933, 0.608, 0.0);
    sat = 1.05; bright = 1.0;
  } else { // Mode 29: Honey Amber
    c1 = vec3(1.0, 0.718, 0.012); c2 = vec3(0.992, 0.620, 0.008); c3 = vec3(0.984, 0.522, 0.0);
    c4 = vec3(0.910, 0.365, 0.016); c5 = vec3(0.863, 0.184, 0.008);
    sat = 1.1; bright = 1.05;
  }

  // Advanced 5-color blending
  float pos = t * 4.0; // 0-4 range
  vec3 base;

  if (pos < 1.0) {
    base = mix(c1, c2, fract(pos));
  } else if (pos < 2.0) {
    base = mix(c2, c3, fract(pos));
  } else if (pos < 3.0) {
    base = mix(c3, c4, fract(pos));
  } else {
    base = mix(c4, c5, fract(pos));
  }

  // Smooth color transitions with shift
  float wave1 = sin(t * TAU * 1.5 + shift.y) * 0.5 + 0.5;
  float wave2 = sin(t * TAU * 2.5 + shift.z) * 0.5 + 0.5;

  vec3 accent1 = mix(c1, c5, wave1);
  vec3 accent2 = mix(c2, c4, wave2);

  base = mix(base, accent1, 0.15);
  base = mix(base, accent2, 0.1);

  // Subtle saturation and brightness modulation
  float satMod = (0.85 + 0.15 * sin(t * TAU * 3.0 + shift.x)) * sat;
  float brightMod = (0.9 + 0.1 * sin(t * TAU * 2.0 + shift.y)) * bright;

  vec3 gray = vec3(dot(base, vec3(0.299, 0.587, 0.114)));
  base = mix(gray, base, satMod);
  base *= brightMod;

  return clamp(base, 0.0, 1.0);
}

mat2 rot(float a) {
  float c = cos(a), s = sin(a);
  return mat2(c, -s, s, c);
}

float smoothMin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / max(k, 1e-6), 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

float safePow(float base, float exponent) {
  return pow(max(abs(base), 1e-6), exponent);
}

float saturate(float x) {
  return clamp(x, 0.0, 1.0);
}

vec3 boxFold(vec3 p, float size) {
  return clamp(p, -size, size) * 2.0 - p;
}

vec3 repeatAround(vec3 p, float period) {
  return mod(p + 0.5 * period, period) - 0.5 * period;
}

float sdCapsule(vec3 p, vec3 a, vec3 b, float r) {
  vec3 pa = p - a;
  vec3 ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  return length(pa - ba * h) - r;
}

// Simple circle on sphere surface
float sdCircleOnSphere(vec3 p, vec3 center, float sphereRadius, float circleRadius, float thickness) {
  vec3 dir = normalize(p);
  vec3 centerDir = normalize(center);

  // Great circle distance on sphere
  float angle = acos(clamp(dot(dir, centerDir), -1.0, 1.0));
  float arcDist = sphereRadius * angle;

  // Distance to circle
  return abs(arcDist - circleRadius) - thickness;
}

// Flower of Life - overlapping circles pattern
float flowerOfLifeDE(vec3 p) {
  float R = uFloRadius;
  float circleRadius = R * uFloSpacing * 0.5;
  float thickness = uFloThickness * R * 0.3;

  // Apply twist
  vec3 q = p;
  if (abs(uFloTwist) > 0.001) {
    float ang = uFloTwist * 0.5;
    mat2 m = rot(ang);
    q.xz = m * q.xz;
  }

  float r = length(q);
  vec3 dir = normalize(q);

  // Base sphere
  float sphere = abs(r - R) - thickness * 0.2;

  // Start with large distance
  float d = 1000.0;

  // Central circle at north pole
  vec3 centerNorth = vec3(0.0, 1.0, 0.0);
  d = min(d, sdCircleOnSphere(q, centerNorth, R, circleRadius, thickness));

  // First ring: 6 circles around north pole
  for (int i = 0; i < 6; i++) {
    float angle = float(i) * TAU / 6.0;
    float tilt = circleRadius / R;
    vec3 center = vec3(
      sin(tilt) * cos(angle),
      cos(tilt),
      sin(tilt) * sin(angle)
    );
    d = min(d, sdCircleOnSphere(q, center, R, circleRadius, thickness));
  }

  // Second ring: 6 circles at equator (perfectly symmetric)
  for (int i = 0; i < 6; i++) {
    float angle = float(i) * TAU / 6.0;
    vec3 center = vec3(
      cos(angle),
      0.0,
      sin(angle)
    );
    d = min(d, sdCircleOnSphere(q, center, R, circleRadius, thickness));
  }

  // Third ring: 6 circles around south pole (mirror of first ring)
  for (int i = 0; i < 6; i++) {
    float angle = float(i) * TAU / 6.0;
    float tilt = circleRadius / R;
    vec3 center = vec3(
      sin(tilt) * cos(angle),
      -cos(tilt),
      sin(tilt) * sin(angle)
    );
    d = min(d, sdCircleOnSphere(q, center, R, circleRadius, thickness));
  }

  // South pole center circle
  vec3 centerSouth = vec3(0.0, -1.0, 0.0);
  d = min(d, sdCircleOnSphere(q, centerSouth, R, circleRadius, thickness));

  // Additional complexity layers based on uFloComplexity
  if (uFloComplexity > 0.1) {
    // Fourth ring: 12 circles between equator and poles
    int complexCount = int(mix(6.0, 12.0, uFloComplexity));
    for (int i = 0; i < 12; i++) {
      if (i >= complexCount) break;
      float angle = float(i) * TAU / float(complexCount);
      float tilt = mix(0.3, 0.8, uFloComplexity);

      // Upper hemisphere
      vec3 center1 = vec3(
        sin(tilt) * cos(angle),
        cos(tilt),
        sin(tilt) * sin(angle)
      );
      d = min(d, sdCircleOnSphere(q, center1, R, circleRadius * 0.8, thickness * 0.9));

      // Lower hemisphere
      vec3 center2 = vec3(
        sin(tilt) * cos(angle + TAU / float(complexCount) * 0.5),
        -cos(tilt),
        sin(tilt) * sin(angle + TAU / float(complexCount) * 0.5)
      );
      d = min(d, sdCircleOnSphere(q, center2, R, circleRadius * 0.8, thickness * 0.9));
    }
  }

  // Very high complexity: add micro-patterns
  if (uFloComplexity > 0.5) {
    int microCount = int(mix(12.0, 24.0, (uFloComplexity - 0.5) * 2.0));
    for (int i = 0; i < 24; i++) {
      if (i >= microCount) break;
      float angle = float(i) * TAU / float(microCount) + uTime * 0.1;
      float tilt = 0.5 + 0.3 * sin(float(i) * 0.5);

      vec3 center = vec3(
        sin(tilt) * cos(angle),
        cos(tilt) * 0.5,
        sin(tilt) * sin(angle)
      );
      d = min(d, sdCircleOnSphere(q, center, R, circleRadius * 0.6, thickness * 0.7));
    }
  }

  // Spiral effect
  if (uFloSpiral > 0.01) {
    int count = int(mix(6.0, 18.0, uFloSpiral));
    for (int i = 0; i < 20; i++) {
      if (i >= count) break;
      float t = float(i) / float(max(count - 1, 1));
      float spiralAngle = t * TAU * 3.0 + uTime * uFloSpiral * 0.5;
      float spiralTilt = mix(0.2, 2.8, t);
      vec3 spiralCenter = vec3(
        sin(spiralTilt) * cos(spiralAngle),
        sin(spiralTilt) * sin(spiralAngle),
        cos(spiralTilt)
      );
      d = min(d, sdCircleOnSphere(q, spiralCenter, R, circleRadius * 0.7, thickness * 0.8));
    }
  }

  // Harmonics - add wave modulation
  if (uFloHarmonic > 0.01) {
    float theta = atan(dir.z, dir.x);
    float phi = acos(clamp(dir.y, -1.0, 1.0));
    float wave = sin(phi * 8.0) * cos(theta * 6.0);
    d += wave * uFloHarmonic * thickness * 0.3;
  }

  // Hyper warp - 4D rotation
  if (uFloHyper > 0.01) {
    float phase = uTime * 0.2;
    float warp = sin(dir.x * 10.0 + phase) * cos(dir.y * 10.0) * sin(dir.z * 10.0);
    d += warp * uFloHyper * thickness * 0.4;
  }

  // Extrude effect - push circles outward
  float extrudeDist = (1.0 + uFloExtrude * 0.3);
  d *= extrudeDist;

  return max(d, sphere);
}

// Fibonacci Shell Distance Estimator
float fibonacciDE(vec3 p, out vec4 orbitTrap) {
  const float goldenAngle = 2.399963229728653;
  const float eps = 1e-4;
  vec3 z = p;
  float dr = 1.0;
  float r = 0.0;
  float power = uPowerBase + uPowerAmp * sin(uTime * 0.5);
  float safePower = clamp(power, 1.5, 12.0);
  int iterLimit = min(uMaxIterations, 250);
  float maxIterF = max(float(iterLimit - 1), 1.0);

  orbitTrap = vec4(1000.0);

  for (int i = 0; i < 250; ++i) {
    if (i >= iterLimit) break;
    r = length(z);
    if (r > 6.0) break;

    orbitTrap = min(orbitTrap, vec4(abs(z), r));

    if (uFold > 0.0) {
      z = mix(z, boxFold(z, uBoxSize), uFold);
    }

    float safeR = max(r, eps);
    float theta = acos(clamp(z.z / safeR, -1.0, 1.0));
    float phi = atan(z.y, z.x);
    float iterRatio = float(i) / maxIterF;

    vec2 radialDir = normalize(z.xy + vec2(1e-4));
    float bandFreq = max(uFibBandGap, 0.05);
    float bandPhase = iterRatio * 6.2831 * bandFreq + uTime * 0.7;
    float layerPhase = iterRatio * 6.2831 * (0.6 + 0.4 * bandFreq) + uTime * 0.45;
    float bandWave = sin(bandPhase);
    float bandPulse = 0.5 + 0.5 * bandWave;

    z.xy += radialDir * (uFibOffset * bandPulse);
    z.z += uFibLayer * 0.6 * sin(layerPhase);

    float planeRadius = max(length(z.xy), eps);
    float inwardPulse = 0.5 + 0.5 * sin(uTime * 0.52 + iterRatio * 5.2 + bandWave * 0.6);
    float inwardStrength = clamp(uFibInward * inwardPulse * exp(-planeRadius * (0.45 + 0.25 * bandPulse)), 0.0, 0.95);
    z.xy = mix(z.xy, z.xy * (1.0 - 0.55 * inwardStrength), 0.7);
    z.xy -= radialDir * (inwardStrength * 0.18);

    float morph = 0.55 + 0.45 * uMorphOn;
    float spiralOsc = sin(uTime * 0.6 + float(i) * uFibWarp * 0.35 + bandPhase * 0.25);
    float spiralPush = uFibSpiral * morph * (0.4 + 0.6 * (0.5 + 0.5 * spiralOsc)) + uFibLayer * (iterRatio - 0.5) * (0.7 + 0.3 * bandPulse);
    float bendOsc = uFibBend * sin(uTime * 0.5 + float(i) * 0.38);
    float vortexBase = uFibVortex * (0.25 + 0.75 * iterRatio);
    float vortexAccel = uFibVortex * (0.12 + 0.35 * inwardStrength) * (0.5 + 0.5 * bandWave);

    float rp = pow(safeR, safePower);
    dr = rp / safeR * safePower * dr + 1.0;
    theta = theta * safePower + bendOsc + (0.18 + 0.12 * uFibVortex) * sin(iterRatio * 9.0 + uTime * 0.4) + uFibInward * 0.08 * cos(bandPhase - uTime * 0.3);
    phi += goldenAngle + spiralPush + vortexBase;
    phi += vortexAccel * sin(uTime * 0.55 + float(i) * 0.42 + bandPhase);

    vec3 zn = rp * vec3(sin(theta) * cos(phi), sin(theta) * sin(phi), cos(theta));
    float feedbackMix = mix(0.18 + 0.22 * uMorphOn, 0.08 + 0.12 * uMorphOn, inwardStrength);
    z = zn + mix(p, z, feedbackMix);
  }

  return 0.5 * log(max(r, eps)) * r / dr;
}

// Mandelbox Distance Estimator
float mandelboxDE(vec3 p, out vec4 orbitTrap) {
  vec4 offset = vec4(p, 0.0);
  vec4 z = offset;
  float dr = 1.0;
  float scale = uMbScale;
  float minRadius2 = uMbMinRadius * uMbMinRadius;
  float fixedRadius2 = uMbFixedRadius * uMbFixedRadius;

  orbitTrap = vec4(1000.0);

  for (int i = 0; i < 20; i++) {
    if (i >= uMbIter) break;

    // Box fold
    z.xyz = boxFold(z.xyz, 1.0);

    // Sphere fold
    float r2 = dot(z.xyz, z.xyz);

    // Track orbit for coloring
    orbitTrap = min(orbitTrap, vec4(abs(z.xyz), r2));

    if (r2 < minRadius2) {
      float temp = fixedRadius2 / minRadius2;
      z *= temp;
      dr *= temp;
    } else if (r2 < fixedRadius2) {
      float temp = fixedRadius2 / r2;
      z *= temp;
      dr *= temp;
    }

    z = z * scale + offset;
    dr = dr * abs(scale) + 1.0;
  }

  float r = length(z.xyz);
  return r / abs(dr);
}

// Metatron's Cube Distance Estimator
float metatronCubeDE(vec3 p, out vec4 orbitTrap) {
  float scale = max(uMetaRadius, 0.2);
  vec3 q = p / scale;

  if (abs(uMetaTwist) > 1e-5) {
    float angA = uMetaTwist * 0.45;
    float angB = uMetaTwist * 0.22;
    mat2 rotA = rot(angA);
    mat2 rotB = rot(angB);
    q.xy = rotA * q.xy;
    q.xz = rotB * q.xz;
  }

  float ringRad = mix(0.7, 1.4, clamp(uMetaSpacing, 0.0, 1.5));
  float layerH = mix(0.0, 1.2, clamp(uMetaLayer, 0.0, 1.5));
  float nodeR = mix(0.08, 0.45, clamp(uMetaNode, 0.0, 1.0));
  float strutR = nodeR * mix(0.3, 0.85, clamp(uMetaStrut, 0.0, 1.0));

  float minField = length(q) - nodeR;
  vec3 topCenter = vec3(0.0, layerH, 0.0);
  vec3 bottomCenter = vec3(0.0, -layerH, 0.0);
  minField = min(minField, length(q - topCenter) - nodeR * 0.9);
  minField = min(minField, length(q - bottomCenter) - nodeR * 0.9);
  minField = min(minField, sdCapsule(q, topCenter, bottomCenter, strutR));

  const float PI2 = 6.28318530718;
  for (int i = 0; i < 6; ++i) {
    float ang = PI2 * float(i) / 6.0;
    vec2 circle = vec2(cos(ang), sin(ang));
    vec2 circleNext = vec2(cos(ang + PI2 / 6.0), sin(ang + PI2 / 6.0));
    vec3 base = vec3(circle * ringRad, 0.0);
    vec3 baseNext = vec3(circleNext * ringRad, 0.0);
    vec3 top = vec3(circle * (ringRad * 0.6), layerH);
    vec3 topNext = vec3(circleNext * (ringRad * 0.6), layerH);
    vec3 bottom = vec3(circle * (ringRad * 0.6), -layerH);
    vec3 bottomNext = vec3(circleNext * (ringRad * 0.6), -layerH);

    minField = min(minField, length(q - base) - nodeR);
    minField = min(minField, length(q - top) - nodeR * 0.85);
    minField = min(minField, length(q - bottom) - nodeR * 0.85);
    minField = min(minField, sdCapsule(q, vec3(0.0), base, strutR));
    minField = min(minField, sdCapsule(q, topCenter, top, strutR * 0.85));
    minField = min(minField, sdCapsule(q, bottomCenter, bottom, strutR * 0.85));
    minField = min(minField, sdCapsule(q, base, baseNext, strutR));
    minField = min(minField, sdCapsule(q, top, topNext, strutR * 0.75));
    minField = min(minField, sdCapsule(q, bottom, bottomNext, strutR * 0.75));
    minField = min(minField, sdCapsule(q, base, top, strutR * 0.72));
    minField = min(minField, sdCapsule(q, base, bottom, strutR * 0.72));
  }

  for (int sx = -1; sx <= 1; sx += 2) {
    for (int sz = -1; sz <= 1; sz += 2) {
      vec3 corner = vec3(float(sx) * ringRad * 0.6, 0.0, float(sz) * ringRad * 0.6);
      minField = min(minField, length(q - corner) - nodeR * 0.85);
      minField = min(minField, sdCapsule(q, topCenter, corner, strutR * 0.68));
      minField = min(minField, sdCapsule(q, bottomCenter, corner, strutR * 0.68));
    }
  }

  orbitTrap = vec4(abs(q), minField);
  return minField * scale;
}

// Gyroid Cathedral Distance Estimator
float gyroidCathedralDE(vec3 p, out vec4 orbitTrap) {
  float scale = max(uGyroScale, 0.1);
  vec3 q = p / scale;

  if (uGyroMod > 0.01) {
    float period = mix(4.0, 12.0, clamp(uGyroMod, 0.0, 1.0));
    q = repeatAround(q, period);
  }

  // Gyroid minimal surface equation with proper normalization
  float gyroidValue =
    sin(q.x) * cos(q.y) +
    sin(q.y) * cos(q.z) +
    sin(q.z) * cos(q.x);

  float targetLevel = uGyroLevel;
  float dist = abs(gyroidValue - targetLevel);

  // Proper gradient calculation for accurate distance field
  vec3 gradient = vec3(
    cos(q.x) * cos(q.y) - sin(q.z) * sin(q.x),
    -sin(q.x) * sin(q.y) + cos(q.y) * cos(q.z),
    -sin(q.y) * sin(q.z) + cos(q.z) * cos(q.x)
  );

  float gradMag = length(gradient);

  // Improved distance approximation with safety clamping
  float approxDist = dist / max(gradMag, 0.3);

  // Scale back to world space with proper multiplier
  float finalDist = approxDist * scale * 0.4;

  orbitTrap = vec4(abs(q), finalDist);
  return finalDist;
}

// Mandelbulb distance estimator
float mandelbulbDE(vec3 pos, out vec4 orbitTrap) {
  vec3 z = pos;
  float dr = 1.0;
  float r = 0.0;
  float power = uPowerBase + uPowerAmp * sin(uTime * 0.5);

  orbitTrap = vec4(1000.0);

  for(int i = 0; i < 15; i++) {
    if(i >= uMaxIterations) break;

    r = length(z);
    if(r > 2.0) break;

    // Track orbit for coloring
    orbitTrap = min(orbitTrap, vec4(abs(z), r));

    // Convert to polar coordinates
    float theta = acos(z.z / r);
    float phi = atan(z.y, z.x);
    dr = pow(r, power - 1.0) * power * dr + 1.0;

    // Scale and rotate
    float zr = pow(r, power);
    theta = theta * power;
    phi = phi * power;

    // Convert back to cartesian coordinates
    z = zr * vec3(
      sin(theta) * cos(phi),
      sin(phi) * sin(theta),
      cos(theta)
    );
    z += pos;
  }

  return 0.5 * log(r) * r / dr;
}

// Typhoon Distance Estimator
float typhoonDE(vec3 p, out vec4 orbitTrap) {
  const float eps = 1e-4;
  vec3 z = p;
  float dr = 1.0;
  float r = 0.0;
  float power = clamp(uPowerBase + uPowerAmp * 0.3 * sin(uTime * 0.45), 2.0, 10.0);
  int iterLimit = min(uMaxIterations, 220);
  float maxIterF = max(float(iterLimit - 1), 1.0);

  orbitTrap = vec4(1000.0);

  for (int i = 0; i < 220; ++i) {
    if (i >= iterLimit) break;

    vec2 pos = z.xy;
    float radius2D = length(pos) + 1e-4;
    float angle2D = atan(pos.y, pos.x);
    float iterRatio = float(i) / maxIterF;

    // Breathing effect
    float breath = 0.82 + 0.18 * sin(uTime * 0.35 + iterRatio * 3.14);

    // Spiral arm phase with banding
    float armPhase = angle2D * uTyBand - uTime * (0.65 + 0.15 * breath) + iterRatio * 4.0;
    float armCos = cos(armPhase);
    float armSin = sin(armPhase);
    float bandWave = armSin;
    float armMask = 0.5 + 0.5 * armCos;
    float armWidth = mix(0.55, 1.45, armMask);

    // Vortex pull towards eye
    float vortexPull = clamp(uTyPull * breath * exp(-radius2D * (0.5 + 0.2 * armMask)), 0.0, 0.88);
    float inwardRadius = mix(radius2D, uTyEye * (0.85 + 0.15 * armWidth), vortexPull);
    float contractedRadius = inwardRadius * max(0.05, 1.0 - vortexPull);

    // Spiral compression
    float spiralPush = uTyPull * 0.18 * breath * armSin;
    float compressedRadius = max(contractedRadius - spiralPush, 0.0001);

    // Vortex spin
    float spinRamp = exp((uTyEye - compressedRadius) * (0.8 + 0.4 * armMask));
    float vortexSpin = uTySpin * spinRamp * (0.75 + 0.25 * breath);

    // Noise
    float noiseSpin = uTyNoise * (0.4 * sin(uTime * 0.9 + iterRatio * 6.2831) + 0.3 * armSin);
    float radiusNoise = uTyNoise * 0.05 * armSin;

    // Swirl scaling
    float swirlScale = mix(1.0, 0.75 + 0.35 * armWidth, 0.4 + 0.3 * uMorphOn);
    float finalRadius = max((compressedRadius + radiusNoise) * swirlScale * max(0.05, 1.0 - vortexPull * (0.6 + 0.4 * uMorphOn)), 1e-4);

    // Apply spin
    angle2D += vortexSpin + noiseSpin;
    z.xy = vec2(cos(angle2D), sin(angle2D)) * finalRadius;

    // Wall height profile
    float wallProfile = uTyWall * exp(-pow((finalRadius - uTyEye) * (1.6 + uTyBand * 0.2), 2.0));
    float wallBreath = (0.35 + 0.65 * armMask) * (0.8 + 0.2 * breath);
    z.z = mix(z.z, wallProfile * wallBreath, 0.62);
    z.z += uTyEye * 0.05 * breath * sin(uTime * 0.3 + finalRadius * (1.8 + 0.3 * armWidth));

    r = length(z);
    if (r > 6.0) break;

    orbitTrap = min(orbitTrap, vec4(abs(z), r));

    // Mandelbulb iteration
    float safeR = max(r, eps);
    float theta = acos(clamp(z.z / safeR, -1.0, 1.0));
    float phi = atan(z.y, z.x);
    float rp = pow(safeR, power);
    dr = rp / safeR * power * dr + 1.0;
    theta *= power;
    phi *= power;

    vec3 zn = rp * vec3(sin(theta)*cos(phi), sin(theta)*sin(phi), cos(theta));
    vec3 swirlOffset = vec3(0.0, 0.0, wallProfile * 0.18 * bandWave);
    z = zn + mix(p, swirlOffset, 0.22 + 0.18 * uMorphOn);
  }

  return 0.5 * log(max(r, eps)) * r / dr;
}

// Quaternion Julia Distance Estimator
float quatJuliaDE(vec3 p, out vec4 orbitTrap) {
  vec4 z = vec4(p, 0.0);
  float dr = 1.0;
  float r = 0.0;
  vec4 animatedC = uQuatC + vec4(0.25*sin(uTime*0.3), 0.25*cos(uTime*0.27), 0.2*sin(uTime*0.17 + 1.5), 0.0) * uMorphOn;
  int iterLimit = min(uMaxIterations, 250);

  orbitTrap = vec4(1000.0);

  for (int i = 0; i < 250; ++i) {
    if (i >= iterLimit) break;

    r = length(z);
    if (r > 6.0) break;

    orbitTrap = min(orbitTrap, vec4(abs(z.xyz), r));

    // Quaternion power operation
    float safeR = max(r, 1e-6);
    float theta = acos(clamp(z.w / safeR, -1.0, 1.0));
    vec3 v = z.xyz;
    float vLen = length(v);
    vec3 vNorm = vLen > 0.0 ? v / vLen : vec3(0.0);
    float rn = pow(safeR, uQuatPower);
    float ang = theta * uQuatPower;
    vec4 zPow = vec4(vNorm * sin(ang) * rn, cos(ang) * rn);
    z = uQuatScale * zPow + animatedC;
    dr = dr * uQuatPower * pow(safeR, uQuatPower - 1.0) * abs(uQuatScale) + 1.0;
  }

  return 0.5 * log(max(r, 1e-6)) * r / abs(dr);
}

// Cosmic Bloom Distance Estimator
float cosmicBloomDE(vec3 p, out vec4 orbitTrap) {
  const float PHI = 1.61803398875;
  vec3 q = p;
  float r = length(q);
  float timePhase = uTime * (0.2 + uCosExpansion * 0.6);
  float dynRadius = uCosRadius * (1.0 + uCosExpansion * 0.35 * sin(timePhase));
  float base = r - dynRadius;

  if (r > 0.0) {
    q /= r;
  }

  float theta = atan(q.z, q.x);
  float phi = acos(clamp(q.y, -1.0, 1.0));

  // Harmonic waves
  float harmonic = sin((12.0 + uCosSpiral * 24.0) * theta + uTime * 0.8) * cos((8.0 + uCosSpiral * 18.0) * phi - uTime * 0.6);

  // Golden ratio waves
  float goldenWave = sin(phi * PHI * 6.0 + theta * PHI * 5.0 + uTime * 1.4);

  // Radial waves
  float radialWave = sin(r * (18.0 + uCosSpiral * 40.0) + uTime * 1.1);

  // Combine waves with ripple strength
  float rippleAmp = uCosRipple * uCosRadius * 0.1;
  float bloom = base + rippleAmp * (0.45 * harmonic + 0.35 * goldenWave + 0.2 * radialWave);

  // Shell layers
  float shells = sin((r / max(uCosRadius, 1e-3)) * (6.0 + uCosSpiral * 10.0) + uTime * 0.4);
  bloom += uCosRipple * uCosRadius * 0.04 * shells;

  // Filament patterns
  float filament = sin(theta * (20.0 + uCosSpiral * 22.0) + phi * (14.0 + uCosSpiral * 18.0) + uTime * 0.5);
  bloom -= uCosRipple * uCosRadius * 0.02 * filament;

  orbitTrap = vec4(abs(q * r), bloom);

  return bloom;
}

// Parametric Tower SDF
float parametricTowerDE(vec3 p, out vec4 trap) {
  float x = p.x;
  float y = p.y;
  float z = p.z;

  // Vertical bounds check
  if (y < 0.0) {
    trap = vec4(abs(p), -y + 10.0);
    return -y + 10.0;
  }
  if (y > uTowerHeight) {
    trap = vec4(abs(p), y - uTowerHeight + 10.0);
    return y - uTowerHeight + 10.0;
  }

  // Calculate normalized height (0-1)
  float t = y / max(uTowerHeight, 1e-3);

  // Calculate radius with tapering
  float radius;
  if (uTowerTaperingType == 0) {
    // None
    radius = uTowerBaseRadius;
  } else if (uTowerTaperingType == 1) {
    // Linear
    radius = uTowerBaseRadius - (uTowerBaseRadius - uTowerTopRadius) * t;
  } else if (uTowerTaperingType == 2) {
    // Exponential
    radius = uTowerBaseRadius * pow(uTowerTopRadius / max(uTowerBaseRadius, 1e-3), t);
  } else if (uTowerTaperingType == 3) {
    // S-Curve (smoothstep)
    float s = t * t * (3.0 - 2.0 * t);
    radius = uTowerBaseRadius - (uTowerBaseRadius - uTowerTopRadius) * s;
  } else {
    // Setback
    float step = floor(t * 4.0) / 4.0;
    radius = uTowerBaseRadius - (uTowerBaseRadius - uTowerTopRadius) * step;
  }

  // Apply floor variation (per-floor randomness)
  if (uTowerFloorVariation > 0.001) {
    float floorIndex = floor(y / max(uTowerFloorHeight, 1e-3));
    float variation = fract(sin(floorIndex * 78.233) * 43758.5453) - 0.5;
    radius += variation * uTowerFloorVariation * radius;
  }

  // Apply asymmetry (directional variation)
  if (uTowerAsymmetry > 0.001) {
    float angleVar = atan(z, x);
    radius += sin(angleVar * 2.0) * uTowerAsymmetry * radius * 0.2;
  }

  // Calculate rotation with twisting
  float rotation = 0.0;
  if (uTowerTwistingType == 1) {
    // Uniform
    rotation = uTowerTwist * t;
  } else if (uTowerTwistingType == 2) {
    // Accelerating
    rotation = uTowerTwist * t * t;
  } else if (uTowerTwistingType == 3) {
    // Sine
    rotation = uTowerTwist * sin(t * PI / 2.0);
  }

  // Apply rotation
  float cos_r = cos(-rotation);
  float sin_r = sin(-rotation);
  float rx = x * cos_r - z * sin_r;
  float rz = x * sin_r + z * cos_r;

  // Distance from center in XZ plane
  float dist2D = length(vec2(rx, rz));

  // Shape-based distance
  float shapeDist;
  float angle = atan(rz, rx);

  if (uTowerShapeType == 0) {
    // Circle
    shapeDist = dist2D - radius;
  } else if (uTowerShapeType == 1) {
    // Square with corner rounding
    float cornerDist = max(abs(rx), abs(rz));
    // Apply corner rounding if enabled
    if (uTowerCornerRadius > 0.001) {
      vec2 q = abs(vec2(rx, rz)) - radius + uTowerCornerRadius * radius;
      shapeDist = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uTowerCornerRadius * radius;
    } else {
      shapeDist = cornerDist - radius;
    }
  } else if (uTowerShapeType == 2) {
    // Triangle
    float a = mod(angle + PI, TAU / 3.0) - PI / 3.0;
    float triRadius = radius / cos(PI / 3.0);
    shapeDist = max(dist2D * cos(a) - triRadius * 0.5, abs(dist2D * sin(a)) - triRadius * 0.866);
  } else if (uTowerShapeType == 3) {
    // Pentagon (5 sides)
    float a = mod(angle + PI, TAU / 5.0) - PI / 5.0;
    float pentRadius = radius / cos(PI / 5.0);
    shapeDist = dist2D * cos(a) - pentRadius;
  } else if (uTowerShapeType == 4) {
    // Hexagon (6 sides)
    float a = mod(angle + PI / 6.0, TAU / 6.0) - PI / 6.0;
    float hexRadius = radius / cos(PI / 6.0);
    shapeDist = dist2D * cos(a) - hexRadius;
  } else if (uTowerShapeType == 5) {
    // Octagon (8 sides)
    float a = mod(angle + PI / 8.0, TAU / 8.0) - PI / 8.0;
    float octRadius = radius / cos(PI / 8.0);
    shapeDist = dist2D * cos(a) - octRadius;
  } else if (uTowerShapeType == 6) {
    // Star (5-pointed)
    float starAngle = mod(angle + PI, TAU / 5.0);
    float innerRadius = radius * 0.5;
    float outerRadius = radius;
    float modAngle = mod(starAngle, TAU / 10.0);
    float targetRadius = mix(outerRadius, innerRadius, step(TAU / 20.0, modAngle));
    shapeDist = dist2D - targetRadius;
  } else {
    // Default to circle for other shapes
    shapeDist = dist2D - radius;
  }

  // ファサードディテール
  float facadeDetail = 0.0;
  float floorLevel = y / max(uTowerFloorHeight, 1e-3);
  float floorFract = fract(floorLevel);

  if (uTowerFacadeType == 0) {
    // グリッド型ファサード (従来型オフィスビル)
    // Use facadeGridX and facadeGridZ parameters
    float gridFreqX = 8.0 / max(uTowerFacadeGridX, 0.01); // Higher frequency for smaller grid
    float gridFreqZ = 4.0 / max(uTowerFacadeGridZ, 0.01);
    float windowGridX = sin(angle * gridFreqX) * uTowerPanelDepth;
    float windowGridY = sin(floorLevel * gridFreqZ) * uTowerPanelDepth;
    facadeDetail = windowGridX + windowGridY;

    // 各階の床スラブ
    float floorSlab = smoothstep(0.92, 0.98, floorFract) * uTowerPanelDepth * 1.5;
    facadeDetail += floorSlab;

  } else if (uTowerFacadeType == 1) {
    // カーテンウォール (ガラス張りモダンビル)
    float glassGrid = sin(angle * 32.0) * sin(floorLevel * 4.0) * 0.015;
    facadeDetail = glassGrid;

    // 縦のマリオン(柱)
    float mullions = smoothstep(0.95, 1.0, fract(angle * 8.0 / TAU)) * 0.03;
    facadeDetail += mullions;

  } else {
    // パネル型ファサード (プレキャストコンクリート)
    float panelX = step(0.5, fract(angle * 12.0 / TAU)) * 0.04;
    float panelY = step(0.5, floorFract) * 0.04;
    facadeDetail = panelX + panelY - 0.02;
  }

  shapeDist -= facadeDetail;

  // バルコニー (レジデンス用)
  if (uTowerBalconyDepth > 0.001 && uTowerBalconyRatio > 0.001) {
    float floorIndex = floor(floorLevel);
    float balconyHash = fract(sin(floorIndex * 78.233) * 43758.5453);

    // バルコニーがある階かどうか
    if (balconyHash < uTowerBalconyRatio && floorFract > 0.85) {
      float balconyDepth = uTowerBalconyDepth;
      float balconyHeight = uTowerFloorHeight * 0.15;

      // バルコニーの張り出し (外側に出る)
      float balconyDist = dist2D - (radius + balconyDepth);
      float balconyY = abs(y - (floorIndex + 0.92) * uTowerFloorHeight) - balconyHeight;
      float balconyBox = max(balconyDist, balconyY);

      // 手すり
      float railingDist = abs(dist2D - (radius + balconyDepth - 0.02)) - 0.01;
      float railingY = abs(y - (floorIndex + 1.0) * uTowerFloorHeight) - balconyHeight * 0.5;
      float railing = max(railingDist, railingY);

      shapeDist = min(shapeDist, min(balconyBox, railing));
    }
  }

  // 大きな構造分割 (5階ごと)
  float structuralDivision = smoothstep(0.95, 1.0, fract(floorLevel / 5.0)) * 0.12;
  shapeDist += structuralDivision;

  // コーナーディテール
  if (uTowerShapeType > 0) {
    float cornerDetail = smoothstep(0.92, 1.0, dist2D / max(radius, 1e-3)) * 0.04;
    shapeDist += cornerDetail;
  }

  trap = vec4(abs(p), shapeDist + 1.0);

  return shapeDist;
}

// Scene SDF with mode selection
float sceneSDF(vec3 p, out vec4 trap) {
  if (uMode == 1) {
    // Flower of Life mode - use distance for coloring
    float dist = flowerOfLifeDE(p);
    trap = vec4(abs(p), dist);
    return dist;
  } else if (uMode == 2) {
    // Fibonacci Shell mode
    return fibonacciDE(p, trap);
  } else if (uMode == 3) {
    // Mandelbox mode
    return mandelboxDE(p, trap);
  } else if (uMode == 4) {
    // Metatron Cube mode
    return metatronCubeDE(p, trap);
  } else if (uMode == 5) {
    // Gyroid Cathedral mode
    return gyroidCathedralDE(p, trap);
  } else if (uMode == 6) {
    // Typhoon mode
    return typhoonDE(p, trap);
  } else if (uMode == 7) {
    // Quaternion Julia mode
    return quatJuliaDE(p, trap);
  } else if (uMode == 8) {
    // Cosmic Bloom mode
    return cosmicBloomDE(p, trap);
  } else if (uMode == 9) {
    // Parametric Tower mode
    return parametricTowerDE(p, trap);
  } else {
    // Mode 0: Mandelbulb (default)
    return mandelbulbDE(p, trap);
  }
}

// Ray marching
vec3 getNormal(vec3 p) {
  vec2 e = vec2(uEpsilon, 0.0);
  vec4 trap;
  float d = sceneSDF(p, trap);
  return normalize(vec3(
    sceneSDF(p + e.xyy, trap) - sceneSDF(p - e.xyy, trap),
    sceneSDF(p + e.yxy, trap) - sceneSDF(p - e.yxy, trap),
    sceneSDF(p + e.yyx, trap) - sceneSDF(p - e.yyx, trap)
  ));
}

float calcAO(vec3 p, vec3 n) {
  float ao = 0.0;
  float sca = 1.0;
  for(int i = 0; i < 5; i++) {
    float h = 0.01 + 0.15 * float(i) / 4.0;
    vec4 trap;
    float d = sceneSDF(p + h * n, trap);
    ao += (h - d) * sca;
    sca *= 0.95;
  }
  return clamp(1.0 - 2.0 * ao, 0.0, 1.0);
}

void main() {
  vec2 uv = (gl_FragCoord.xy + uJitter - 0.5 * uResolution) / min(uResolution.x, uResolution.y);

  // Camera ray
  float fovRad = uFov * PI / 180.0;
  vec3 rd = normalize(uCamRot * vec3(uv * tan(fovRad * 0.5), 1.0));
  vec3 ro = uCamPos;

  float t = 0.0;
  vec4 orbitTrap = vec4(1000.0);
  bool hit = false;

  // Ray march
  for(int i = 0; i < 200; i++) {
    if(i >= uMaxSteps) break;

    vec3 p = ro + rd * t;
    vec4 trap;
    float d = sceneSDF(p, trap);

    if(d < uEpsilon * t) {
      orbitTrap = trap;
      hit = true;
      break;
    }

    if(t > 20.0) break;
    t += d * 0.9;
  }

  vec3 color = monoBg;

  if(hit) {
    vec3 p = ro + rd * t;
    vec3 n = getNormal(p);

    // Lighting
    float diff = max(dot(n, uLightDir), 0.0);
    float spec = pow(max(dot(reflect(-uLightDir, n), -rd), 0.0), uSpecPow);

    // AO
    float ao = calcAO(p, n);
    ao = pow(ao, uAOInt);

    // Color from orbit trap
    float colorVal = orbitTrap.w * uPalSpread;
    vec3 baseCol;

    // Neon Rainbow mode (-1): use time only for solid color that changes over time
    if (uColorMode == -1) {
      baseCol = getColorPalette(uTime * uPalSpeed, uColorMode, uSeed);
    } else {
      // Normal palette modes: use orbit trap for spatial color variation
      baseCol = getColorPalette(colorVal + uTime * uPalSpeed, uColorMode, uSeed);
    }

    // Combine lighting
    color = baseCol * (0.3 + 0.7 * diff) * ao;
    color += spec * 0.5;

    // Reflection
    if(uReflect > 0.01) {
      vec3 refl = reflect(rd, n);
      vec3 reflCol = mix(monoBg, baseCol * 0.5, uReflect);
      color = mix(color, reflCol, uReflect * 0.3);
    }
  }

  // Tone mapping
  color = pow(color, vec3(0.4545)); // Gamma correction

  fragColor = vec4(color, 1.0);
}
