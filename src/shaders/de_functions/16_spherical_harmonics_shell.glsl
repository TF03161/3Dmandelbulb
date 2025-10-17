// Spherical Harmonics Shell Distance Estimator
// 抽出元: 250923_extention_flower_of_life_globe.html (行 2134-2145)
// ACTIVE_MODE == 16

// Required uniforms:
// - uSH_l, uSH_m, uSHAmplitude, uSHRadius

// Required constants:
// - PI (3.14159265358979323846)

// Helper function: Associated Legendre Polynomial
// 抽出元: 行 2096-2122
float assocLegendre(int l, int m, float x) {
  float pmm = 1.0;
  if (m > 0) {
    float somx2 = sqrt(max(0.0, 1.0 - x * x));
    float fact = 1.0;
    for (int i = 1; i <= 12; ++i) {
      if (i > m) break;
      pmm *= -fact * somx2;
      fact += 2.0;
    }
  }
  if (l == m) return pmm;
  float pmmp1 = x * (2.0 * float(m) + 1.0) * pmm;
  if (l == m + 1) return pmmp1;
  float prevPrev = pmm;
  float prev = pmmp1;
  float pll = 0.0;
  for (int k = 2; k <= 12; ++k) {
    int L = m + k;
    if (L > l) break;
    float fL = float(L);
    pll = ((2.0 * fL - 1.0) * x * prev - (fL + float(m) - 1.0) * prevPrev) / (fL - float(m));
    prevPrev = prev;
    prev = pll;
  }
  return pll;
}

// Helper function: Real Spherical Harmonics
// 抽出元: 行 2124-2132
float realSH(int l, int m, float theta, float phi) {
  int absM = m < 0 ? -m : m;
  float x = cos(theta);
  float P = assocLegendre(l, absM, x);
  float norm = sqrt((2.0 * float(l) + 1.0) / (4.0 * PI));
  if (m > 0) return sqrt(2.0) * norm * P * cos(float(absM) * phi);
  if (m < 0) return sqrt(2.0) * norm * P * sin(float(absM) * phi);
  return norm * P;
}

float sphericalHarmonicsShellDE(vec3 p) {
  float r = length(p);
  if (r < 1e-6) return -uSHRadius;
  vec3 dir = p / r;
  float theta = acos(clamp(dir.y, -1.0, 1.0));
  float phi = atan(dir.z, dir.x);
  int l = clamp(int(round(uSH_l)), 0, 12);
  int m = clamp(int(round(uSH_m)), -l, l);
  float Y = realSH(l, m, theta, phi);
  float target = uSHRadius * (1.0 + uSHAmplitude * Y);
  return 0.5 * (r - target);
}
