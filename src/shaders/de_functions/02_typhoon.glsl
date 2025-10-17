// Typhoon Distance Estimator
// 抽出元: 250923_extention_flower_of_life_globe.html (行 1473-1526)
// ACTIVE_MODE == 4

// Required uniforms:
// - uMorphOn

float typhoonDE(vec3 p, float powerBase, float powerAmp, int maxIter, float time,
                float eyeRadius, float pullStrength, float wallHeight, float spinAmount,
                float bandFreq, float noiseAmp) {
  const float eps = 1e-4;
  vec3 z = p;
  float dr = 1.0;
  float r = 0.0;
  float power = clamp(powerBase + powerAmp * 0.3 * sin(time * 0.45), 2.0, 10.0);
  int iterLimit = min(maxIter, 220);
  float maxIterF = max(float(iterLimit - 1), 1.0);

  for (int i = 0; i < iterLimit; ++i) {
    vec2 pos = z.xy;
    float radius2D = length(pos) + 1e-4;
    float angle2D = atan(pos.y, pos.x);
    float iterRatio = float(i) / maxIterF;
    float breath = 0.82 + 0.18 * sin(time * 0.35 + iterRatio * 3.14);
    float armPhase = angle2D * bandFreq - time * (0.65 + 0.15 * breath) + iterRatio * 4.0;
    float armCos = cos(armPhase);
    float armSin = sin(armPhase);
    float bandWave = armSin;
    float armMask = 0.5 + 0.5 * armCos;
    float armWidth = mix(0.55, 1.45, armMask);
    float vortexPull = clamp(pullStrength * breath * exp(-radius2D * (0.5 + 0.2 * armMask)), 0.0, 0.88);
    float inwardRadius = mix(radius2D, eyeRadius * (0.85 + 0.15 * armWidth), vortexPull);
    float contractedRadius = inwardRadius * max(0.05, 1.0 - vortexPull);
    float spiralPush = pullStrength * 0.18 * breath * armSin;
    float compressedRadius = max(contractedRadius - spiralPush, 0.0001);
    float spinRamp = exp((eyeRadius - compressedRadius) * (0.8 + 0.4 * armMask));
    float vortexSpin = spinAmount * spinRamp * (0.75 + 0.25 * breath);
    float noiseSpin = noiseAmp * (0.4 * sin(time * 0.9 + iterRatio * 6.2831) + 0.3 * armSin);
    float radiusNoise = noiseAmp * 0.05 * armSin;
    float swirlScale = mix(1.0, 0.75 + 0.35 * armWidth, 0.4 + 0.3 * uMorphOn);
    float finalRadius = max((compressedRadius + radiusNoise) * swirlScale * max(0.05, 1.0 - vortexPull * (0.6 + 0.4 * uMorphOn)), 1e-4);
    angle2D += vortexSpin + noiseSpin;
    z.xy = vec2(cos(angle2D), sin(angle2D)) * finalRadius;
    float wallProfile = wallHeight * exp(-pow((finalRadius - eyeRadius) * (1.6 + bandFreq * 0.2), 2.0));
    float wallBreath = (0.35 + 0.65 * armMask) * (0.8 + 0.2 * breath);
    z.z = mix(z.z, wallProfile * wallBreath, 0.62);
    z.z += eyeRadius * 0.05 * breath * sin(time * 0.3 + finalRadius * (1.8 + 0.3 * armWidth));
    r = length(z);
    if (r > 6.0) break;
    float safeR = max(r, eps);
    float theta = acos(clamp(z.z / safeR, -1.0, 1.0));
    float phi = atan(z.y, z.x);
    float rp = pow(safeR, power);
    dr = rp / safeR * power * dr + 1.0;
    theta *= power;
    phi *= power;
    vec3 zn = rp * vec3(sin(theta) * cos(phi), sin(theta) * sin(phi), cos(theta));
    vec3 swirlOffset = vec3(0.0, 0.0, wallProfile * 0.18 * bandWave);
    z = zn + mix(p, swirlOffset, 0.22 + 0.18 * uMorphOn);
  }

  return 0.5 * log(max(r, eps)) * r / dr;
}
