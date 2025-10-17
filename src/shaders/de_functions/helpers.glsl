// Distance Estimation Helper Functions
// 抽出元: 250923_extention_flower_of_life_globe.html (行 1362-1417)

// Mathematical Constants
const float PI = 3.14159265358979323846;
const float TAU = 6.28318530717958647692;
const float GOLDEN_RATIO = 1.6180339887498948482;

// 2D Rotation Matrix
mat2 rot(float a) {
  float c = cos(a), s = sin(a);
  return mat2(c, -s, s, c);
}

// Smooth Minimum (for blending shapes)
float smoothMin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / max(k, 1e-6), 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

// Safe Power Function (avoids negative base errors)
float safePow(float base, float exponent) {
  return pow(max(abs(base), 1e-6), exponent);
}

// Saturate (clamp to [0,1])
float saturate(float x) {
  return clamp(x, 0.0, 1.0);
}

// 1D Hash Function
float hash11(float p) {
  return fract(sin(p * 127.1) * 43758.5453);
}

// Fibonacci Sphere Distribution
// Generates evenly distributed points on a unit sphere
vec3 fibonacciDirection(int index, int total) {
  float n = float(max(total, 1));
  float i = float(index);
  float offset = 2.0 / n;
  float y = 1.0 - offset * (i + 0.5);
  float r = sqrt(max(0.0, 1.0 - y * y));
  float phi = TAU * fract(i * (GOLDEN_RATIO - 1.0));
  return normalize(vec3(cos(phi) * r, y, sin(phi) * r));
}

// Signed Distance to Capsule
float sdCapsule(vec3 p, vec3 a, vec3 b, float r) {
  vec3 pa = p - a;
  vec3 ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  return length(pa - ba * h) - r;
}

// Signed Distance to Sphere
float sdSphere(vec3 p, vec3 c, float r) {
  return length(p - c) - r;
}

// Periodic Repeat (wraps space around a period)
vec3 repeatAround(vec3 p, float period) {
  return mod(p + 0.5 * period, period) - 0.5 * period;
}

// 4D Two-Axis Rotation
vec4 rot2D(vec4 v, int axisA, int axisB, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  vec4 outv = v;
  float va = v[axisA];
  float vb = v[axisB];
  outv[axisA] = va * c - vb * s;
  outv[axisB] = va * s + vb * c;
  return outv;
}

// Box Folding (Mandelbox fold operation)
vec3 boxFold(vec3 p, float size) {
  return clamp(p, -size, size) * 2.0 - p;
}
