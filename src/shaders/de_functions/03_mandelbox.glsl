// Mandelbox Distance Estimator
// 抽出元: 250923_extention_flower_of_life_globe.html (行 1531-1557)
// ACTIVE_MODE == 3

// Required uniforms:
// - uMbScale, uMbMinRadius, uMbFixedRadius, uMbIter

// Required helpers:
// - boxFold(vec3, float)

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
      // Linear scaling inner sphere
      float temp = fixedRadius2 / minRadius2;
      z *= temp;
      dr *= temp;
    } else if (r2 < fixedRadius2) {
      // Inverse scaling outer sphere
      float temp = fixedRadius2 / r2;
      z *= temp;
      dr *= temp;
    }

    // Scale and shift
    z = z * scale + offset;
    dr = dr * abs(scale) + 1.0;
  }

  float r = length(z.xyz);
  return r / abs(dr);
}
