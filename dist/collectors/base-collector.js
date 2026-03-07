"use strict";
/**
 * Base Collector Class
 *
 * 所有采集器的基类
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseCollector = void 0;
const events_1 = require("events");
class BaseCollector extends events_1.EventEmitter {
    constructor(name, type) {
        super();
        this.name = name;
        this.type = type;
    }
    /**
     * 获取采集器信息
     */
    info() {
        return {
            name: this.name,
            type: this.type,
        };
    }
    /**
     * 创建记忆对象
     */
    createMemory(content, metadata) {
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
    emitProgress(current, total) {
        this.emit('progress', { current, total, percentage: (current / total) * 100 });
    }
    /**
     * 发送错误事件
     */
    emitError(error, context) {
        this.emit('error', { error, context });
    }
    /**
     * 发送完成事件
     */
    emitComplete(result) {
        this.emit('complete', result);
    }
}
exports.BaseCollector = BaseCollector;
//# sourceMappingURL=base-collector.js.map