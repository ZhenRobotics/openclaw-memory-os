"use strict";
/**
 * Memory-OS Core Class
 *
 * 主核心类，提供完整的记忆管理功能
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
exports.MemoryOS = void 0;
const events_1 = require("events");
const uuid_1 = require("uuid");
const types_1 = require("./types");
class MemoryOS extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.collectors = new Map();
        this.processors = new Map();
        this.initialized = false;
        this.config = this.mergeConfig(config);
    }
    // ============================================================================
    // Initialization
    // ============================================================================
    async init() {
        if (this.initialized) {
            throw new Error('Memory-OS already initialized');
        }
        console.log('Initializing Memory-OS...');
        // Initialize storage
        await this.initStorage();
        // Initialize collectors
        await this.initCollectors();
        // Initialize processors
        await this.initProcessors();
        this.initialized = true;
        console.log('Memory-OS initialized successfully');
    }
    async initStorage() {
        const { LocalStorage } = await Promise.resolve().then(() => __importStar(require('../storage/local-storage')));
        this.storage = new LocalStorage(this.config.storage);
        await this.storage.init();
        console.log('Storage initialized');
    }
    async initCollectors() {
        // TODO: Initialize collectors based on config
        console.log('Collectors initialized');
    }
    async initProcessors() {
        // TODO: Initialize processors
        console.log('Processors initialized');
    }
    // ============================================================================
    // Memory Collection
    // ============================================================================
    async collect(options) {
        this.ensureInitialized();
        const memory = {
            id: (0, uuid_1.v4)(),
            type: options.type,
            content: options.content,
            metadata: {
                source: options.metadata?.source || 'manual',
                timestamp: new Date(),
                tags: options.metadata?.tags || [],
                context: options.metadata?.context,
                ...options.metadata,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        // Process memory (embedding, extraction, etc.)
        await this.processMemory(memory);
        // Store memory
        await this.storage?.save(memory);
        // Emit event
        this.emit(types_1.MemoryEvent.COLLECTED, { event: types_1.MemoryEvent.COLLECTED, memory, timestamp: new Date() });
        return memory;
    }
    async collectBatch(memories) {
        this.ensureInitialized();
        const results = [];
        const errors = [];
        for (const item of memories) {
            try {
                const memory = await this.collect(item);
                results.push(memory);
            }
            catch (error) {
                errors.push(error);
            }
        }
        return {
            collected: results.length,
            failed: errors.length,
            memories: results,
            errors: errors.length > 0 ? errors : undefined,
        };
    }
    async processMemory(memory) {
        // TODO: Process memory through processors
        // - Generate embedding
        // - Extract entities
        // - Discover relations
        // - Analyze sentiment/topics
    }
    // ============================================================================
    // Search & Retrieval
    // ============================================================================
    async search(query) {
        this.ensureInitialized();
        // Get all memories
        const allMemories = await this.storage.list();
        // Filter memories based on query
        const filtered = allMemories.filter((memory) => {
            // Type filter
            if (query.type && memory.type !== query.type) {
                return false;
            }
            // Keyword search - search in content
            if (query.query) {
                const contentStr = typeof memory.content === 'string'
                    ? memory.content
                    : JSON.stringify(memory.content);
                if (!contentStr.toLowerCase().includes(query.query.toLowerCase())) {
                    return false;
                }
            }
            // Tag filter (if SearchQuery had tags support)
            const queryAny = query;
            if (queryAny.tags && queryAny.tags.length > 0) {
                const hasMatchingTag = queryAny.tags.some((tag) => memory.metadata.tags?.includes(tag));
                if (!hasMatchingTag) {
                    return false;
                }
            }
            return true;
        });
        // Apply limit and offset
        const limit = query.limit || 10;
        const offset = query.offset || 0;
        const paginated = filtered.slice(offset, offset + limit);
        // Convert to SearchResult format
        return paginated.map((memory) => ({
            memory,
            score: 1.0, // Simple implementation - all matches get full score
            highlights: []
        }));
    }
    async searchSemantic(query, options) {
        return this.search({
            query,
            semantic: true,
            type: options?.type,
            limit: options?.limit || 10,
        });
    }
    async get(id) {
        this.ensureInitialized();
        return await this.storage?.get(id);
    }
    async getMany(ids) {
        this.ensureInitialized();
        const memories = [];
        for (const id of ids) {
            const memory = await this.get(id);
            if (memory) {
                memories.push(memory);
            }
        }
        return memories;
    }
    // ============================================================================
    // Timeline
    // ============================================================================
    async timeline(query) {
        this.ensureInitialized();
        // TODO: Implement timeline query
        // - Query by date/range
        // - Filter by type
        // - Group by time periods
        return {
            date: query.date || new Date(),
            memories: [],
            stats: {
                total: 0,
                byType: {},
            },
        };
    }
    // ============================================================================
    // Graph
    // ============================================================================
    async graph(query) {
        this.ensureInitialized();
        // TODO: Implement graph traversal
        // - Start from a memory
        // - Traverse relations
        // - Build subgraph
        const memory = await this.get(query.memoryId);
        if (!memory) {
            throw new Error(`Memory not found: ${query.memoryId}`);
        }
        return {
            memory,
            relations: [],
        };
    }
    // ============================================================================
    // Update & Delete
    // ============================================================================
    async update(id, updates) {
        this.ensureInitialized();
        const memory = await this.get(id);
        if (!memory) {
            throw new Error(`Memory not found: ${id}`);
        }
        const updated = {
            ...memory,
            ...updates,
            updatedAt: new Date(),
        };
        await this.storage?.save(updated);
        this.emit(types_1.MemoryEvent.UPDATED, { event: types_1.MemoryEvent.UPDATED, memory: updated, timestamp: new Date() });
        return updated;
    }
    async delete(id) {
        this.ensureInitialized();
        await this.storage?.delete(id);
        this.emit(types_1.MemoryEvent.DELETED, { event: types_1.MemoryEvent.DELETED, timestamp: new Date() });
    }
    // ============================================================================
    // Statistics
    // ============================================================================
    async stats() {
        this.ensureInitialized();
        const allMemories = await this.storage.list();
        // Count by type
        const byType = {};
        allMemories.forEach((memory) => {
            byType[memory.type] = (byType[memory.type] || 0) + 1;
        });
        // Count by source
        const bySource = {};
        allMemories.forEach((memory) => {
            const source = memory.metadata.source || 'unknown';
            bySource[source] = (bySource[source] || 0) + 1;
        });
        return {
            totalMemories: allMemories.length,
            byType: byType,
            bySource,
            diskUsage: 0, // TODO: Calculate actual disk usage
            lastUpdate: new Date(),
        };
    }
    // ============================================================================
    // Maintenance
    // ============================================================================
    async rebuild() {
        this.ensureInitialized();
        console.log('Rebuilding indexes...');
        // TODO: Rebuild all indexes
    }
    async optimize() {
        this.ensureInitialized();
        console.log('Optimizing storage...');
        // TODO: Optimize storage
    }
    async export(path) {
        this.ensureInitialized();
        console.log(`Exporting to ${path}...`);
        // TODO: Export all data
    }
    async import(path) {
        this.ensureInitialized();
        console.log(`Importing from ${path}...`);
        // TODO: Import data
    }
    // ============================================================================
    // Collectors
    // ============================================================================
    registerCollector(name, collector) {
        this.collectors.set(name, collector);
    }
    getCollector(name) {
        return this.collectors.get(name);
    }
    // ============================================================================
    // Processors
    // ============================================================================
    registerProcessor(name, processor) {
        this.processors.set(name, processor);
    }
    getProcessor(name) {
        return this.processors.get(name);
    }
    // ============================================================================
    // Helpers
    // ============================================================================
    ensureInitialized() {
        if (!this.initialized) {
            throw new Error('Memory-OS not initialized. Call init() first.');
        }
    }
    mergeConfig(config) {
        // Support both 'storePath' shorthand and full 'storage' config
        const configAny = config;
        const storagePath = configAny.storePath || config.storage?.path || '~/.memory-os/data';
        return {
            storage: {
                path: storagePath,
                backend: 'local',
                ...config.storage,
            },
            collectors: config.collectors || [],
            privacy: {
                encryption: false,
                shareStats: false,
                anonymize: false,
                ...config.privacy,
            },
            ...config,
        };
    }
    // ============================================================================
    // Cleanup
    // ============================================================================
    async close() {
        if (!this.initialized) {
            return;
        }
        console.log('Closing Memory-OS...');
        // Close storage
        await this.storage?.close?.();
        this.initialized = false;
        console.log('Memory-OS closed');
    }
}
exports.MemoryOS = MemoryOS;
//# sourceMappingURL=memory-os.js.map