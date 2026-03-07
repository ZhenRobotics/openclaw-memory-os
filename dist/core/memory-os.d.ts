/**
 * Memory-OS Core Class
 *
 * 主核心类，提供完整的记忆管理功能
 */
import { EventEmitter } from 'events';
import { Memory, MemoryType, MemoryOSConfig, SearchQuery, SearchResult, TimelineQuery, TimelineResult, GraphQuery, GraphNode, CollectResult, StorageStats } from './types';
export declare class MemoryOS extends EventEmitter {
    private config;
    private storage;
    private collectors;
    private processors;
    private initialized;
    constructor(config: Partial<MemoryOSConfig>);
    init(): Promise<void>;
    private initStorage;
    private initCollectors;
    private initProcessors;
    collect(options: {
        type: MemoryType;
        content: any;
        metadata?: Partial<Memory['metadata']>;
    }): Promise<Memory>;
    collectBatch(memories: Array<{
        type: MemoryType;
        content: any;
        metadata?: Partial<Memory['metadata']>;
    }>): Promise<CollectResult>;
    private processMemory;
    search(query: SearchQuery): Promise<SearchResult[]>;
    searchSemantic(query: string, options?: {
        type?: MemoryType;
        limit?: number;
    }): Promise<SearchResult[]>;
    get(id: string): Promise<Memory | null>;
    getMany(ids: string[]): Promise<Memory[]>;
    timeline(query: TimelineQuery): Promise<TimelineResult>;
    graph(query: GraphQuery): Promise<GraphNode>;
    update(id: string, updates: Partial<Memory>): Promise<Memory>;
    delete(id: string): Promise<void>;
    stats(): Promise<StorageStats>;
    rebuild(): Promise<void>;
    optimize(): Promise<void>;
    export(path: string): Promise<void>;
    import(path: string): Promise<void>;
    registerCollector(name: string, collector: any): void;
    getCollector(name: string): any;
    registerProcessor(name: string, processor: any): void;
    getProcessor(name: string): any;
    private ensureInitialized;
    private mergeConfig;
    close(): Promise<void>;
}
//# sourceMappingURL=memory-os.d.ts.map