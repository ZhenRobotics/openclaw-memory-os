/**
 * Memory Extractor - 对话记忆自动提取模块
 *
 * 从对话文本中提取需要记住的信息，识别触发词和关键实体
 */

import { Memory, MemoryType } from '../core/types';

/**
 * 提取结果接口
 */
export interface ExtractionResult {
  shouldRemember: boolean;
  memoryType: MemoryType;
  content: string;
  extractedEntities: {
    names?: string[];
    dates?: string[];
    events?: string[];
    facts?: string[];
  };
  metadata: {
    trigger: string;
    language: 'zh' | 'en';
    confidence: number;
  };
}

/**
 * 触发词配置
 */
const TRIGGERS = {
  zh: {
    remember: ['记住', '保存', '记录', '存储', '帮我记住', '记下来'],
    recall: ['回忆', '想起', '找回', '查找', '搜索'],
  },
  en: {
    remember: ['remember', 'save', 'store', 'keep', 'note', 'record'],
    recall: ['recall', 'retrieve', 'find', 'search', 'look up'],
  },
};

/**
 * 实体提取正则
 */
const PATTERNS = {
  // 中文姓名: 2-4个中文字符
  chineseName: /(?:我的?名字(?:是|叫)|我是|姓名[:：]?)\s*([一-龥]{2,4})/g,
  // 英文姓名: Name is/called
  englishName: /(?:my name is|i am|called)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
  // 日期: YYYY-MM-DD, YYYY/MM/DD, MM-DD等
  date: /\d{4}[-/年]\d{1,2}[-/月]\d{1,2}日?|\d{1,2}[-/月]\d{1,2}日?/g,
  // 事件标记词
  event: /(?:会议|活动|任务|项目|计划|目标)[:：]?\s*(.+?)(?:[。，,\n]|$)/g,
};

/**
 * 对话记忆提取器
 */
export class MemoryExtractor {
  /**
   * 从对话文本中提取记忆
   */
  extract(text: string): ExtractionResult {
    const language = this.detectLanguage(text);
    const trigger = this.detectTrigger(text, language);

    if (!trigger) {
      return {
        shouldRemember: false,
        memoryType: MemoryType.TEXT,
        content: '',
        extractedEntities: {},
        metadata: {
          trigger: '',
          language,
          confidence: 0,
        },
      };
    }

    // 清理触发词，提取实际内容
    const content = this.cleanContent(text, trigger, language);

    // 提取实体
    const entities = this.extractEntities(content, language);

    // 确定记忆类型
    const memoryType = this.determineMemoryType(content, entities);

    return {
      shouldRemember: true,
      memoryType,
      content,
      extractedEntities: entities,
      metadata: {
        trigger,
        language,
        confidence: this.calculateConfidence(entities),
      },
    };
  }

  /**
   * 检测语言
   */
  private detectLanguage(text: string): 'zh' | 'en' {
    const zhChars = text.match(/[\u4e00-\u9fa5]/g);
    const zhRatio = zhChars ? zhChars.length / text.length : 0;
    return zhRatio > 0.3 ? 'zh' : 'en';
  }

  /**
   * 检测触发词
   */
  private detectTrigger(text: string, language: 'zh' | 'en'): string {
    const lowerText = text.toLowerCase();
    const triggers = TRIGGERS[language];

    for (const trigger of triggers.remember) {
      if (lowerText.includes(trigger.toLowerCase())) {
        return trigger;
      }
    }

    return '';
  }

  /**
   * 清理内容，移除触发词
   */
  private cleanContent(text: string, trigger: string, language: 'zh' | 'en'): string {
    let content = text;

    // 移除触发词及其常见前缀
    const prefixes = language === 'zh'
      ? ['帮我', '请', '麻烦', '能不能', '可以']
      : ['please', 'could you', 'can you', 'would you'];

    for (const prefix of prefixes) {
      const pattern = new RegExp(`${prefix}\\s*${trigger}\\s*[：:]?`, 'gi');
      content = content.replace(pattern, '');
    }

    // 直接移除触发词
    content = content.replace(new RegExp(trigger, 'gi'), '');

    // 清理标点
    content = content.replace(/^[：:，,、\s]+/, '').trim();

    return content;
  }

  /**
   * 提取实体
   */
  private extractEntities(content: string, language: 'zh' | 'en'): ExtractionResult['extractedEntities'] {
    const entities: ExtractionResult['extractedEntities'] = {};

    // 提取姓名
    if (language === 'zh') {
      const nameMatches = Array.from(content.matchAll(PATTERNS.chineseName));
      if (nameMatches.length > 0) {
        entities.names = nameMatches.map(m => m[1]);
      }
    } else {
      const nameMatches = Array.from(content.matchAll(PATTERNS.englishName));
      if (nameMatches.length > 0) {
        entities.names = nameMatches.map(m => m[1]);
      }
    }

    // 提取日期
    const dateMatches = Array.from(content.matchAll(PATTERNS.date));
    if (dateMatches.length > 0) {
      entities.dates = dateMatches.map(m => m[0]);
    }

    // 提取事件
    const eventMatches = Array.from(content.matchAll(PATTERNS.event));
    if (eventMatches.length > 0) {
      entities.events = eventMatches.map(m => m[1].trim());
    }

    // 如果没有特定实体，整个内容作为事实
    if (!entities.names && !entities.dates && !entities.events) {
      entities.facts = [content];
    }

    return entities;
  }

  /**
   * 确定记忆类型
   */
  private determineMemoryType(content: string, entities: ExtractionResult['extractedEntities']): MemoryType {
    // 如果包含代码特征
    const codeSymbols = content.match(/[{}()[\];]/g);
    if (content.includes('function') || content.includes('class') ||
        content.includes('def ') || content.includes('const ') ||
        (codeSymbols && codeSymbols.length > 3)) {
      return MemoryType.CODE;
    }

    // 如果是对话记录
    if (content.includes(':') && content.split('\n').length > 2) {
      return MemoryType.CHAT;
    }

    // 默认为文本
    return MemoryType.TEXT;
  }

  /**
   * 计算提取置信度
   */
  private calculateConfidence(entities: ExtractionResult['extractedEntities']): number {
    let score = 0.5; // 基础分

    if (entities.names && entities.names.length > 0) score += 0.3;
    if (entities.dates && entities.dates.length > 0) score += 0.1;
    if (entities.events && entities.events.length > 0) score += 0.1;

    return Math.min(score, 1.0);
  }

  /**
   * 格式化为友好的确认消息
   */
  formatConfirmation(result: ExtractionResult): string {
    const { extractedEntities, metadata } = result;
    const lang = metadata.language;

    const parts: string[] = [];

    if (lang === 'zh') {
      parts.push('已记住');

      if (extractedEntities.names) {
        parts.push(`姓名: ${extractedEntities.names.join(', ')}`);
      }
      if (extractedEntities.dates) {
        parts.push(`日期: ${extractedEntities.dates.join(', ')}`);
      }
      if (extractedEntities.events) {
        parts.push(`事件: ${extractedEntities.events.join(', ')}`);
      }
      if (extractedEntities.facts) {
        parts.push(`内容: ${extractedEntities.facts[0].substring(0, 50)}${extractedEntities.facts[0].length > 50 ? '...' : ''}`);
      }
    } else {
      parts.push('Remembered');

      if (extractedEntities.names) {
        parts.push(`Name: ${extractedEntities.names.join(', ')}`);
      }
      if (extractedEntities.dates) {
        parts.push(`Date: ${extractedEntities.dates.join(', ')}`);
      }
      if (extractedEntities.events) {
        parts.push(`Event: ${extractedEntities.events.join(', ')}`);
      }
      if (extractedEntities.facts) {
        parts.push(`Content: ${extractedEntities.facts[0].substring(0, 50)}${extractedEntities.facts[0].length > 50 ? '...' : ''}`);
      }
    }

    return parts.join('\n');
  }
}
