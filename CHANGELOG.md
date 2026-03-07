# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-03-05

### Added
- ✨ Custom color support for scene titles
  - New `color` property in SceneData type
  - Apply custom colors to main titles (e.g., `color: "#FF0000"`)
- 📚 OpenClaw Chat integration guide
  - Complete workflow demonstration
  - Integration test documentation

### Security
- 🔐 **IMPORTANT**: Removed hardcoded API key from scripts
  - Now loads configuration from `.env` file (best practice)
  - Added API key validation with helpful error messages
  - Enhanced security for production deployments

### Improved
- 🛠️ Enhanced `generate-for-openclaw.sh` script
  - Uses relative paths instead of absolute paths
  - Better error handling and user-friendly messages
  - Displays API endpoint being used
  - Script directory auto-detection for portability
- 📁 Updated `.gitignore` to exclude generated files
  - Prevents committing temporary audio files
  - Cleaner repository structure

### Changed
- Improved error messages with emojis and formatting
- Better script portability across different environments

## [1.0.0] - 2026-03-03

### Added
- 🎤 OpenAI TTS integration for voice generation
- ⏱️ OpenAI Whisper integration for timestamp extraction
- 🎬 Intelligent scene orchestration with 6 scene types
- 🎨 Cyber wireframe visual style with neon effects
- 🤖 Smart Agent system for natural language interaction
- 📝 Complete documentation suite (5000+ lines)
- 🛠️ CLI tools for easy video generation
- 📦 Full automation pipeline from text to video
- 🎯 Example scripts and demo videos
- ⚡ Fast rendering with Remotion

### Features
- Text-to-speech with multiple voice options
- Automatic timing and scene detection
- 6 scene types: title, emphasis, pain, content, circle, end
- 1080x1920 portrait video output
- 30 fps rendering
- Customizable voice speed and style
- Agent-based natural language interface
- Cost-effective: ~$0.003 per 15-second video

### Documentation
- Comprehensive README
- Quick start guide (QUICKSTART.md)
- Delivery documentation (DELIVERY.md)
- Project summary (PROJECT_SUMMARY.md)
- Agent usage guide (docs/AGENT.md)
- FAQ and troubleshooting (docs/FAQ.md)
- Technical documentation for TTS, Whisper, Pipeline
- Integration guide for OpenClaw

### Initial Release
This is the first stable release of OpenClaw Video, ready for production use.

[1.0.0]: https://github.com/ZhenRobotics/openclaw-video/releases/tag/v1.0.0
