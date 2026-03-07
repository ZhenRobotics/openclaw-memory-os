/**
 * Local File System Storage
 *
 * 基于本地文件系统的存储实现
 */
import { Memory, StorageConfig } from '../core/types';
export declare class LocalStorage {
    private basePath;
    private indexPath;
    private memoryCache;
    constructor(config: StorageConfig);
    init(): Promise<void>;
    save(memory: Memory): Promise<void>;
    get(id: string): Promise<Memory | null>;
    delete(id: string): Promise<void>;
    list(options?: {
        limit?: number;
        offset?: number;
    }): Promise<Memory[]>;
    count(): Promise<number>;
    clear(): Promise<void>;
    close(): Promise<void>;
    private getMemoryPath;
    private loadIndex;
    private saveIndex;
    private updateIndex;
    private removeFromIndex;
    private expandPath;
}
//# sourceMappingURL=local-storage.d.ts.map