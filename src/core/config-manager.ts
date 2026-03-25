/**
 * Configuration Manager
 *
 * Manages Memory-OS configuration with support for conversation recording
 * Features: config persistence, validation, migration, defaults
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import {
  MemoryOSConfig,
  StorageBackend,
  StorageConfig
} from './types';
import {
  RecordingMode,
  RecordingConfig,
  PrivacyRule,
  RetentionPolicy
} from '../conversation/types';
import { DEFAULT_PRIVACY_RULES } from '../conversation/privacy-filter';

/**
 * Extended Memory-OS Configuration
 * Includes conversation recording settings
 */
export interface ExtendedMemoryOSConfig extends MemoryOSConfig {
  version: string;

  /** Conversation recording configuration (v0.2.0) */
  conversation?: {
    recording: RecordingConfig;
    privacy: {
      enabled: boolean;
      rules: PrivacyRule[];
    };
    retention: RetentionPolicy;
    features: {
      generateSummaries: boolean;
      linkToMemories: boolean;
      searchIndexing: boolean;
    };
  };

  /** Legacy trigger-based extraction (v0.1.2) */
  legacy?: {
    triggerExtraction: boolean;
    triggerWords: {
      zh: string[];
      en: string[];
    };
  };
}

/**
 * Configuration Manager
 * Handles reading, writing, and migrating Memory-OS configuration
 */
export class ConfigManager {
  private configPath: string;
  private config: ExtendedMemoryOSConfig | null = null;

  constructor(configPath?: string) {
    this.configPath = configPath || this.getDefaultConfigPath();
  }

  /**
   * Load configuration from file
   */
  async load(): Promise<ExtendedMemoryOSConfig> {
    try {
      const content = await fs.readFile(this.configPath, 'utf-8');
      const parsed = JSON.parse(content);

      // Apply migrations if needed
      this.config = await this.migrateConfig(parsed);

      return this.config;
    } catch (error) {
      // Config doesn't exist, create default
      this.config = this.getDefaultConfig();
      await this.save();
      return this.config;
    }
  }

  /**
   * Save configuration to file
   */
  async save(): Promise<void> {
    if (!this.config) {
      throw new Error('No configuration loaded');
    }

    // Ensure parent directory exists
    const configDir = path.dirname(this.configPath);
    await fs.mkdir(configDir, { recursive: true });

    // Write config file
    await fs.writeFile(
      this.configPath,
      JSON.stringify(this.config, null, 2),
      'utf-8'
    );
  }

  /**
   * Get configuration value by key
   */
  get(key: string): any {
    if (!this.config) {
      throw new Error('Configuration not loaded');
    }

    return this.getNestedProperty(this.config, key);
  }

  /**
   * Set configuration value by key
   */
  async set(key: string, value: any): Promise<void> {
    if (!this.config) {
      throw new Error('Configuration not loaded');
    }

    this.setNestedProperty(this.config, key, value);
    await this.save();
  }

  /**
   * Get current recording mode
   */
  getRecordingMode(): RecordingMode {
    return this.config?.conversation?.recording?.mode || RecordingMode.TRIGGER_ONLY;
  }

  /**
   * Set recording mode
   */
  async setRecordingMode(mode: RecordingMode): Promise<void> {
    await this.set('conversation.recording.mode', mode);
  }

  /**
   * Get privacy rules
   */
  getPrivacyRules(): PrivacyRule[] {
    return this.config?.conversation?.privacy?.rules || DEFAULT_PRIVACY_RULES;
  }

  /**
   * Add privacy rule
   */
  async addPrivacyRule(rule: PrivacyRule): Promise<void> {
    if (!this.config?.conversation?.privacy) {
      throw new Error('Privacy configuration not initialized');
    }

    this.config.conversation.privacy.rules.push(rule);
    await this.save();
  }

  /**
   * Remove privacy rule by description
   */
  async removePrivacyRule(description: string): Promise<boolean> {
    if (!this.config?.conversation?.privacy) {
      return false;
    }

    const rules = this.config.conversation.privacy.rules;
    const index = rules.findIndex(r => r.description === description);

    if (index === -1) {
      return false;
    }

    rules.splice(index, 1);
    await this.save();
    return true;
  }

  /**
   * Get session timeout (in minutes)
   */
  getSessionTimeout(): number {
    return this.config?.conversation?.recording?.sessionTimeout || 30;
  }

  /**
   * Set session timeout (in minutes)
   */
  async setSessionTimeout(minutes: number): Promise<void> {
    await this.set('conversation.recording.sessionTimeout', minutes);
  }

  /**
   * Check if privacy filtering is enabled
   */
  isPrivacyEnabled(): boolean {
    return this.config?.conversation?.privacy?.enabled ?? true;
  }

  /**
   * Enable/disable privacy filtering
   */
  async setPrivacyEnabled(enabled: boolean): Promise<void> {
    await this.set('conversation.privacy.enabled', enabled);
  }

  /**
   * Get retention policy
   */
  getRetentionPolicy(): RetentionPolicy {
    return this.config?.conversation?.retention || {
      maxAge: 365,
      autoArchive: true,
      archiveAfterDays: 90
    };
  }

  /**
   * Update retention policy
   */
  async updateRetentionPolicy(
    policy: Partial<RetentionPolicy>
  ): Promise<void> {
    if (!this.config?.conversation?.retention) {
      throw new Error('Retention policy not initialized');
    }

    this.config.conversation.retention = {
      ...this.config.conversation.retention,
      ...policy
    };

    await this.save();
  }

  /**
   * Get full configuration
   */
  getConfig(): ExtendedMemoryOSConfig {
    if (!this.config) {
      throw new Error('Configuration not loaded');
    }

    return this.config;
  }

  /**
   * Reset configuration to defaults
   */
  async reset(): Promise<void> {
    this.config = this.getDefaultConfig();
    await this.save();
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Get default configuration
   */
  private getDefaultConfig(): ExtendedMemoryOSConfig {
    return {
      version: '0.2.0',
      storage: {
        path: '~/.memory-os',
        backend: StorageBackend.LOCAL
      },
      conversation: {
        recording: {
          mode: RecordingMode.SMART,
          autoStart: true,
          sessionTimeout: 30,
          maxMessagesPerSession: 1000,
          privacyRules: DEFAULT_PRIVACY_RULES,
          retention: {
            maxAge: 365,
            maxSessions: 10000,
            autoArchive: true,
            archiveAfterDays: 90
          },
          generateSummaries: false,
          linkToMemories: true,
          searchIndexing: true
        },
        privacy: {
          enabled: true,
          rules: DEFAULT_PRIVACY_RULES
        },
        retention: {
          maxAge: 365,
          maxSessions: 10000,
          autoArchive: true,
          archiveAfterDays: 90
        },
        features: {
          generateSummaries: false,
          linkToMemories: true,
          searchIndexing: true
        }
      },
      legacy: {
        triggerExtraction: true,
        triggerWords: {
          zh: ['记住', '保存', '记录'],
          en: ['remember', 'save', 'record']
        }
      },
      collectors: [],
      privacy: {
        encryption: false,
        shareStats: false,
        anonymize: false
      }
    };
  }

  /**
   * Get default configuration path
   */
  private getDefaultConfigPath(): string {
    const home = process.env.HOME || process.env.USERPROFILE || '';
    return path.join(home, '.memory-os', 'config.json');
  }

  /**
   * Migrate configuration from older versions
   */
  private async migrateConfig(
    config: any
  ): Promise<ExtendedMemoryOSConfig> {
    const version = config.version || '0.1.0';

    // Detect version and apply appropriate migrations
    if (this.compareVersions(version, '0.2.0') < 0) {
      // Migrate from v0.1.x to v0.2.0
      config = this.migrateFrom01x(config);
    }

    // Ensure conversation section exists
    if (!config.conversation) {
      const defaults = this.getDefaultConfig();
      config.conversation = defaults.conversation;
    }

    // Ensure legacy section exists
    if (!config.legacy) {
      const defaults = this.getDefaultConfig();
      config.legacy = defaults.legacy;
    }

    // Update version
    config.version = '0.2.0';

    return config as ExtendedMemoryOSConfig;
  }

  /**
   * Migrate from v0.1.x to v0.2.0
   */
  private migrateFrom01x(config: any): any {
    console.log('Migrating configuration from v0.1.x to v0.2.0...');

    const defaults = this.getDefaultConfig();

    // Preserve existing storage config
    const migrated: any = {
      version: '0.2.0',
      storage: config.storage || defaults.storage,
      collectors: config.collectors || defaults.collectors,
      privacy: config.privacy || defaults.privacy
    };

    // Add new conversation section with safe defaults
    // Default to TRIGGER_ONLY mode to maintain v0.1.2 behavior
    migrated.conversation = {
      ...defaults.conversation,
      recording: {
        ...defaults.conversation!.recording,
        mode: RecordingMode.TRIGGER_ONLY, // Safe default
        autoStart: false // Don't auto-start for existing users
      }
    };

    // Preserve legacy trigger-based extraction
    migrated.legacy = defaults.legacy;

    console.log('Migration complete. Recording mode set to TRIGGER_ONLY for compatibility.');

    return migrated;
  }

  /**
   * Compare semantic versions
   */
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;

      if (part1 < part2) return -1;
      if (part1 > part2) return 1;
    }

    return 0;
  }

  /**
   * Get nested property by dot notation
   */
  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Set nested property by dot notation
   */
  private setNestedProperty(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;

    const target = keys.reduce((current, key) => {
      if (!current[key]) {
        current[key] = {};
      }
      return current[key];
    }, obj);

    target[lastKey] = value;
  }
}

/**
 * Create configuration manager instance
 */
export function createConfigManager(
  configPath?: string
): ConfigManager {
  return new ConfigManager(configPath);
}

/**
 * Load configuration from default path
 */
export async function loadConfig(): Promise<ExtendedMemoryOSConfig> {
  const manager = createConfigManager();
  return await manager.load();
}

/**
 * Save configuration to default path
 */
export async function saveConfig(
  config: ExtendedMemoryOSConfig
): Promise<void> {
  const manager = createConfigManager();
  manager['config'] = config; // Set internal config
  await manager.save();
}
