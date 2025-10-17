// Uniform Variables for Distance Estimation Functions
// 抽出元: 250923_extention_flower_of_life_globe.html (行 1226-1344, 2420-2528)

// === Core Parameters ===
uniform float uTime;
uniform float uFov;

// === Fractal Base Parameters ===
uniform float uPowerBase;
uniform float uPowerAmp;
uniform float uScale;
uniform float uEpsilon;

// === Rendering Quality ===
uniform float uAOInt;           // Ambient Occlusion Intensity
uniform float uReflect;         // Reflection Strength
uniform float uBumpStrength;    // Bump Mapping Strength
uniform float uIor;             // Index of Refraction
uniform float uShadowSoft;      // Shadow Softness
uniform float uSpecPow;         // Specular Power

// === Color Palette ===
uniform float uPalSpeed;        // Palette Animation Speed
uniform float uPalSpread;       // Palette Color Spread

// === Morphing & Effects ===
uniform float uJuliaMix;        // Julia Set Mix Amount
uniform float uTwist;           // Global Twist Amount
uniform float uMorphOn;         // Morphing Enable (0.0-1.0)
uniform float uFold;            // Box Fold Amount
uniform float uBoxSize;         // Box Fold Size

// === Mode 1: Fibonacci Shell ===
uniform float uFibSpiral;       // Spiral Strength
uniform float uFibBend;         // Bend Amount
uniform float uFibWarp;         // Warp Factor
uniform float uFibOffset;       // Radial Offset
uniform float uFibLayer;        // Layer Offset
uniform float uFibInward;       // Inward Pull Strength
uniform float uFibBandGap;      // Band Gap Frequency
uniform float uFibVortex;       // Vortex Strength

// === Mode 4: Typhoon ===
uniform float uTyEye;           // Eye Radius
uniform float uTyPull;          // Pull Strength
uniform float uTyWall;          // Wall Height
uniform float uTySpin;          // Spin Amount
uniform float uTyBand;          // Band Frequency
uniform float uTyNoise;         // Noise Amplitude

// === Mode 5: Flower of Life ===
uniform float uFloRadius;       // Base Sphere Radius
uniform float uFloSpacing;      // Strut Spacing
uniform float uFloThickness;    // Strut Thickness
uniform float uFloExtrude;      // Extrusion Amount
uniform float uFloTwist;        // Twist Angle
uniform float uFloSpiral;       // Spiral Pattern Strength
uniform float uFloHarmonic;     // Spherical Harmonics Strength
uniform float uFloHyper;        // Hyperdimensional Effect Strength

// === Mode 7: Metatron Cube ===
uniform float uMetaRadius;      // Overall Scale
uniform float uMetaSpacing;     // Ring Spacing
uniform float uMetaNode;        // Node Size
uniform float uMetaStrut;       // Strut Size
uniform float uMetaLayer;       // Layer Spread
uniform float uMetaTwist;       // Twist Amount

// === Mode 6: Cosmic Bloom ===
uniform float uCosExpansion;    // Expansion Factor
uniform float uCosRipple;       // Ripple Amplitude
uniform float uCosSpiral;       // Spiral Frequency

// === Mode 2: Mandelbox ===
uniform float uMbScale;         // Mandelbox Scale
uniform float uMbMinRadius;     // Minimum Radius
uniform float uMbFixedRadius;   // Fixed Radius

// === Mode 3: Quaternion Julia ===
uniform float uQuatPower;       // Quaternion Power
uniform float uQuatScale;       // Quaternion Scale

// === Mode 8: Superformula Mandala ===
uniform float uSFRadius;        // Base Radius
uniform float uSFMTheta;        // Theta M Parameter
uniform float uSFMPhi;          // Phi M Parameter
uniform float uSFN1;            // N1 Parameter
uniform float uSFN2;            // N2 Parameter
uniform float uSFN3;            // N3 Parameter
uniform float uSFAmplitude;     // Animation Amplitude
uniform float uSFAniSpeed;      // Animation Speed

// === Mode 9: Flower of Life Dome ===
uniform float uFoLDomeRadius;   // Dome Base Radius
uniform float uFoLDomeCount;    // Band Count (6-30)
uniform float uFoLDomeWidth;    // Band Width
uniform float uFoLDomeThickness;// Band Thickness
uniform float uFoLDomeSmooth;   // Band Smoothness
uniform float uFoLDomeStrength; // Effect Strength

// === Mode 10: Clifford Hopf ===
uniform float uHopfTau;         // Torus Thickness
uniform float uHopfRotA;        // Rotation Speed A
uniform float uHopfRotB;        // Rotation Speed B

// === Mode 11: Gyroid Cathedral ===
uniform float uGyroLevel;       // Level Set Value
uniform float uGyroScale;       // Scale Factor
uniform float uGyroMod;         // Modulation Strength

// === Mode 12: Schwarz-P Surface ===
uniform float uSchwarzLevel;    // Level Set Value

// === Mode 13: Icosian Kaleidoscope ===
uniform float uIcoIterations;   // Fold Iterations (2-10)
uniform float uIcoBaseRadius;   // Base Radius
uniform float uIcoThickness;    // Shell Thickness

// === Mode 14: Apollonian Sphere Pack ===
uniform float uApoIterations;   // Inversion Iterations
uniform float uApoScale;        // Scale Bias
uniform float uApoBias;         // Jitter Bias

// === Mode 15: Lissajous Knot ===
uniform float uKnotA;           // Frequency A
uniform float uKnotB;           // Frequency B
uniform float uKnotC;           // Frequency C
uniform float uKnotDelta;       // Phase Delta
uniform float uKnotPhi;         // Phase Phi
uniform float uKnotRadius;      // Tube Radius

// === Mode 16: Spherical Harmonics Shell ===
uniform float uSH_l;            // Degree l (0-12)
uniform float uSH_m;            // Order m (-l to +l)
uniform float uSHAmplitude;     // Perturbation Amplitude
uniform float uSHRadius;        // Base Radius

// === Mode 17: Quasicrystal Mandala ===
uniform float uQCFrequency;     // Wave Frequency
uniform float uQCTau;           // Tau Shift
uniform float uQCOmega;         // Rotation Speed
uniform float uQCAmp;           // Amplitude

// === Mode 18: Yantra Torus ===
uniform float uYantraRadius;    // Major Radius
uniform float uYantraMinor;     // Minor Radius
uniform float uYantraAmplitude; // Star Amplitude
uniform float uYantraStar;      // Star Points (3-24)

// === Mode 19: Lotus Fibonacci ===
uniform float uLotusCount;      // Bead Count (24-420)
uniform float uLotusRadius;     // Shell Radius
uniform float uLotusBead;       // Bead Size

// === Mode 20: Superquadric Star ===
uniform float uStarExponent;    // Superquadric Exponent
uniform float uStarM;           // Star Points (3-24)
uniform float uStarDepth;       // Wedge Depth
uniform float uStarSharp;       // Wedge Sharpness
uniform float uStarRadius;      // Overall Radius

// === Post-Processing ===
uniform float uExposure;
uniform float uGamma;
uniform float uSaturation;
uniform float uVignette;
uniform float uChroma;          // Chromatic Aberration
uniform float uGlow;

// === Bloom / Threshold ===
uniform float uThreshold;

// === Screen Space ===
uniform vec2 uResolution;
uniform vec2 uDir;              // Blur Direction
uniform float uSigma;           // Blur Sigma

// === Temporal ===
uniform float uPrevWeight;      // Temporal Anti-Aliasing Weight
