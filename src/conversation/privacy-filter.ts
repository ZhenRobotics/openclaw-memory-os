/**
 * Privacy Filter
 *
 * Applies privacy rules to conversation content
 * Features: keyword matching, pattern matching, redaction, blocking
 */

import {
  ConversationMessage,
  PrivacyRule
} from './types';

/**
 * Default Privacy Rules
 * Comprehensive set of rules for common sensitive patterns
 */
export const DEFAULT_PRIVACY_RULES: PrivacyRule[] = [
  // Credentials
  {
    type: 'keyword',
    pattern: 'password|passwd|pwd|secret|api[_\\s-]?key|token|bearer|auth|credential',
    action: 'redact',
    description: 'Redact authentication credentials',
    enabled: true
  },

  // Email addresses
  {
    type: 'pattern',
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    action: 'redact',
    description: 'Redact email addresses',
    enabled: true
  },

  // Credit card numbers
  {
    type: 'pattern',
    pattern: /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g,
    action: 'redact',
    description: 'Redact credit card numbers',
    enabled: true
  },

  // IP addresses
  {
    type: 'pattern',
    pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
    action: 'redact',
    description: 'Redact IP addresses',
    enabled: true
  },

  // Social Security Numbers (US format)
  {
    type: 'pattern',
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    action: 'redact',
    description: 'Redact social security numbers',
    enabled: true
  },

  // Phone numbers
  {
    type: 'pattern',
    pattern: /\b(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    action: 'redact',
    description: 'Redact phone numbers',
    enabled: true
  },

  // Private keys
  {
    type: 'pattern',
    pattern: /-----BEGIN (RSA|PRIVATE|PUBLIC|ENCRYPTED) KEY-----/gi,
    action: 'filter',
    description: 'Block messages containing private keys',
    enabled: true
  },

  // System paths (sensitive)
  {
    type: 'pattern',
    pattern: /\/etc\/shadow|\/etc\/passwd|C:\\Windows\\System32/gi,
    action: 'filter',
    description: 'Block messages referencing sensitive system paths',
    enabled: true
  }
];

/**
 * Privacy Filter Result
 */
interface FilterResult {
  content: string;
  modified: boolean;
  action?: 'block';
  reason?: string;
}

/**
 * Privacy Filter
 * Applies privacy rules to conversation content
 */
export class PrivacyFilter {
  private rules: PrivacyRule[];
  private stats: {
    messagesFiltered: number;
    messagesRedacted: number;
    messagesBlocked: number;
    rulesApplied: Map<string, number>;
  };

  constructor(rules: PrivacyRule[] = DEFAULT_PRIVACY_RULES) {
    this.rules = rules.filter(r => r.enabled !== false);

    this.stats = {
      messagesFiltered: 0,
      messagesRedacted: 0,
      messagesBlocked: 0,
      rulesApplied: new Map()
    };
  }

  /**
   * Apply privacy filters to message
   */
  async filterMessage(
    message: ConversationMessage
  ): Promise<ConversationMessage> {
    let content = message.content;
    let filtered = false;
    let redacted = false;

    for (const rule of this.rules) {
      if (!this.isRuleEnabled(rule)) {
        continue;
      }

      const result = await this.applyRule(content, rule);

      if (result.action === 'block') {
        // Block entire message
        this.stats.messagesBlocked++;
        this.incrementRuleCount(rule.description);

        return {
          ...message,
          content: '[BLOCKED BY PRIVACY RULE]',
          metadata: {
            ...message.metadata,
            filtered: true,
            filterReason: rule.description
          }
        };
      }

      if (result.modified) {
        content = result.content;
        filtered = true;

        if (rule.action === 'redact') {
          redacted = true;
        }

        this.incrementRuleCount(rule.description);
      }
    }

    if (filtered) {
      this.stats.messagesFiltered++;

      if (redacted) {
        this.stats.messagesRedacted++;
      }

      return {
        ...message,
        content,
        metadata: {
          ...message.metadata,
          filtered: true
        }
      };
    }

    // No filtering occurred - explicitly set filtered=false for audit trail
    return {
      ...message,
      metadata: {
        ...message.metadata,
        filtered: false
      }
    };
  }

  /**
   * Check if content should be blocked entirely
   */
  shouldBlock(content: string): boolean {
    for (const rule of this.rules) {
      if (!this.isRuleEnabled(rule) || rule.action !== 'filter') {
        continue;
      }

      const pattern = this.getPattern(rule);

      if (pattern.test(content)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Add custom privacy rule
   */
  addRule(rule: PrivacyRule): void {
    // Validate rule
    if (!rule.type || !rule.pattern || !rule.action) {
      throw new Error('Invalid privacy rule: missing required fields');
    }

    // Ensure rule is enabled by default
    if (rule.enabled === undefined) {
      rule.enabled = true;
    }

    this.rules.push(rule);
  }

  /**
   * Remove privacy rule by description
   */
  removeRule(description: string): boolean {
    const index = this.rules.findIndex(r => r.description === description);

    if (index === -1) {
      return false;
    }

    this.rules.splice(index, 1);
    return true;
  }

  /**
   * Enable/disable rule by description
   */
  toggleRule(description: string, enabled: boolean): boolean {
    const rule = this.rules.find(r => r.description === description);

    if (!rule) {
      return false;
    }

    rule.enabled = enabled;
    return true;
  }

  /**
   * Get all privacy rules
   */
  getRules(): PrivacyRule[] {
    return [...this.rules];
  }

  /**
   * Get filtering statistics
   */
  getStats() {
    return {
      ...this.stats,
      rulesApplied: Object.fromEntries(this.stats.rulesApplied)
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      messagesFiltered: 0,
      messagesRedacted: 0,
      messagesBlocked: 0,
      rulesApplied: new Map()
    };
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Apply individual rule to content
   */
  private async applyRule(
    content: string,
    rule: PrivacyRule
  ): Promise<FilterResult> {
    const pattern = this.getPattern(rule);

    if (rule.action === 'filter') {
      // Check if pattern matches - if so, block entire message
      if (pattern.test(content)) {
        return {
          content,
          modified: false,
          action: 'block',
          reason: rule.description
        };
      }
      return { content, modified: false };
    }

    if (rule.action === 'redact') {
      // Replace matches with [REDACTED]
      const modified = content.replace(pattern, '[REDACTED]');
      return {
        content: modified,
        modified: modified !== content
      };
    }

    // 'block' action handled above
    return { content, modified: false };
  }

  /**
   * Get regex pattern from rule
   */
  private getPattern(rule: PrivacyRule): RegExp {
    if (rule.pattern instanceof RegExp) {
      return rule.pattern;
    }

    // Convert string to case-insensitive regex
    return new RegExp(rule.pattern, 'gi');
  }

  /**
   * Check if rule is enabled
   */
  private isRuleEnabled(rule: PrivacyRule): boolean {
    return rule.enabled !== false;
  }

  /**
   * Increment rule application count
   */
  private incrementRuleCount(description: string): void {
    const current = this.stats.rulesApplied.get(description) || 0;
    this.stats.rulesApplied.set(description, current + 1);
  }
}

/**
 * Validate privacy rule
 */
export function validatePrivacyRule(rule: PrivacyRule): boolean {
  // Check required fields
  if (!rule.type || !rule.pattern || !rule.action || !rule.description) {
    return false;
  }

  // Validate type
  if (!['keyword', 'pattern', 'file_path'].includes(rule.type)) {
    return false;
  }

  // Validate action
  if (!['filter', 'redact', 'block'].includes(rule.action)) {
    return false;
  }

  // Validate pattern
  if (typeof rule.pattern !== 'string' && !(rule.pattern instanceof RegExp)) {
    return false;
  }

  return true;
}

/**
 * Create privacy rule from configuration
 */
export function createPrivacyRule(
  type: 'keyword' | 'pattern' | 'file_path',
  pattern: string | RegExp,
  action: 'filter' | 'redact' | 'block',
  description: string
): PrivacyRule {
  return {
    type,
    pattern,
    action,
    description,
    enabled: true
  };
}
