/**
 * Base Collector Class
 *
 * 所有采集器的基类
 */
import { Memory, MemoryType, CollectResult } from '../core/types';
import { EventEmitter } from 'events';
export declare abstract class BaseCollector extends EventEmitter {
    protected type: MemoryType;
    protected name: string;
    constructor(name: string, type: MemoryType);
    /**
     * 采集记忆
     */
    abstract collect(source: string, options?: any): Promise<CollectResult>;
    /**
     * 验证源是否有效
     */
    abstract validate(source: string): Promise<boolean>;
    /**
     * 获取采集器信息
     */
    info(): {
        name: string;
        type: MemoryType;
    };
    /**
     * 创建记忆对象
     */
    protected createMemory(content: any, metadata: Partial<Memory['metadata']>): Partial<Memory>;
    /**
     * 发送进度事件
     */
    protected emitProgress(current: number, total: number): void;
    /**
     * 发送错误事件
     */
    protected emitError(error: Error, context?: any): void;
    /**
     * 发送完成事件
     */
    protected emitComplete(result: CollectResult): void;
}
//# sourceMappingURL=base-collector.d.ts.map