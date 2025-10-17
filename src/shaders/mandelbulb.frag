uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uCameraPos;
uniform mat4 uCameraMatrix;
uniform float uPower;
uniform int uIterations;
uniform int uMaxSteps;
uniform int uMode;

// Flower of Life parameters
uniform float uFolRadius;
uniform float uFolSpacing;
uniform float uFolThickness;
uniform float uFolExtrude;
uniform float uFolTwist;
uniform float uFolSpiral;
uniform float uFolHarmonic;
uniform float uFolHyper;

// Mandelbox parameters
uniform float uMbScale;
uniform float uMbMinRadius;
uniform float uMbFixedRadius;
uniform int uMbIterations;

// Quaternion Julia parameters
uniform vec4 uQuatC;
uniform float uQuatPower;
uniform float uQuatScale;

// Color parameters
uniform float uColorShift;
uniform float uColorIntensity;

varying vec2 vUv;

const float MAX_DIST = 50.0;
const float EPSILON = 0.002;
const float PI = 3.14159265359;
const float TAU = 6.28318530718;
const float GOLDEN_RATIO = 1.618033988749;

// Mandelbulb distance estimator
float mandelbulbDE(vec3 pos, float power, int iterations) {
  vec3 z = pos;
  float dr = 1.0;
  float r = 0.0;

  for (int i = 0; i < 250; i++) {
    if (i >= iterations) break;

    r = length(z);
    if (r > 2.0) break;

    // Convert to polar coordinates
    float theta = acos(z.z / r);
    float phi = atan(z.y, z.x);
    dr = pow(r, power - 1.0) * power * dr + 1.0;

    // Scale and rotate the point
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

// Sphere distance
float sphereDE(vec3 p, float radius) {
  return length(p) - radius;
}

// Utility functions
mat2 rot(float a) {
  float c = cos(a), s = sin(a);
  return mat2(c, -s, s, c);
}

vec3 boxFold(vec3 p, float size) {
  return clamp(p, -size, size) * 2.0 - p;
}

float smoothMin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / max(k, 1e-6), 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

vec3 fibonacciDirection(int index, int total) {
  float n = float(max(total, 1));
  float i = float(index);
  float offset = 2.0 / n;
  float y = 1.0 - offset * (i + 0.5);
  float r = sqrt(max(0.0, 1.0 - y * y));
  float phi = TAU * fract(i * (GOLDEN_RATIO - 1.0));
  return normalize(vec3(cos(phi) * r, y, sin(phi) * r));
}

// Flower of Life distance estimator
float flowerOfLifeDE(vec3 p, float R, float spacing, float thickness, float extrude, float twist) {
  const float SHAPE_SCALE = 0.62;
  const float PHI = GOLDEN_RATIO;
  const float INV_NORM = inversesqrt(1.0 + PHI * PHI);
  const float A = INV_NORM;
  const float B = PHI * INV_NORM;

  vec3 q = p / SHAPE_SCALE;

  float sphereRadius = max(R, 0.2);
  float shellWidth = sphereRadius * mix(0.028, 0.06, clamp(thickness, 0.0, 1.0));
  float strutRadius = shellWidth * mix(0.32, 0.7, clamp(thickness, 0.0, 1.0));
  float extrNorm = clamp(extrude, 0.0, 1.0);
  float twistNorm = clamp(abs(twist), 0.0, 6.283);

  if (abs(twist) > 1e-5) {
    float ang = twist * 0.35;
    mat2 m = rot(ang);
    q.xz = m * q.xz;
  }

  float safeR = max(length(q), 1e-5);
  vec3 dir = q / safeR;

  float spacing01 = clamp((spacing - 0.4) / (2.5 - 0.4), 0.0, 1.0);
  float spiralStrength = clamp(uFolSpiral, 0.0, 1.0);
  float harmonicStrength = clamp(uFolHarmonic, 0.0, 1.0);
  float hyperStrength = clamp(uFolHyper, 0.0, 1.0);

  float shell = abs(safeR - sphereRadius) - shellWidth;

  float strutField = 1e6;
  float baseAngle = mix(0.42, 1.05, spacing01);
  vec3 north = vec3(0.0, 0.0, 1.0);

  // Main strut pattern
  for (int ringIdx = 0; ringIdx < 9; ++ringIdx) {
    float angle = baseAngle * (1.0 + float(ringIdx) * 0.1);
    float localRadius = strutRadius * mix(1.0, 0.48, float(ringIdx) / 8.0);

    float dNorth = sphereRadius * abs(acos(clamp(dot(dir, north), -1.0, 1.0)) - angle);
    float dSouth = sphereRadius * abs(acos(clamp(dot(dir, -north), -1.0, 1.0)) - angle);
    strutField = min(strutField, dNorth - localRadius);
    strutField = min(strutField, dSouth - localRadius);

    for (int i = 0; i < 6; ++i) {
      float az = TAU * float(i) / 6.0;
      vec3 crown = vec3(sin(angle) * cos(az), sin(angle) * sin(az), cos(angle));
      float dCrown = sphereRadius * abs(acos(clamp(dot(dir, crown), -1.0, 1.0)) - angle);
      strutField = min(strutField, dCrown - localRadius);
    }
  }

  // Add spiral pattern
  if (spiralStrength > 0.001) {
    int count = int(mix(48.0, 168.0, spiralStrength));
    for (int gi = 0; gi < min(count, 200); ++gi) {
      vec3 spiralDir = fibonacciDirection(gi, count);
      float spiralDist = sphereRadius * acos(clamp(dot(dir, spiralDir), -1.0, 1.0));
      strutField = min(strutField, spiralDist - strutRadius * 0.4);
    }
  }

  strutField = max(strutField, -shellWidth * 0.85);
  strutField = min(strutField, 0.0);
  strutField = max(strutField, -shellWidth * 1.15);

  float porous = max(shell, strutField);
  return porous * SHAPE_SCALE;
}

// Mandelbox distance estimator
float mandelboxDE(vec3 p, float scale, float minRadius, float fixedRadius, int iterations) {
  vec3 z = p;
  float dr = 1.0;
  float minR2 = minRadius * minRadius;
  float fixedR2 = fixedRadius * fixedRadius;

  for (int i = 0; i < 30; i++) {
    if (i >= iterations) break;

    // Box fold
    z = boxFold(z, 1.0);

    // Sphere fold
    float r2 = dot(z, z);
    if (r2 < minR2) {
      float temp = fixedR2 / minR2;
      z *= temp;
      dr *= temp;
    } else if (r2 < fixedR2) {
      float temp = fixedR2 / r2;
      z *= temp;
      dr *= temp;
    }

    // Scale and translate
    z = scale * z + p;
    dr = dr * abs(scale) + 1.0;

    if (length(z) > 20.0) break;
  }

  float r = length(z);
  return 0.5 * log(max(r, 1e-6)) * r / abs(dr);
}

// Quaternion Julia distance estimator
float quatJuliaDE(vec3 p, int iterations, vec4 c, float power, float qScale) {
  vec4 z = vec4(p, 0.0);
  float dr = 1.0;
  float r = 0.0;

  for (int i = 0; i < 250; i++) {
    if (i >= iterations) break;

    r = length(z);
    if (r > 6.0) break;

    float safeR = max(r, 1e-6);
    float theta = acos(clamp(z.w / safeR, -1.0, 1.0));
    vec3 v = z.xyz;
    float vLen = length(v);
    vec3 vNorm = vLen > 0.0 ? v / vLen : vec3(0.0);

    float rn = pow(safeR, power);
    float ang = theta * power;
    vec4 zPow = vec4(vNorm * sin(ang) * rn, cos(ang) * rn);

    z = qScale * zPow + c;
    dr = dr * power * pow(safeR, power - 1.0) * abs(qScale) + 1.0;
  }

  return 0.5 * log(max(r, 1e-6)) * r / abs(dr);
}

// Main distance estimator
float map(vec3 p) {
  if (uMode == 0) {
    return mandelbulbDE(p, uPower, uIterations);
  } else if (uMode == 1) {
    return flowerOfLifeDE(p, uFolRadius, uFolSpacing, uFolThickness, uFolExtrude, uFolTwist);
  } else if (uMode == 2) {
    return mandelboxDE(p, uMbScale, uMbMinRadius, uMbFixedRadius, uMbIterations);
  } else if (uMode == 3) {
    return quatJuliaDE(p, uIterations, uQuatC, uQuatPower, uQuatScale);
  }
  return sphereDE(p, 1.0);
}

// Calculate normal
vec3 calcNormal(vec3 p) {
  vec2 e = vec2(EPSILON, 0.0);
  return normalize(vec3(
    map(p + e.xyy) - map(p - e.xyy),
    map(p + e.yxy) - map(p - e.yxy),
    map(p + e.yyx) - map(p - e.yyx)
  ));
}

// Ray marching
float rayMarch(vec3 ro, vec3 rd) {
  float t = 0.0;

  for (int i = 0; i < 400; i++) {
    if (i >= uMaxSteps) break;

    vec3 p = ro + rd * t;
    float d = map(p);

    if (d < EPSILON) return t;
    if (t > MAX_DIST) break;

    t += d * 0.5;
  }

  return -1.0;
}

// Color palette
vec3 hue2rgb(float h) {
  h = fract(h);
  float r = abs(h * 6.0 - 3.0) - 1.0;
  float g = 2.0 - abs(h * 6.0 - 2.0);
  float b = 2.0 - abs(h * 6.0 - 4.0);
  return clamp(vec3(r, g, b), 0.0, 1.0);
}

vec3 neonPalette(float x, float shift) {
  float h = fract(x + shift);
  vec3 c = hue2rgb(h);
  c = pow(c, vec3(0.8));
  c *= 0.7 + 0.3 * sin(TAU * (x * 1.5 + shift));
  return clamp(c, 0.0, 1.0);
}

void main() {
  vec2 uv = (vUv - 0.5) * 2.0;
  uv.x *= uResolution.x / uResolution.y;

  // Camera setup
  vec3 ro = uCameraPos;
  vec3 rd = normalize(vec3(uv, -1.5));
  rd = (uCameraMatrix * vec4(rd, 0.0)).xyz;

  // Ray march
  float t = rayMarch(ro, rd);

  vec3 color = vec3(0.0);

  if (t > 0.0) {
    vec3 p = ro + rd * t;
    vec3 normal = calcNormal(p);

    // Lighting
    vec3 lightPos = vec3(5.0, 5.0, 5.0);
    vec3 lightDir = normalize(lightPos - p);
    float diff = max(dot(normal, lightDir), 0.0);

    vec3 viewDir = normalize(ro - p);
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);

    // Color based on position and normal
    float colorValue = (normal.y * 0.5 + 0.5) * 0.4 + length(p) * 0.15;
    vec3 baseColor = neonPalette(colorValue, uColorShift);

    color = baseColor * diff * uColorIntensity + vec3(1.0) * spec * 0.5;
    color += baseColor * 0.15; // Ambient

    // Fog
    float fog = 1.0 - exp(-t * 0.05);
    color = mix(color, vec3(0.05, 0.05, 0.08), fog * 0.3);
  } else {
    color = vec3(0.05, 0.05, 0.08); // Background
  }

  gl_FragColor = vec4(color, 1.0);
}
