// Gyroid Cathedral Distance Estimator
// 抽出元: 250923_extention_flower_of_life_globe.html (行 1961-1974)
// ACTIVE_MODE == 11

// Required uniforms:
// - uGyroLevel, uGyroScale, uGyroMod, uTime

// Required helpers:
// - repeatAround(vec3, float)

float gyroidCathedralDE(vec3 p, out vec4 orbitTrap) {
  float scale = max(uGyroScale, 0.1);
  vec3 q = p / scale;

  // Apply periodic repetition if enabled
  if (uGyroMod > 0.01) {
    float period = mix(4.0, 12.0, clamp(uGyroMod, 0.0, 1.0));
    q = repeatAround(q, period);
  }

  // Gyroid minimal surface equation:
  // sin(x)cos(y) + sin(y)cos(z) + sin(z)cos(x) = level
  float gyroidValue =
    sin(q.x) * cos(q.y) +
    sin(q.y) * cos(q.z) +
    sin(q.z) * cos(q.x);

  float targetLevel = uGyroLevel;
  float dist = abs(gyroidValue - targetLevel);

  // Approximate distance field (gyroid is not a true SDF)
  // Scale by gradient magnitude approximation
  float gradMag = length(vec3(
    cos(q.x) * cos(q.y) - sin(q.z) * sin(q.x),
    -sin(q.x) * sin(q.y) + cos(q.y) * cos(q.z),
    -sin(q.y) * sin(q.z) + cos(q.z) * cos(q.x)
  ));

  float approxDist = dist / max(gradMag, 0.1);

  // Orbit trap for coloring
  orbitTrap = vec4(abs(q), approxDist);

  return approxDist * scale * 0.5;
}
