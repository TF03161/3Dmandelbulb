# Distance Estimation (DE) Functions - 抽出完了

元ファイル: `c:/Users/fj081/Desktop/250913_3Dmandelbulub/250923_extention_flower_of_life_globe.html`

## 抽出された20個のDE関数

各関数は個別のGLSLファイルとして保存されています。

### 1. Fibonacci Shell (fibonacciDE)
- **行範囲**: 1420-1468
- **特徴**: フィボナッチ螺旋パターン、黄金角使用、多層構造
- **主要uniform変数**:
  - `uFibSpiral`, `uFibBend`, `uFibWarp`, `uFibOffset`, `uFibLayer`
  - `uFibInward`, `uFibBandGap`, `uFibVortex`, `uMorphOn`
- **関数パラメータ**: `maxIter`, `power`, `spiral`, `bend`, `warp`, `time`, `foldAmt`, `boxSize`

### 2. Typhoon (typhoonDE)
- **行範囲**: 1473-1526
- **特徴**: 台風状の渦巻き、動的アーム構造、呼吸効果
- **主要uniform変数**:
  - `uTyEye`, `uTyPull`, `uTyWall`, `uTySpin`, `uTyBand`, `uTyNoise`
  - `uMorphOn`
- **関数パラメータ**: `powerBase`, `powerAmp`, `maxIter`, `time`, `eyeRadius`, `pullStrength`, `wallHeight`, `spinAmount`, `bandFreq`, `noiseAmp`

### 3. Mandelbox (mandelboxDE)
- **行範囲**: 1531-1557
- **特徴**: ボックスフォールディング、球面反転
- **主要uniform変数**:
  - `uMbScale`, `uMbMinRadius`, `uMbFixedRadius`
- **関数パラメータ**: `maxIter`, `scale`, `minRadius`, `fixedRadius`, `extraIter`

### 4. Quaternion Julia (quatJuliaDE)
- **行範囲**: 1562-1583
- **特徴**: 4次元ジュリア集合、時間アニメーション
- **主要uniform変数**:
  - `uQuatPower`, `uQuatScale`, `uMorphOn`
- **関数パラメータ**: `maxIter`, `c` (vec4), `power`, `scale`, `time`

### 5. Flower of Life (flowerOfLifeDE)
- **行範囲**: 1677-1826
- **特徴**: フラワーオブライフ神聖幾何学パターン、正二十面体構造、螺旋・調和・超次元モード
- **主要uniform変数**:
  - `uFloRadius`, `uFloSpacing`, `uFloThickness`, `uFloExtrude`, `uFloTwist`
  - `uFloSpiral`, `uFloHarmonic`, `uFloHyper`, `uTime`
- **関数パラメータ**: `R`, `spacing`, `thickness`, `extrude`, `twist`

### 6. Cosmic Bloom (cosmicBloomDE)
- **行範囲**: 1650-1672
- **特徴**: 宇宙的な花模様、黄金比調和波、動的半径
- **主要uniform変数**:
  - `uCosExpansion`, `uCosRipple`, `uCosSpiral`, `uTime`
- **関数パラメータ**: `R`, `expansion`, `ripple`, `spiral`

### 7. Metatron Cube (metatronCubeDE)
- **行範囲**: 1831-1886
- **特徴**: メタトロンキューブ、中心ノード、3層構造（上部・中央・下部）
- **主要uniform変数**:
  - `uMetaRadius`, `uMetaSpacing`, `uMetaNode`, `uMetaStrut`
  - `uMetaLayer`, `uMetaTwist`
- **関数パラメータ**: `radius`, `spacing`, `nodeSize`, `strutSize`, `layerSpread`, `twist`

### 8. Superformula Mandala (superformulaMandalaDE)
- **行範囲**: 1898-1911
- **特徴**: スーパーフォーミュラ、θ/φ方向のm値制御
- **主要uniform変数**:
  - `uSFRadius`, `uSFMTheta`, `uSFMPhi`, `uSFN1`, `uSFN2`, `uSFN3`
  - `uSFAmplitude`, `uSFAniSpeed`, `uTime`
- **ヘルパー関数**: `superShape(angle, m, n1, n2, n3)`

### 9. Flower of Life Dome (flowerOfLifeDomeDE)
- **行範囲**: 1916-1936
- **特徴**: フィボナッチ配置ドーム、バンド平滑化
- **主要uniform変数**:
  - `uFoLDomeRadius`, `uFoLDomeCount`, `uFoLDomeWidth`
  - `uFoLDomeThickness`, `uFoLDomeSmooth`, `uFoLDomeStrength`
- **ヘルパー関数**: `fibonacciDirection()`

### 10. Clifford Hopf (cliffordHopfDE)
- **行範囲**: 1941-1956
- **特徴**: Hopf fibration、4次元トーラス、立体射影
- **主要uniform変数**:
  - `uHopfTau`, `uHopfRotA`, `uHopfRotB`, `uTime`
- **ヘルパー関数**: `rot2D()`

### 11. Gyroid Cathedral (gyroidCathedralDE)
- **行範囲**: 1961-1974
- **特徴**: Gyroid極小曲面、周期構造
- **主要uniform変数**:
  - `uGyroLevel`, `uGyroScale`, `uGyroMod`, `uTime`
- **ヘルパー関数**: `repeatAround()`

### 12. Schwarz-P Surface (schwarzPDE)
- **行範囲**: 1979-1985
- **特徴**: Schwarz P極小曲面
- **主要uniform変数**:
  - `uSchwarzLevel`
- **ヘルパー関数**: `repeatAround()`

### 13. Icosian Kaleidoscope (icosianKaleidoscopeDE)
- **行範囲**: 2016-2023
- **特徴**: 正二十面体折り畳み、カレイドスコープ効果
- **主要uniform変数**:
  - `uIcoIterations`, `uIcoBaseRadius`, `uIcoThickness`
- **ヘルパー関数**: `foldIcosa()` (1989-2014)
- **定数**: `ICO_NORMALS[9]` (1990-2001)

### 14. Apollonian Sphere Pack (apollonianSpherePackDE)
- **行範囲**: 2036-2066
- **特徴**: アポロニウス球充填、反転幾何学
- **主要uniform変数**:
  - `uApoIterations`, `uApoScale`, `uApoBias`
- **ヘルパー関数**: `hash11()`
- **定数**: `APO_CENTERS[4]`, `APO_RADII[4]` (2028-2034)

### 15. Lissajous Knot (lissajousKnotDE)
- **行範囲**: 2079-2091
- **特徴**: リサジュー結び目、パラメトリック曲線
- **主要uniform変数**:
  - `uKnotA`, `uKnotB`, `uKnotC`, `uKnotDelta`, `uKnotPhi`, `uKnotRadius`
- **ヘルパー関数**: `lissajousPoint()` (2071-2077), `sdCapsule()`

### 16. Spherical Harmonics Shell (sphericalHarmonicsShellDE)
- **行範囲**: 2134-2145
- **特徴**: 球面調和関数、多重極展開
- **主要uniform変数**:
  - `uSH_l`, `uSH_m`, `uSHAmplitude`, `uSHRadius`
- **ヘルパー関数**:
  - `realSH()` (2124-2132)
  - `assocLegendre()` (2096-2122)

### 17. Quasicrystal Mandala (quasicrystalMandalaDE)
- **行範囲**: 2162-2177
- **特徴**: 準結晶パターン、6方向波の重ね合わせ
- **主要uniform変数**:
  - `uQCFrequency`, `uQCTau`, `uQCOmega`, `uQCAmp`, `uTime`
- **ヘルパー関数**: `quasiDir()` (2150-2160)

### 18. Yantra Torus (yantraTorusDE)
- **行範囲**: 2182-2191
- **特徴**: ヤントラトーラス、星型モジュレーション
- **主要uniform変数**:
  - `uYantraRadius`, `uYantraMinor`, `uYantraAmplitude`
  - `uYantraStar`, `uTime`

### 19. Lotus Fibonacci (lotusFibonacciDE)
- **行範囲**: 2196-2208
- **特徴**: フィボナッチ配置のビーズ、蓮華構造
- **主要uniform変数**:
  - `uLotusRadius`, `uLotusCount`, `uLotusBead`
- **ヘルパー関数**: `fibonacciDirection()`

### 20. Superquadric Star (superquadricStarDE)
- **行範囲**: 2213-2227
- **特徴**: 超2次曲面、星型くさび形状
- **主要uniform変数**:
  - `uStarExponent`, `uStarRadius`, `uStarM`, `uStarDepth`
  - `uStarSharp`

## 共通ヘルパー関数 (helpers.glsl)

### 定数
- `PI = 3.14159265358979323846`
- `TAU = 6.28318530717958647692`
- `GOLDEN_RATIO = 1.6180339887498948482`

### 関数
1. `mat2 rot(float a)` - 2D回転行列
2. `float smoothMin(float a, float b, float k)` - スムーズ最小値
3. `float safePow(float base, float exponent)` - 安全なべき乗
4. `float saturate(float x)` - [0,1]クランプ
5. `float hash11(float p)` - 1Dハッシュ関数
6. `vec3 fibonacciDirection(int index, int total)` - フィボナッチ球面分布
7. `float sdCapsule(vec3 p, vec3 a, vec3 b, float r)` - カプセル距離関数
8. `float sdSphere(vec3 p, vec3 c, float r)` - 球体距離関数
9. `vec3 repeatAround(vec3 p, float period)` - 周期的繰り返し
10. `vec4 rot2D(vec4 v, int axisA, int axisB, float angle)` - 4D 2軸回転
11. `vec3 boxFold(vec3 p, float size)` - ボックスフォールディング

## 共通uniform変数

### 基本パラメータ
- `uTime` - アニメーション時間
- `uFov` - 視野角
- `uPowerBase`, `uPowerAmp` - パワーベース・振幅
- `uMorphOn` - モーフィング有効化

### レンダリング
- `uEpsilon` - レイマーチング精度
- `uAOInt` - アンビエントオクルージョン強度
- `uReflect` - 反射強度
- `uBumpStrength` - バンプ強度
- `uIor` - 屈折率
- `uShadowSoft` - 影のソフトネス
- `uSpecPow` - スペキュラパワー

### カラーパレット
- `uPalSpeed` - パレット速度
- `uPalSpread` - パレット広がり

### ポストプロセス
- `uExposure`, `uGamma`, `uSaturation`, `uVignette`, `uChroma`, `uGlow`

## ファイル構造

```
src/shaders/de_functions/
├── README.md (このファイル)
├── helpers.glsl (共通ヘルパー関数)
├── uniforms.glsl (uniform変数定義)
├── 01_fibonacci_shell.glsl
├── 02_typhoon.glsl
├── 03_mandelbox.glsl
├── 04_quaternion_julia.glsl
├── 05_flower_of_life.glsl
├── 06_cosmic_bloom.glsl
├── 07_metatron_cube.glsl
├── 08_superformula_mandala.glsl
├── 09_flower_of_life_dome.glsl
├── 10_clifford_hopf.glsl
├── 11_gyroid_cathedral.glsl
├── 12_schwarz_p_surface.glsl
├── 13_icosian_kaleidoscope.glsl
├── 14_apollonian_sphere_pack.glsl
├── 15_lissajous_knot.glsl
├── 16_spherical_harmonics_shell.glsl
├── 17_quasicrystal_mandala.glsl
├── 18_yantra_torus.glsl
├── 19_lotus_fibonacci.glsl
└── 20_superquadric_star.glsl
```

## 使用方法

各DE関数は独立したGLSLファイルとして利用可能です。使用する際は：

1. `helpers.glsl` をインクルード（共通関数を使用）
2. `uniforms.glsl` をインクルード（必要なuniform変数を定義）
3. 対象のDE関数ファイルをインクルード

例：
```glsl
#include "helpers.glsl"
#include "uniforms.glsl"
#include "05_flower_of_life.glsl"

// フラワーオブライフを使用
float dist = flowerOfLifeDE(pos, uFloRadius, uFloSpacing, uFloThickness, uFloExtrude, uFloTwist);
```

## 抽出日時
2025-10-17

## 注意事項
- すべての関数は元HTMLファイルから正確に抽出されています
- プリプロセッサディレクティブ (`#if ACTIVE_MODE == N`) は削除され、純粋な関数定義のみが含まれています
- 各関数は独立して使用可能ですが、ヘルパー関数への依存関係に注意してください
