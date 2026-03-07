/**
 * Memory-OS Core Types
 *
 * 核心类型定义
 */
// ============================================================================
// Memory Types
// ============================================================================
export var MemoryType;
(function (MemoryType) {
    MemoryType["TEXT"] = "text";
    MemoryType["CODE"] = "code";
    MemoryType["CHAT"] = "chat";
    MemoryType["FILE"] = "file";
    MemoryType["MEDIA"] = "media";
    MemoryType["ACTIVITY"] = "activity";
})(MemoryType || (MemoryType = {}));
export var RelationType;
(function (RelationType) {
    RelationType["REFERENCES"] = "references";
    RelationType["RELATED_TO"] = "related_to";
    RelationType["DERIVED_FROM"] = "derived_from";
    RelationType["RESPONDS_TO"] = "responds_to";
    RelationType["PART_OF"] = "part_of";
    RelationType["FOLLOWS"] = "follows";
})(RelationType || (RelationType = {}));
export var FilterOperator;
(function (FilterOperator) {
    FilterOperator["EQUALS"] = "equals";
    FilterOperator["CONTAINS"] = "contains";
    FilterOperator["GT"] = "gt";
    FilterOperator["LT"] = "lt";
    FilterOperator["IN"] = "in";
})(FilterOperator || (FilterOperator = {}));
export var StorageBackend;
(function (StorageBackend) {
    StorageBackend["LOCAL"] = "local";
    StorageBackend["SQLITE"] = "sqlite";
    StorageBackend["POSTGRES"] = "postgres";
    StorageBackend["MONGODB"] = "mongodb";
})(StorageBackend || (StorageBackend = {}));
export var EmbeddingProvider;
(function (EmbeddingProvider) {
    EmbeddingProvider["OPENAI"] = "openai";
    EmbeddingProvider["COHERE"] = "cohere";
    EmbeddingProvider["LOCAL"] = "local";
    EmbeddingProvider["HUGGINGFACE"] = "huggingface";
})(EmbeddingProvider || (EmbeddingProvider = {}));
export var LLMProvider;
(function (LLMProvider) {
    LLMProvider["OPENAI"] = "openai";
    LLMProvider["ANTHROPIC"] = "anthropic";
    LLMProvider["LOCAL"] = "local";
})(LLMProvider || (LLMProvider = {}));
// ============================================================================
// Event Types
// ============================================================================
export var MemoryEvent;
(function (MemoryEvent) {
    MemoryEvent["COLLECTED"] = "collected";
    MemoryEvent["UPDATED"] = "updated";
    MemoryEvent["DELETED"] = "deleted";
    MemoryEvent["QUERIED"] = "queried";
})(MemoryEvent || (MemoryEvent = {}));
// ============================================================================
// Export All
// ============================================================================
export * from './types';
