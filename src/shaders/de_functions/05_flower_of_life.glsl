// Flower of Life Distance Estimator
// 抽出元: 250923_extention_flower_of_life_globe.html (行 1677-1826)
// ACTIVE_MODE == 5

// Required uniforms:
// - uFloSpiral, uFloHarmonic, uFloHyper, uTime

// Required helpers:
// - rot(float) -> mat2
// - GOLDEN_RATIO constant (1.61803398875)

float flowerOfLifeDE(vec3 p, float R, float spacing, float thickness, float extrude, float twist) {
  const float SHAPE_SCALE = 0.62;
  const float PHI = 1.61803398875;
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
  float spiralStrength = clamp(uFloSpiral, 0.0, 1.0);
  float harmonicStrength = clamp(uFloHarmonic, 0.0, 1.0);
  float hyperStrength = clamp(uFloHyper, 0.0, 1.0);

  float shell = abs(safeR - sphereRadius) - shellWidth;

  float strutField = 1e6;
  float baseAngle = mix(0.42, 1.05, spacing01);
  vec3 north = vec3(0.0, 0.0, 1.0);
  const float ringMultipliers[9] = float[9](1.0, 0.92, 1.14, 0.78, 1.28, 0.64, 1.42, 0.52, 1.58);
  const float baseOffsets[3] = float[3](0.0, 0.68, 1.24);

  for (int setIdx = 0; setIdx < 3; ++setIdx) {
    float baseMul = mix(1.0 - baseOffsets[setIdx] * 0.1, 1.0 + baseOffsets[setIdx] * 0.07, spacing01);
    for (int ringIdx = 0; ringIdx < 9; ++ringIdx) {
      float ringMul = mix(1.0, ringMultipliers[ringIdx], mix(extrNorm, spacing01, 0.45));
      float angle = baseAngle * baseMul * ringMul;
      float sinAngle = sin(angle);
      float cosAngle = cos(angle);
      float localRadius = strutRadius * mix(1.0, 0.48, float(ringIdx) / 8.0);

      float dNorth = sphereRadius * abs(acos(clamp(dot(dir, north), -1.0, 1.0)) - angle);
      float dSouth = sphereRadius * abs(acos(clamp(dot(dir, -north), -1.0, 1.0)) - angle);
      strutField = min(strutField, dNorth - localRadius);
      strutField = min(strutField, dSouth - localRadius);

      for (int i = 0; i < 6; ++i) {
        float az = 6.28318530718 * float(i + setIdx) / 6.0;
        float ca = cos(az);
        float sa = sin(az);
        vec3 crown = vec3(sinAngle * ca, sinAngle * sa, cosAngle);
        vec3 crownMirror = -crown;
        float dCrown = sphereRadius * abs(acos(clamp(dot(dir, crown), -1.0, 1.0)) - angle);
        float dCrownMirror = sphereRadius * abs(acos(clamp(dot(dir, crownMirror), -1.0, 1.0)) - angle);
        strutField = min(strutField, dCrown - localRadius);
        strutField = min(strutField, dCrownMirror - localRadius);

        if (setIdx == 0) {
          vec3 equ = vec3(ca, sa, 0.0);
          float dEqu = sphereRadius * abs(acos(clamp(dot(dir, equ), -1.0, 1.0)) - angle);
          strutField = min(strutField, dEqu - localRadius);
        }
      }
    }
  }

  for (int rotIdx = 0; rotIdx < 6; ++rotIdx) {
    float rotAng = (3.14159265359 / 6.0) * float(rotIdx);
    mat2 rotMat = rot(rotAng);
    vec2 base = vec2(dir.x, dir.z);
    vec2 rotated = rotMat * base;
    vec3 rdir = normalize(vec3(rotated.x, dir.y, rotated.y));
    float d = sphereRadius * acos(clamp(dot(rdir, vec3(0.0, 0.0, 1.0)), -1.0, 1.0));
    float target = baseAngle * mix(1.0, ringMultipliers[(rotIdx + 4) % 9], 0.4 * spacing01);
    strutField = min(strutField, abs(d - target * sphereRadius) - strutRadius * 0.7);
  }

  const vec3 icoDirs[12] = vec3[12](
    normalize(vec3(0.0, A, B)), normalize(vec3(0.0, -A, B)), normalize(vec3(0.0, A, -B)), normalize(vec3(0.0, -A, -B)),
    normalize(vec3(A, B, 0.0)), normalize(vec3(-A, B, 0.0)), normalize(vec3(A, -B, 0.0)), normalize(vec3(-A, -B, 0.0)),
    normalize(vec3(B, 0.0, A)), normalize(vec3(-B, 0.0, A)), normalize(vec3(B, 0.0, -A)), normalize(vec3(-B, 0.0, -A))
  );
  for (int j = 0; j < 12; ++j) {
    vec3 nrm = icoDirs[j];
    float greatArc = sphereRadius * acos(clamp(dot(dir, nrm), -1.0, 1.0));
    float target = baseAngle * mix(1.0, 1.22, extrNorm);
    strutField = min(strutField, abs(greatArc - target * sphereRadius) - strutRadius * 0.65);
  }

  if (spiralStrength > 0.001) {
    float count = mix(48.0, 168.0, spiralStrength);
    float localRadius = strutRadius * mix(0.35, 0.6, spiralStrength);
    int spiralLimit = min(int(ceil(count)), 220);
    for (int gi = 0; gi < spiralLimit; ++gi) {
      float fi = float(gi) + 0.5;
      float t = fi / count;
      float phiAngle = 2.399963229728653 * fi;
      float y = 1.0 - 2.0 * t;
      float radial = sqrt(max(0.0, 1.0 - y * y));
      vec3 sdir = normalize(vec3(cos(phiAngle) * radial, y, sin(phiAngle) * radial));
      float arc = sphereRadius * acos(clamp(dot(dir, sdir), -1.0, 1.0));
      strutField = min(strutField, arc - localRadius);
    }
    for (int gi = 0; gi < spiralLimit; ++gi) {
      float fi = float(gi) + 0.5;
      float t = fi / count;
      float phiAngle = 2.399963229728653 * fi + 3.14159265359;
      float y = 1.0 - 2.0 * t;
      float radial = sqrt(max(0.0, 1.0 - y * y));
      vec3 sdir = normalize(vec3(cos(phiAngle) * radial, y, sin(phiAngle) * radial));
      float arc = sphereRadius * acos(clamp(dot(dir, sdir), -1.0, 1.0));
      strutField = min(strutField, arc - localRadius * 0.9);
    }
  }

  if (harmonicStrength > 0.001) {
    float y = dir.y;
    float theta = atan(dir.z, dir.x);
    float baseTerm = sqrt(max(0.0, 1.0 - y * y));
    float Y40 = 0.375 * (35.0 * pow(y, 4.0) - 30.0 * y * y + 3.0);
    float Y44 = 0.375 * sqrt(35.0 / 2.0) * pow(baseTerm, 4.0) * cos(4.0 * theta);
    float Y46 = 0.5 * sqrt(231.0 / 2.0) * pow(baseTerm, 6.0) * cos(6.0 * theta);
    float harmonicMod = (0.5 * Y40 + 0.3 * Y44 + 0.2 * Y46) * harmonicStrength * strutRadius * 0.6;
    strutField -= harmonicMod;
  }

  if (hyperStrength > 0.001) {
    float tPhase = uTime * 0.18 + twistNorm * 0.1;
    vec4 hp = vec4(q, 0.0);
    hp.w = sin(dot(q.xz, vec2(PHI, PHI * 1.4)) + tPhase) * sphereRadius * (0.14 + 0.22 * hyperStrength);
    mat2 rotA = rot(PHI * 0.42 + twistNorm * 0.12);
    hp.xz = rotA * hp.xz;
    mat2 rotB = rot(PHI * 0.26 + extrNorm * 0.4);
    hp.yw = rotB * hp.yw;
    vec2 hyperRad = vec2(length(hp.xz), length(hp.yw));
    float target = sphereRadius * (1.01 + 0.2 * hyperStrength);
    float groove = abs(length(hyperRad) - target) - strutRadius * mix(0.3, 0.62, hyperStrength);
    strutField = min(strutField, groove);
  }

  strutField = max(strutField, -shellWidth * 0.85);
  strutField = min(strutField, 0.0);
  strutField = max(strutField, -shellWidth * 1.15);
  float porous = max(shell, strutField);
  return porous * SHAPE_SCALE;
}
