/**
 * Memory-OS Agent Integration Example
 *
 * AI Agent 长期记忆集成示例
 */

import { MemoryOS, MemoryType } from '../src/index';

/**
 * Simple AI Agent with Memory
 */
class MemoryAgent {
  private memory: MemoryOS;
  private conversationId: string;

  constructor() {
    this.conversationId = `conv-${Date.now()}`;
    this.memory = new MemoryOS({
      storage: {
        path: './.memory-os-agent',
        backend: 'local' as any,
      },
    });
  }

  async initialize() {
    await this.memory.init();
    console.log('✓ Agent memory initialized');
  }

  /**
   * Handle user message with memory
   */
  async chat(userMessage: string): Promise<string> {
    console.log(`\nUser: ${userMessage}`);

    // 1. Store user message
    await this.memory.collect({
      type: MemoryType.CHAT,
      content: {
        role: 'user',
        message: userMessage,
        conversationId: this.conversationId,
      },
      metadata: {
        source: 'agent-chat',
        tags: ['conversation', 'user'],
        context: this.conversationId,
      },
    });

    // 2. Retrieve relevant memories
    const relevant = await this.memory.search({
      query: userMessage,
      limit: 3,
    });

    // 3. Build context from memories
    const context = relevant
      .map((r, i) => `[Memory ${i + 1}] ${JSON.stringify(r.memory.content)}`)
      .join('\n');

    // 4. Generate response (mock)
    const response = this.generateResponse(userMessage, context);

    // 5. Store agent response
    await this.memory.collect({
      type: MemoryType.CHAT,
      content: {
        role: 'assistant',
        message: response,
        conversationId: this.conversationId,
      },
      metadata: {
        source: 'agent-chat',
        tags: ['conversation', 'assistant'],
        context: this.conversationId,
      },
    });

    console.log(`Agent: ${response}`);

    return response;
  }

  /**
   * Mock response generation
   */
  private generateResponse(userMessage: string, context: string): string {
    if (context) {
      return `Based on our previous conversations, I remember:\n${context}\n\nRegarding "${userMessage}", let me help you with that...`;
    } else {
      return `I don't have previous context about "${userMessage}". Let me help you...`;
    }
  }

  /**
   * Get conversation statistics
   */
  async getStats() {
    const stats = await this.memory.stats();
    return {
      totalMessages: stats.totalMemories,
      byType: stats.byType,
    };
  }

  async close() {
    await this.memory.close();
    console.log('✓ Agent memory closed');
  }
}

// Demo usage
async function demo() {
  console.log('=== Memory-OS Agent Integration Demo ===\n');

  const agent = new MemoryAgent();
  await agent.initialize();

  // Simulate conversation
  await agent.chat('Hello! I like using TypeScript for my projects.');
  await agent.chat('Can you recommend some good practices?');
  await agent.chat('What do you remember about my preferences?');

  // Show stats
  console.log('\n--- Conversation Statistics ---');
  const stats = await agent.getStats();
  console.log(JSON.stringify(stats, null, 2));

  await agent.close();

  console.log('\n=== Demo Complete ===');
}

// Run demo
demo().catch(console.error);
