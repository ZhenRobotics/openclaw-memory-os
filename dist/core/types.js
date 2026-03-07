"use strict";
/**
 * Memory-OS Core Types
 *
 * 核心类型定义
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
exports.MemoryEvent = exports.LLMProvider = exports.EmbeddingProvider = exports.StorageBackend = exports.FilterOperator = exports.RelationType = exports.MemoryType = void 0;
// ============================================================================
// Memory Types
// ============================================================================
var MemoryType;
(function (MemoryType) {
    MemoryType["TEXT"] = "text";
    MemoryType["CODE"] = "code";
    MemoryType["CHAT"] = "chat";
    MemoryType["FILE"] = "file";
    MemoryType["MEDIA"] = "media";
    MemoryType["ACTIVITY"] = "activity";
})(MemoryType || (exports.MemoryType = MemoryType = {}));
var RelationType;
(function (RelationType) {
    RelationType["REFERENCES"] = "references";
    RelationType["RELATED_TO"] = "related_to";
    RelationType["DERIVED_FROM"] = "derived_from";
    RelationType["RESPONDS_TO"] = "responds_to";
    RelationType["PART_OF"] = "part_of";
    RelationType["FOLLOWS"] = "follows";
})(RelationType || (exports.RelationType = RelationType = {}));
var FilterOperator;
(function (FilterOperator) {
    FilterOperator["EQUALS"] = "equals";
    FilterOperator["CONTAINS"] = "contains";
    FilterOperator["GT"] = "gt";
    FilterOperator["LT"] = "lt";
    FilterOperator["IN"] = "in";
})(FilterOperator || (exports.FilterOperator = FilterOperator = {}));
var StorageBackend;
(function (StorageBackend) {
    StorageBackend["LOCAL"] = "local";
    StorageBackend["SQLITE"] = "sqlite";
    StorageBackend["POSTGRES"] = "postgres";
    StorageBackend["MONGODB"] = "mongodb";
})(StorageBackend || (exports.StorageBackend = StorageBackend = {}));
var EmbeddingProvider;
(function (EmbeddingProvider) {
    EmbeddingProvider["OPENAI"] = "openai";
    EmbeddingProvider["COHERE"] = "cohere";
    EmbeddingProvider["LOCAL"] = "local";
    EmbeddingProvider["HUGGINGFACE"] = "huggingface";
})(EmbeddingProvider || (exports.EmbeddingProvider = EmbeddingProvider = {}));
var LLMProvider;
(function (LLMProvider) {
    LLMProvider["OPENAI"] = "openai";
    LLMProvider["ANTHROPIC"] = "anthropic";
    LLMProvider["LOCAL"] = "local";
})(LLMProvider || (exports.LLMProvider = LLMProvider = {}));
// ============================================================================
// Event Types
// ============================================================================
var MemoryEvent;
(function (MemoryEvent) {
    MemoryEvent["COLLECTED"] = "collected";
    MemoryEvent["UPDATED"] = "updated";
    MemoryEvent["DELETED"] = "deleted";
    MemoryEvent["QUERIED"] = "queried";
})(MemoryEvent || (exports.MemoryEvent = MemoryEvent = {}));
// ============================================================================
// Export All
// ============================================================================
__exportStar(require("./types"), exports);
//# sourceMappingURL=types.js.map