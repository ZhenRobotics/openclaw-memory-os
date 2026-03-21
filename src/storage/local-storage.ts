/**
 * Local File System Storage
 *
 * 基于本地文件系统的存储实现
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { Memory, StorageConfig } from '../core/types';

export class LocalStorage {
  private basePath: string;
  private indexPath: string;
  private memoryCache: Map<string, Memory> = new Map();

  constructor(config: StorageConfig) {
    this.basePath = this.expandPath(config.path);
    this.indexPath = path.join(this.basePath, 'index.json');
  }

  async init(): Promise<void> {
    // Create directories
    await fs.mkdir(this.basePath, { recursive: true });
    await fs.mkdir(path.join(this.basePath, 'memories'), { recursive: true });
    await fs.mkdir(path.join(this.basePath, 'indexes'), { recursive: true });

    // Load index
    await this.loadIndex();

    console.log(`LocalStorage initialized at: ${this.basePath}`);
  }

  async save(memory: Memory): Promise<void> {
    const memoryPath = this.getMemoryPath(memory.id);

    // Save memory file
    await fs.writeFile(
      memoryPath,
      JSON.stringify(memory, null, 2),
      'utf-8'
    );

    // Update cache
    this.memoryCache.set(memory.id, memory);

    // Update index
    await this.updateIndex(memory);
  }

  async get(id: string): Promise<Memory | null> {
    // Check cache first
    if (this.memoryCache.has(id)) {
      return this.memoryCache.get(id)!;
    }

    // Load from disk
    const memoryPath = this.getMemoryPath(id);

    try {
      const content = await fs.readFile(memoryPath, 'utf-8');
      const memory = JSON.parse(content) as Memory;

      // Cache it
      this.memoryCache.set(id, memory);

      return memory;
    } catch (error) {
      return null;
    }
  }

  async delete(id: string): Promise<void> {
    const memoryPath = this.getMemoryPath(id);

    try {
      await fs.unlink(memoryPath);
      this.memoryCache.delete(id);
      await this.removeFromIndex(id);
    } catch (error) {
      // Ignore if file doesn't exist
    }
  }

  async list(options?: {
    limit?: number;
    offset?: number;
  }): Promise<Memory[]> {
    const limit = options?.limit || 100;
    const offset = options?.offset || 0;

    const memories: Memory[] = [];
    let count = 0;

    for (const [id, memory] of this.memoryCache) {
      if (count >= offset && memories.length < limit) {
        memories.push(memory);
      }
      count++;
    }

    return memories;
  }

  async count(): Promise<number> {
    return this.memoryCache.size;
  }

  async clear(): Promise<void> {
    const memoriesDir = path.join(this.basePath, 'memories');

    try {
      const files = await fs.readdir(memoriesDir);

      for (const file of files) {
        await fs.unlink(path.join(memoriesDir, file));
      }

      this.memoryCache.clear();
      await this.saveIndex();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }

  async close(): Promise<void> {
    // Save index one last time (before clearing cache)
    await this.saveIndex();

    console.log('LocalStorage closed');
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private getMemoryPath(id: string): string {
    return path.join(this.basePath, 'memories', `${id}.json`);
  }

  private async loadIndex(): Promise<void> {
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
    } catch (error) {
      // Index doesn't exist yet, create empty one
      await this.saveIndex();
    }
  }

  private async saveIndex(): Promise<void> {
    const index = {
      version: '1.0',
      lastUpdate: new Date().toISOString(),
      memories: Array.from(this.memoryCache.keys()),
    };

    await fs.writeFile(
      this.indexPath,
      JSON.stringify(index, null, 2),
      'utf-8'
    );
  }

  private async updateIndex(memory: Memory): Promise<void> {
    // Save index immediately to ensure persistence
    await this.saveIndex();
  }

  private async removeFromIndex(id: string): Promise<void> {
    this.memoryCache.delete(id);
    await this.saveIndex();
  }

  private expandPath(p: string): string {
    if (p.startsWith('~/')) {
      return path.join(process.env.HOME || process.env.USERPROFILE || '', p.slice(2));
    }
    return path.resolve(p);
  }
}
