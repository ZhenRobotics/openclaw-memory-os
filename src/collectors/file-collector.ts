/**
 * File Collector
 *
 * 从文件系统采集记忆
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { BaseCollector } from './base-collector';
import { CollectResult, MemoryType, Memory } from '../core/types';

export class FileCollector extends BaseCollector {
  private readonly supportedExtensions = [
    '.txt', '.md', '.json', '.js', '.ts',
    '.py', '.java', '.cpp', '.c', '.h',
  ];

  constructor() {
    super('file-collector', MemoryType.FILE);
  }

  async collect(source: string, options?: {
    recursive?: boolean;
    exclude?: string[];
  }): Promise<CollectResult> {
    const memories: any[] = [];
    const errors: Error[] = [];
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
        } catch (error) {
          errors.push(error as Error);
          this.emitError(error as Error, { file: files[i] });
        }

        this.emitProgress(i + 1, files.length);
      }

      const result: CollectResult = {
        collected: memories.length,
        failed: errors.length,
        memories,
        errors: errors.length > 0 ? errors : undefined,
      };

      this.emitComplete(result);
      return result;

    } catch (error) {
      const result: CollectResult = {
        collected: 0,
        failed: 1,
        memories: [],
        errors: [error as Error],
      };
      return result;
    }
  }

  async validate(source: string): Promise<boolean> {
    try {
      const stat = await fs.stat(source);
      return stat.isDirectory() || stat.isFile();
    } catch {
      return false;
    }
  }

  private async scanDirectory(
    dir: string,
    options: { recursive: boolean; exclude: string[] }
  ): Promise<string[]> {
    const files: string[] = [];

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
      } else if (item.isFile()) {
        const ext = path.extname(item.name);
        if (this.supportedExtensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }

    return files;
  }

  private async collectFile(filePath: string): Promise<Partial<Memory>> {
    const stat = await fs.stat(filePath);
    const content = await fs.readFile(filePath, 'utf-8');

    const ext = path.extname(filePath);
    const filename = path.basename(filePath);

    // Determine memory type based on file extension
    const codeExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c'];
    const memoryType = codeExtensions.includes(ext) ? MemoryType.CODE : MemoryType.TEXT;

    // Return Memory object directly with correct structure
    return {
      type: memoryType,
      content: content,  // Content as direct string
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
