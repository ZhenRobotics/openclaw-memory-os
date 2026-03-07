"use strict";
/**
 * Memory-OS Main Export
 *
 * 主导出文件
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileCollector = exports.BaseCollector = exports.LocalStorage = exports.MemoryOS = void 0;
// Core exports
var memory_os_1 = require("./core/memory-os");
Object.defineProperty(exports, "MemoryOS", { enumerable: true, get: function () { return memory_os_1.MemoryOS; } });
__exportStar(require("./core/types"), exports);
// Storage exports
var local_storage_1 = require("./storage/local-storage");
Object.defineProperty(exports, "LocalStorage", { enumerable: true, get: function () { return local_storage_1.LocalStorage; } });
// Collector exports
var base_collector_1 = require("./collectors/base-collector");
Object.defineProperty(exports, "BaseCollector", { enumerable: true, get: function () { return base_collector_1.BaseCollector; } });
var file_collector_1 = require("./collectors/file-collector");
Object.defineProperty(exports, "FileCollector", { enumerable: true, get: function () { return file_collector_1.FileCollector; } });
//# sourceMappingURL=index.js.map