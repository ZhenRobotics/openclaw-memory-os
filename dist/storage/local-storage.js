"use strict";
/**
 * Local File System Storage
 *
 * 基于本地文件系统的存储实现
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
exports.LocalStorage = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
class LocalStorage {
    constructor(config) {
        this.memoryCache = new Map();
        this.basePath = this.expandPath(config.path);
        this.indexPath = path.join(this.basePath, 'index.json');
    }
    async init() {
        // Create directories
        await fs.mkdir(this.basePath, { recursive: true });
        await fs.mkdir(path.join(this.basePath, 'memories'), { recursive: true });
        await fs.mkdir(path.join(this.basePath, 'indexes'), { recursive: true });
        // Load index
        await this.loadIndex();
        console.log(`LocalStorage initialized at: ${this.basePath}`);
    }
    async save(memory) {
        const memoryPath = this.getMemoryPath(memory.id);
        // Save memory file
        await fs.writeFile(memoryPath, JSON.stringify(memory, null, 2), 'utf-8');
        // Update cache
        this.memoryCache.set(memory.id, memory);
        // Update index
        await this.updateIndex(memory);
    }
    async get(id) {
        // Check cache first
        if (this.memoryCache.has(id)) {
            return this.memoryCache.get(id);
        }
        // Load from disk
        const memoryPath = this.getMemoryPath(id);
        try {
            const content = await fs.readFile(memoryPath, 'utf-8');
            const memory = JSON.parse(content);
            // Cache it
            this.memoryCache.set(id, memory);
            return memory;
        }
        catch (error) {
            return null;
        }
    }
    async delete(id) {
        const memoryPath = this.getMemoryPath(id);
        try {
            await fs.unlink(memoryPath);
            this.memoryCache.delete(id);
            await this.removeFromIndex(id);
        }
        catch (error) {
            // Ignore if file doesn't exist
        }
    }
    async list(options) {
        const limit = options?.limit || 100;
        const offset = options?.offset || 0;
        const memories = [];
        let count = 0;
        for (const [id, memory] of this.memoryCache) {
            if (count >= offset && memories.length < limit) {
                memories.push(memory);
            }
            count++;
        }
        return memories;
    }
    async count() {
        return this.memoryCache.size;
    }
    async clear() {
        const memoriesDir = path.join(this.basePath, 'memories');
        try {
            const files = await fs.readdir(memoriesDir);
            for (const file of files) {
                await fs.unlink(path.join(memoriesDir, file));
            }
            this.memoryCache.clear();
            await this.saveIndex();
        }
        catch (error) {
            console.error('Error clearing storage:', error);
        }
    }
    async close() {
        // Save index one last time (before clearing cache)
        await this.saveIndex();
        console.log('LocalStorage closed');
    }
    // ============================================================================
    // Private Methods
    // ============================================================================
    getMemoryPath(id) {
        return path.join(this.basePath, 'memories', `${id}.json`);
    }
    async loadIndex() {
        try {
            const content = await fs.readFile(this.indexPath, 'utf-8');
            const index = JSON.parse(content);
            // Load all memories into cache
            for (const id of index.memories || []) {
                const memory = await this.get(id);
                if (memory) {
                    this.memoryCache.set(id, memory);
                }
            }
            console.log(`Loaded ${this.memoryCache.size} memories from index`);
        }
        catch (error) {
            // Index doesn't exist yet, create empty one
            await this.saveIndex();
        }
    }
    async saveIndex() {
        const index = {
            version: '1.0',
            lastUpdate: new Date().toISOString(),
            memories: Array.from(this.memoryCache.keys()),
        };
        await fs.writeFile(this.indexPath, JSON.stringify(index, null, 2), 'utf-8');
    }
    async updateIndex(memory) {
        // Save index immediately to ensure persistence
        await this.saveIndex();
    }
    async removeFromIndex(id) {
        this.memoryCache.delete(id);
        await this.saveIndex();
    }
    expandPath(p) {
        if (p.startsWith('~/')) {
            return path.join(process.env.HOME || process.env.USERPROFILE || '', p.slice(2));
        }
        return path.resolve(p);
    }
}
exports.LocalStorage = LocalStorage;
//# sourceMappingURL=local-storage.js.map