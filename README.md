# 🌸 3D Mandelbulb Visualizer

**Real-time morphing fractal renderer powered by WebGL2 and Miyabi Framework**

An interactive 3D Mandelbulb fractal visualizer with real-time parameter controls, built with autonomous AI development.

## ✨ Features

- 🎨 **Real-time 3D Mandelbulb Rendering** - GPU-accelerated ray marching with WebGL2
- 🎛️ **Interactive Controls** - Live parameter adjustment with lil-gui
- 🌈 **Dynamic Coloring** - Orbit trap coloring with palette animation
- 🖱️ **Mouse Interaction** - Drag to rotate, scroll to zoom
- ⚡ **High Performance** - Optimized shaders with configurable quality settings
- 🎨 **Preset System** - Multiple fractal configurations ready to explore

## 🚀 Quick Start

### Installation

```bash
npm install
```

### Run Development Server

```bash
npm run dev          # Start at http://localhost:3001
```

The 3D visualizer will open in your browser automatically!

### Other Commands

```bash
npm run build        # Build for production
npm test             # Run tests
npm run typecheck    # TypeScript type checking
npm run lint         # Lint code
```

### GLTF to IFC Conversion

Convert exported GLTF files to IFC format for BIM software (Revit, ArchiCAD, Tekla):

```bash
# Basic usage
npm run gltf-to-ifc -- input.gltf output.ifc

# With options
npm run gltf-to-ifc -- input.gltf output.ifc --project-name "My Building" --author "Your Name"
```

**Options:**
- `--project-name <name>` - Project name (default: from GLTF metadata)
- `--author <name>` - Author name (default: Claude)
- `--organization <name>` - Organization name (default: 3Dmandelbulb)
- `--latitude <lat>` - Latitude (default: 35.6762)
- `--longitude <lon>` - Longitude (default: 139.6503)

## 📂 Project Structure

```
3Dmandelbulb/
├── src/
│   ├── main.ts              # Entry point
│   ├── renderer/
│   │   └── webgl-renderer.ts  # WebGL2 rendering engine
│   ├── shaders/
│   │   ├── vertex.glsl       # Vertex shader
│   │   └── fragment.glsl     # Fragment shader (ray marching)
│   ├── ui/
│   │   └── controls.ts       # lil-gui parameter controls
│   └── utils/
│       └── vec3.ts           # Vector math utilities
├── tests/                    # Test files
├── .claude/                  # AI agent configuration
├── .github/workflows/        # CI/CD automation
├── index.html                # Main HTML entry
├── CLAUDE.md                 # AI context file
└── package.json
```

## 🎮 Controls

- **Mouse Drag**: Rotate camera
- **Mouse Wheel**: Zoom in/out
- **GUI Panel**: Adjust fractal parameters in real-time
  - Fractal Parameters (iterations, power, scale)
  - Rendering Quality (max steps, epsilon)
  - Lighting & Material (AO, reflections, specular)
  - Colors (palette animation, seed values)
  - Deformations (twist, fold, morphing)

## 🎨 Presets

Try these built-in presets from the GUI:

- **Classic Mandelbulb**: The traditional power-8 Mandelbulb
- **Twisted Dream**: Animated morphing with twist deformation
- **Quantum Foam**: Lower power with box folding
- **Alien Architecture**: High-power geometric structures

## 🏗️ FoLD Export (Flower of Life Dome)

Export architectural-scale 3D models to glTF/GLB format for use in CAD, BIM, or 3D software.

### Quick Export

```bash
npx ts-node tools/export-fol-dome.ts --radius 15 --res 256 --out exports/fol-dome-R15m.glb
```

### Parameters

- `--radius, -r <meters>` - Dome radius (default: 15.0m)
- `--res <number>` - Grid resolution (default: 256, higher = more detail)
- `--count <0..1>` - Number of bands (default: 0.5 ≈ 18 bands)
- `--width <0..1>` - Band width (default: 0.20)
- `--thickness <0..1>` - Band thickness (default: 0.12)
- `--smooth <0..1>` - Smoothing factor (default: 0.08)
- `--strength <0..1>` - Field strength (default: 0.30)
- `--out, -o <path>` - Output file path

### Example

```bash
# Export a 15m radius dome at high resolution
npx ts-node tools/export-fol-dome.ts \
  --radius 15 \
  --res 320 \
  --count 0.50 \
  --width 0.20 \
  --thickness 0.12 \
  --smooth 0.08 \
  --strength 0.30 \
  --out exports/fol-dome-high-res.glb
```

### Viewing the GLB

Use any glTF viewer:
- [Khronos Sample Viewer](https://github.khronos.org/glTF-Sample-Viewer-Release/)
- Blender (File → Import → glTF 2.0)
- Three.js / Babylon.js loaders
- Most 3D software (Unity, Unreal, etc.)

### Technical Details

- **Units**: Meters (glTF standard)
- **Coordinate System**: Right-handed, +Y up, +Z forward
- **Algorithm**: Marching Cubes on SDF (distance field)
- **Output**: Triangle mesh with vertex normals
- **Typical Size**: 2-20 MB depending on resolution

## ☁️ Speckle Cloud Integration

Upload architectural models directly to Speckle BIM platform for real-time collaboration and integration with Revit, Rhino, Grasshopper, Blender, and more.

### Quick Upload

1. **Get Personal Access Token**
   - Visit: https://speckle.xyz/profile
   - Generate a new token
   - Copy the token

2. **Configure in GUI**
   - Open the ☁️ Speckle Cloud folder in lil-gui
   - Paste your Access Token
   - (Optional) Set Stream ID, Branch Name, Commit Message

3. **Upload**
   - Click ☁️ Upload to Speckle button
   - Wait for upload to complete
   - View your model at the provided URL

### Supported Fractals

- **Mandelbulb** (mode 0)
- **Mandelbox** (mode 3)
- **Gyroid** (mode 5)

### What Gets Uploaded

All architectural components are converted to Speckle objects:

| Component | Speckle Type |
|-----------|--------------|
| Shell | Objects.Geometry.Mesh |
| Frame | Objects.Geometry.Line (array) |
| Floors | Objects.Geometry.Mesh (array) |
| Core | Objects.Geometry.Polyline |
| Panels | Objects.Geometry.Mesh (array) |

### Metadata Included

- Fractal type (mandelbulb, mandelbox, gyroid)
- Export date/time
- Application version
- Units (meters)
- Custom description and commit message

### Integration Workflow

1. **3Dmandelbulb** → Generate fractal architecture
2. **Speckle Cloud** → Upload and store
3. **Revit/Rhino/Grasshopper** → Download via Speckle plugin
4. **Edit & Refine** → Use professional BIM tools
5. **Collaborate** → Share with team via Speckle streams

### Advanced Options

**Server URL:** Default is `https://speckle.xyz`, but you can use self-hosted Speckle servers

**Stream ID:** Leave empty to create a new stream, or provide existing stream ID to update

**Branch Name:** Default is `main`, use custom branches for versioning

**Commit Message:** Auto-generated or custom message describing the export

### Viewing on Speckle

After upload, you'll receive a URL like:
```
https://speckle.xyz/streams/{streamId}/commits/{commitId}
```

Open this URL to view your model in Speckle's 3D viewer with:
- Real-time 3D navigation
- Object properties
- Comments and annotations
- Version history

### Technical Details

- **API:** Speckle GraphQL API + REST endpoints
- **Authentication:** Bearer token (Personal Access Token)
- **Transport:** JSON serialization with nested objects
- **Timeout:** 60 seconds per request
- **Max Size:** Depends on Speckle plan (typically 100MB+)

## Miyabi Framework

This project uses **7 autonomous AI agents**:

1. **CoordinatorAgent** - Task planning & orchestration
2. **IssueAgent** - Automatic issue analysis & labeling
3. **CodeGenAgent** - AI-powered code generation
4. **ReviewAgent** - Code quality validation (80+ score)
5. **PRAgent** - Automatic PR creation
6. **DeploymentAgent** - CI/CD deployment automation
7. **TestAgent** - Test execution & coverage

### Workflow

1. **Create Issue**: Describe what you want to build
2. **Agents Work**: AI agents analyze, implement, test
3. **Review PR**: Check generated pull request
4. **Merge**: Automatic deployment

### Label System

Issues transition through states automatically:

- `📥 state:pending` - Waiting for agent assignment
- `🔍 state:analyzing` - Being analyzed
- `🏗️ state:implementing` - Code being written
- `👀 state:reviewing` - Under review
- `✅ state:done` - Completed & merged

## Commands

```bash
# Check project status
npx miyabi status

# Watch for changes (real-time)
npx miyabi status --watch

# Create new issue
gh issue create --title "Add feature" --body "Description"
```

## Configuration

### Environment Variables

Required variables (see `.env.example`):

- `GITHUB_TOKEN` - GitHub personal access token
- `ANTHROPIC_API_KEY` - Claude API key (optional for local development)
- `REPOSITORY` - Format: `owner/repo`

### GitHub Actions

Workflows are pre-configured in `.github/workflows/`:

- CI/CD pipeline
- Automated testing
- Deployment automation
- Agent execution triggers

**Note**: Set repository secrets at:
`https://github.com/TF03161/3Dmandelbulb/settings/secrets/actions`

Required secrets:
- `GITHUB_TOKEN` (auto-provided by GitHub Actions)
- `ANTHROPIC_API_KEY` (add manually for agent execution)

## Documentation

- **Miyabi Framework**: https://github.com/ShunsukeHayashi/Miyabi
- **NPM Package**: https://www.npmjs.com/package/miyabi
- **Label System**: See `.github/labels.yml`
- **Agent Operations**: See `CLAUDE.md`

## Support

- **Issues**: https://github.com/ShunsukeHayashi/Miyabi/issues
- **Discord**: [Coming soon]

## License

MIT

---

✨ Generated by [Miyabi](https://github.com/ShunsukeHayashi/Miyabi)
