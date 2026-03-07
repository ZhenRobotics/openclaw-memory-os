/**
 * File Collector
 *
 * 从文件系统采集记忆
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import { BaseCollector } from './base-collector';
import { MemoryType } from '../core/types';
export class FileCollector extends BaseCollector {
    supportedExtensions = [
        '.txt', '.md', '.json', '.js', '.ts',
        '.py', '.java', '.cpp', '.c', '.h',
    ];
    constructor() {
        super('file-collector', MemoryType.FILE);
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
        return this.createMemory({
            filename,
            path: filePath,
            content,
            size: stat.size,
        }, {
            source: filePath,
            timestamp: stat.mtime,
            tags: [ext.slice(1), 'file'],
            context: path.dirname(filePath),
        });
    }
}
