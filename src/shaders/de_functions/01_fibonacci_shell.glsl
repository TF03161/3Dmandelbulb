// Fibonacci Shell Distance Estimator
// 抽出元: 250923_extention_flower_of_life_globe.html (行 1420-1468)
// ACTIVE_MODE == 1

// Required uniforms:
// - uFibSpiral, uFibBend, uFibWarp, uFibOffset, uFibLayer
// - uFibInward, uFibBandGap, uFibVortex, uMorphOn, uTime

// Required helpers:
// - boxFold(vec3, float)

float fibonacciDE(vec3 p, int maxIter, float power, float spiral, float bend, float warp, float time, float foldAmt, float boxSize) {
  const float goldenAngle = 2.399963229728653;
  const float eps = 1e-4;
  vec3 z = p;
  float dr = 1.0;
  float r = 0.0;
  float safePower = clamp(power, 1.5, 12.0);
  int iterLimit = min(maxIter, 250);
  float maxIterF = max(float(iterLimit - 1), 1.0);

  for (int i = 0; i < iterLimit; ++i) {
    r = length(z);
    if (r > 6.0) break;

    if (foldAmt > 0.0) {
      z = mix(z, boxFold(z, boxSize), foldAmt);
    }

    float safeR = max(r, eps);
    float theta = acos(clamp(z.z / safeR, -1.0, 1.0));
    float phi = atan(z.y, z.x);
    float iterRatio = float(i) / maxIterF;

    vec2 radialDir = normalize(z.xy + vec2(1e-4));
    float bandFreq = max(uFibBandGap, 0.05);
    float bandPhase = iterRatio * 6.2831 * bandFreq + time * 0.7;
    float layerPhase = iterRatio * 6.2831 * (0.6 + 0.4 * bandFreq) + time * 0.45;
    float bandWave = sin(bandPhase);
    float bandPulse = 0.5 + 0.5 * bandWave;

    z.xy += radialDir * (uFibOffset * bandPulse);
    z.z += uFibLayer * 0.6 * sin(layerPhase);

    float planeRadius = max(length(z.xy), eps);
    float inwardPulse = 0.5 + 0.5 * sin(time * 0.52 + iterRatio * 5.2 + bandWave * 0.6);
    float inwardStrength = clamp(uFibInward * inwardPulse * exp(-planeRadius * (0.45 + 0.25 * bandPulse)), 0.0, 0.95);
    z.xy = mix(z.xy, z.xy * (1.0 - 0.55 * inwardStrength), 0.7);
    z.xy -= radialDir * (inwardStrength * 0.18);

    float morph = 0.55 + 0.45 * uMorphOn;
    float spiralOsc = sin(time * 0.6 + float(i) * warp * 0.35 + bandPhase * 0.25);
    float spiralPush = spiral * morph * (0.4 + 0.6 * (0.5 + 0.5 * spiralOsc)) + uFibLayer * (iterRatio - 0.5) * (0.7 + 0.3 * bandPulse);
    float bendOsc = bend * sin(time * 0.5 + float(i) * 0.38);
    float vortexBase = uFibVortex * (0.25 + 0.75 * iterRatio);
    float vortexAccel = uFibVortex * (0.12 + 0.35 * inwardStrength) * (0.5 + 0.5 * bandWave);

    float rp = pow(safeR, safePower);
    dr = rp / safeR * safePower * dr + 1.0;
    theta = theta * safePower + bendOsc + (0.18 + 0.12 * uFibVortex) * sin(iterRatio * 9.0 + time * 0.4) + uFibInward * 0.08 * cos(bandPhase - time * 0.3);
    phi += goldenAngle + spiralPush + vortexBase;
    phi += vortexAccel * sin(time * 0.55 + float(i) * 0.42 + bandPhase);

    vec3 zn = rp * vec3(sin(theta) * cos(phi), sin(theta) * sin(phi), cos(theta));
    float feedbackMix = mix(0.18 + 0.22 * uMorphOn, 0.08 + 0.12 * uMorphOn, inwardStrength);
    z = zn + mix(p, z, feedbackMix);
  }

  return 0.5 * log(max(r, eps)) * r / dr;
}
