"use strict";
/**
 * File Collector
 *
 * 从文件系统采集记忆
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileCollector = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const base_collector_1 = require("./base-collector");
const types_1 = require("../core/types");
class FileCollector extends base_collector_1.BaseCollector {
    constructor() {
        super('file-collector', types_1.MemoryType.FILE);
        this.supportedExtensions = [
            '.txt', '.md', '.json', '.js', '.ts',
            '.py', '.java', '.cpp', '.c', '.h',
        ];
    }
    async collect(source, options) {
        const memories = [];
        const errors = [];
        const exclude = options?.exclude || ['node_modules', '.git', 'dist', 'build'];
        try {
            const files = await this.scanDirectory(source, {
                recursive: options?.recursive ?? true,
                exclude,
            });
            this.emitProgress(0, files.length);
            for (let i = 0; i < files.length; i++) {
                try {
                    const memory = await this.collectFile(files[i]);
                    if (memory) {
                        memories.push(memory);
                    }
                }
                catch (error) {
                    errors.push(error);
                    this.emitError(error, { file: files[i] });
                }
                this.emitProgress(i + 1, files.length);
            }
            const result = {
                collected: memories.length,
                failed: errors.length,
                memories,
                errors: errors.length > 0 ? errors : undefined,
            };
            this.emitComplete(result);
            return result;
        }
        catch (error) {
            const result = {
                collected: 0,
                failed: 1,
                memories: [],
                errors: [error],
            };
            return result;
        }
    }
    async validate(source) {
        try {
            const stat = await fs.stat(source);
            return stat.isDirectory() || stat.isFile();
        }
        catch {
            return false;
        }
    }
    async scanDirectory(dir, options) {
        const files = [];
        const items = await fs.readdir(dir, { withFileTypes: true });
        for (const item of items) {
            const fullPath = path.join(dir, item.name);
            // Check exclusions
            if (options.exclude.some(ex => item.name.includes(ex))) {
                continue;
            }
            if (item.isDirectory() && options.recursive) {
                const subFiles = await this.scanDirectory(fullPath, options);
                files.push(...subFiles);
            }
            else if (item.isFile()) {
                const ext = path.extname(item.name);
                if (this.supportedExtensions.includes(ext)) {
                    files.push(fullPath);
                }
            }
        }
        return files;
    }
    async collectFile(filePath) {
        const stat = await fs.stat(filePath);
        const content = await fs.readFile(filePath, 'utf-8');
        const ext = path.extname(filePath);
        const filename = path.basename(filePath);
        // Determine memory type based on file extension
        const codeExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c'];
        const memoryType = codeExtensions.includes(ext) ? types_1.MemoryType.CODE : types_1.MemoryType.TEXT;
        // Return Memory object directly with correct structure
        return {
            type: memoryType,
            content: content, // Content as direct string
            metadata: {
                source: 'file-collector',
                timestamp: stat.mtime,
                tags: [ext.slice(1), 'imported'],
                context: path.dirname(filePath),
                filename,
                filePath,
                fileSize: stat.size,
            },
        };
    }
}
exports.FileCollector = FileCollector;
//# sourceMappingURL=file-collector.js.map