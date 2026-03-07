/**
 * File Collector
 *
 * 从文件系统采集记忆
 */
import { BaseCollector } from './base-collector';
import { CollectResult } from '../core/types';
export declare class FileCollector extends BaseCollector {
    private readonly supportedExtensions;
    constructor();
    collect(source: string, options?: {
        recursive?: boolean;
        exclude?: string[];
    }): Promise<CollectResult>;
    validate(source: string): Promise<boolean>;
    private scanDirectory;
    private collectFile;
}
//# sourceMappingURL=file-collector.d.ts.map