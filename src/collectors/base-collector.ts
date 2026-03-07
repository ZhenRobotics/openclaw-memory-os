/**
 * Base Collector Class
 *
 * 所有采集器的基类
 */

import { Memory, MemoryType, CollectResult } from '../core/types';
import { EventEmitter } from 'events';

export abstract class BaseCollector extends EventEmitter {
  protected type: MemoryType;
  protected name: string;

  constructor(name: string, type: MemoryType) {
    super();
    this.name = name;
    this.type = type;
  }

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
  info(): { name: string; type: MemoryType } {
    return {
      name: this.name,
      type: this.type,
    };
  }

  /**
   * 创建记忆对象
   */
  protected createMemory(content: any, metadata: Partial<Memory['metadata']>): Partial<Memory> {
    return {
      type: this.type,
      content,
      metadata: {
        source: metadata.source || this.name,
        timestamp: metadata.timestamp || new Date(),
        tags: metadata.tags || [],
        context: metadata.context,
        ...metadata,
      },
    };
  }

  /**
   * 发送进度事件
   */
  protected emitProgress(current: number, total: number): void {
    this.emit('progress', { current, total, percentage: (current / total) * 100 });
  }

  /**
   * 发送错误事件
   */
  protected emitError(error: Error, context?: any): void {
    this.emit('error', { error, context });
  }

  /**
   * 发送完成事件
   */
  protected emitComplete(result: CollectResult): void {
    this.emit('complete', result);
  }
}
