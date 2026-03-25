# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.2] - 2026-03-25

### Added - Conversation Memory

**🎉 Major Feature: Auto-trigger conversation memory extraction**

- **MemoryExtractor Module** - Intelligent information extraction from conversations
  - Extracts names, dates, events from natural language
  - Supports Chinese and English trigger words
  - Automatic entity recognition (姓名、日期、事件)
  - Confidence scoring for extraction quality

- **New CLI Command: `remember`** - Store information from conversations
  - `openclaw-memory-os remember "记住我的名字：刘小容"`
  - `openclaw-memory-os remember "Remember my name is Liu Xiaorong"`
  - Auto-detects language (Chinese/English)
  - Provides friendly confirmation messages

- **AUTO-TRIGGER Support** - Works in conversation contexts
  - Trigger keywords: 记住, 保存, remember, save, store
  - Automatic extraction and storage
  - No manual file operations needed
  - Perfect for chat-based memory building

### Enhanced

- **ClawHub Integration** - Updated skill.md for auto-trigger usage
  - Added conversation memory usage examples
  - Documented trigger keywords
  - Provided quick start guide

### Fixed

- **CLI Version Display** - Updated from 0.1.0 to 0.1.2
- **TypeScript Strict Mode** - Fixed optional chaining issues

### Technical Details

**New Files**:
- `src/conversation/memory-extractor.ts` - Core extraction logic (260+ lines)
- `test-conversation-memory.sh` - Comprehensive test suite (250+ lines)

**Modified Files**:
- `src/cli/index.ts` - Added `remember` command
- `clawhub-upload/skill.md` - Updated with conversation memory guide

**Test Coverage**:
- Chinese name extraction
- English name extraction
- Date recognition (multiple formats)
- Event extraction
- Complex multi-entity information
- Trigger word detection
- Memory storage integration

### Migration from v0.1.1

No breaking changes. All v0.1.1 features remain fully functional.

**New capabilities**:
```bash
# Old way (still works)
openclaw-memory-os collect --source ~/notes/

# New way (conversation memory)
openclaw-memory-os remember "记住重要信息"
```

**In conversation**:
```
User: 记住我的名字：刘小容
Assistant: ✅ 已记住！姓名: 刘小容
```

## [0.1.1] - 2026-03-21

### Added

- **Functional CLI Collect Command** - Users can now batch import files from directories
  - `openclaw-memory-os collect --source <path>` is now fully functional
  - Supports recursive directory scanning
  - Displays real-time progress with filename
  - Automatic file type detection (TEXT vs CODE)
  - Integration with FileCollector for batch processing

### Fixed

- **FileCollector Data Format** - Content now stored as direct strings instead of nested objects
  - Enables proper search functionality on imported files
  - Files are now searchable by their actual content
  - Metadata properly includes filename, filepath, and filesize

- **Storage Path Consistency** - Unified storage path across all CLI commands
  - All commands now use `~/.memory-os` as default storage path
  - Search command correctly finds memories collected via collect command
  - Status command displays accurate statistics

- **Progress Display** - Filename now shown correctly during import
  - Changed from "unknown" to actual filename in progress indicator
  - Better user feedback during batch operations

### Verified

- Comprehensive test suite (test-cli-collect.sh) with 8/8 tests passing
  - File collection (4 files including nested directories)
  - Search functionality (Chinese and English keywords)
  - Status command validation
  - Data format verification
  - Recursive directory scanning

## [0.1.0] - 2026-03-08

### Added - Initial Release

OpenClaw Memory-OS v0.1.0 - Digital Immortality Service | Cognitive Continuity Infrastructure

This is the initial MVP release of Memory-OS, a personal memory management system for digital immortality.

#### Core Features

- **Memory Data Model** - Complete type system with 6 memory types
  - TEXT - Text notes, documents, thoughts
  - CODE - Source code, snippets, technical content
  - CHAT - Conversation history, messages
  - FILE - Generic file metadata
  - MEDIA - Images, audio, video content
  - ACTIVITY - System activities, events

- **Storage Layer** - Local file system storage
  - LocalStorage implementation with JSON-based persistence
  - Index management for efficient retrieval
  - Caching layer for performance
  - Support for ~/.memory-os data directory

- **Collection System** - Modular collector architecture
  - BaseCollector abstract class for extensibility
  - FileCollector for document collection
  - Support for multiple file types (.txt, .md, .json, .js, .ts, .py, .java, .cpp, .go, .rs)
  - Recursive directory scanning
  - Automatic metadata extraction

- **CLI Tool** - Complete command-line interface
  - 12 commands for memory management
  - `init` - Initialize Memory-OS
  - `collect` - Collect memories from sources
  - `search` - Search memories with filters
  - `timeline` - Timeline queries
  - `graph` - Knowledge graph operations (planned)
  - `chat` - Cognitive chat interface (planned)
  - `status` - System status and statistics
  - `config` - Configuration management
  - And more...

- **TypeScript API** - Full programmatic access
  - MemoryOS main class with EventEmitter
  - Type-safe interfaces with 40+ TypeScript definitions
  - Promise-based async API
  - Event-driven architecture

- **Documentation** - Comprehensive guides
  - README.md (500+ lines) - Complete project overview
  - ARCHITECTURE.md (400+ lines) - System architecture
  - QUICKSTART.md (350+ lines) - 5-minute quick start
  - MIGRATION.md - Refactoring history
  - Examples with basic usage and agent integration

#### Technical Stack

- **Language**: TypeScript 5.7 (strict mode)
- **Runtime**: Node.js 18+
- **CLI Framework**: Commander.js 12.1
- **Build**: TypeScript Compiler (tsc)
- **Package Manager**: npm
- **License**: MIT

#### Project Statistics

- 8 TypeScript source files (~2000 lines of code)
- 8 compiled JavaScript files
- 40+ TypeScript type definitions
- 12 CLI commands
- 2 usage examples
- 5 documentation files
- 2 dependencies (commander, uuid)
- 100% local operation (no external API calls)
- Zero cost to run

#### Architecture Highlights

- Modular design with clear separation of concerns
- Event-driven architecture for extensibility
- Plugin system for custom collectors
- Multi-layer storage (vector, graph, timeline - planned)
- Privacy-first with local storage
- Agent-ready for AI integration

#### Known Limitations

- Storage: Local file system only (no cloud sync)
- Search: Keyword-based only (semantic search planned for v0.2.0)
- Embedding: Not yet implemented (planned for v0.2.0)
- Knowledge Graph: Basic structure only (full implementation planned for v0.3.0)
- Multi-modal: Text and code only (media support planned for v0.3.0)
- Cognitive Chat: Framework only (LLM integration planned for v0.2.0)

#### Installation

```bash
# via npm
npm install -g openclaw-memory-os

# verify installation
openclaw-memory-os --version

# initialize
openclaw-memory-os init
```

#### Usage

```bash
# Collect memories
openclaw-memory-os collect --source ~/Documents

# Search memories
openclaw-memory-os search "query"

# View timeline
openclaw-memory-os timeline --date 2024-03-01

# Check status
openclaw-memory-os status
```

#### API Usage

```typescript
import { MemoryOS, MemoryType } from 'openclaw-memory-os';

const memory = new MemoryOS({});
await memory.init();

await memory.collect({
  type: MemoryType.TEXT,
  content: 'My first memory',
  metadata: { tags: ['test'] },
});

const results = await memory.search({
  query: 'memory',
  limit: 10,
});
```

### Links

- **npm**: https://www.npmjs.com/package/openclaw-memory-os
- **GitHub**: https://github.com/ZhenRobotics/openclaw-memory-os
- **ClawHub**: https://clawhub.ai/ZhenStaff/memory-os
- **Issues**: https://github.com/ZhenRobotics/openclaw-memory-os/issues

### Roadmap

Next releases planned:
- v0.2.0 - AI Integration (semantic search, embeddings, LLM)
- v0.3.0 - Knowledge Graph (relations, graph queries, visualization)
- v1.0.0 - Production Ready (cloud sync, multi-modal, mobile)

---

**Memory-OS - Digital Immortality Through Memory**

[0.1.2]: https://github.com/ZhenRobotics/openclaw-memory-os/releases/tag/v0.1.2
[0.1.1]: https://github.com/ZhenRobotics/openclaw-memory-os/releases/tag/v0.1.1
[0.1.0]: https://github.com/ZhenRobotics/openclaw-memory-os/releases/tag/v0.1.0
