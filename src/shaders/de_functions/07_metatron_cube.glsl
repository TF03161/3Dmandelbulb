// Metatron's Cube Distance Estimator
// 抽出元: 250923_extention_flower_of_life_globe.html (行 1831-1886)
// ACTIVE_MODE == 7

// Required helpers:
// - rot(float) -> mat2
// - sdCapsule(vec3, vec3, vec3, float) -> float

float metatronCubeDE(vec3 p, float radius, float spacing, float nodeSize, float strutSize, float layerSpread, float twist) {
  float scale = max(radius, 0.2);
  vec3 q = p / scale;

  if (abs(twist) > 1e-5) {
    float angA = twist * 0.45;
    float angB = twist * 0.22;
    q.xy = rot(angA) * q.xy;
    q.xz = rot(angB) * q.xz;
  }

  float ringRad = mix(0.7, 1.4, clamp(spacing, 0.0, 1.5));
  float layerH = mix(0.0, 1.2, clamp(layerSpread, 0.0, 1.5));
  float nodeR = mix(0.08, 0.45, clamp(nodeSize, 0.0, 1.0));
  float strutR = nodeR * mix(0.3, 0.85, clamp(strutSize, 0.0, 1.0));

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

  return minField * scale;
}
