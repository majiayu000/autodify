/**
 * Example Store - Few-shot Example Management
 */

import type {
  FewShotExample,
  ExampleMatch,
  ExampleCategory,
  SerializedExample,
} from './types.js';
import { parseYAML, stringifyYAML } from '../utils/yaml.js';

/**
 * Example store configuration
 */
export interface ExampleStoreConfig {
  /** Maximum examples to return in search */
  maxResults?: number;
  /** Minimum score threshold for matches */
  minScore?: number;
}

/**
 * Example Store - Manages few-shot examples for LLM context
 */
export class ExampleStore {
  private examples: Map<string, FewShotExample> = new Map();
  private config: Required<ExampleStoreConfig>;

  constructor(config: ExampleStoreConfig = {}) {
    this.config = {
      maxResults: config.maxResults ?? 3,
      minScore: config.minScore ?? 10,
    };
  }

  /**
   * Add an example to the store
   */
  add(example: FewShotExample): void {
    if (this.examples.has(example.metadata.id)) {
      console.warn(`Example "${example.metadata.id}" already exists, overwriting.`);
    }
    this.examples.set(example.metadata.id, example);
  }

  /**
   * Remove an example from the store
   */
  remove(id: string): boolean {
    return this.examples.delete(id);
  }

  /**
   * Get an example by ID
   */
  get(id: string): FewShotExample | undefined {
    return this.examples.get(id);
  }

  /**
   * Get all examples
   */
  getAll(): FewShotExample[] {
    return Array.from(this.examples.values());
  }

  /**
   * Get examples by category
   */
  getByCategory(category: ExampleCategory): FewShotExample[] {
    return this.getAll().filter((e) => e.metadata.category === category);
  }

  /**
   * Search for relevant examples based on a query
   */
  search(query: string, limit?: number): ExampleMatch[] {
    const normalizedQuery = this.normalizeText(query);
    const queryTokens = this.tokenize(normalizedQuery);
    const matches: ExampleMatch[] = [];

    for (const example of this.examples.values()) {
      const score = this.calculateScore(example, normalizedQuery, queryTokens);
      if (score >= this.config.minScore) {
        matches.push({
          example,
          score,
          matchedKeywords: this.findMatchedKeywords(example, queryTokens),
        });
      }
    }

    return matches
      .sort((a, b) => b.score - a.score)
      .slice(0, limit ?? this.config.maxResults);
  }

  /**
   * Find the best matching examples for building few-shot context
   */
  findBestExamples(query: string, count: number = 2): FewShotExample[] {
    const matches = this.search(query, count);
    return matches.map((m) => m.example);
  }

  /**
   * Format examples as few-shot prompts for LLM
   */
  formatForPrompt(examples: FewShotExample[]): string {
    if (examples.length === 0) {
      return '';
    }

    const parts: string[] = ['以下是一些工作流生成的示例：\n'];

    for (let i = 0; i < examples.length; i++) {
      const example = examples[i]!;
      const dslYaml = stringifyYAML(example.dsl);

      parts.push(`### 示例 ${i + 1}: ${example.metadata.name}\n`);
      parts.push(`**用户需求：** ${example.prompt}\n`);
      if (example.explanation) {
        parts.push(`**设计说明：** ${example.explanation}\n`);
      }
      parts.push(`**生成的 DSL：**\n\`\`\`yaml\n${dslYaml}\`\`\`\n`);
    }

    return parts.join('\n');
  }

  /**
   * Import examples from serialized format
   */
  import(serialized: SerializedExample[]): number {
    let imported = 0;
    for (const item of serialized) {
      try {
        const result = parseYAML(item.dsl);
        if (!result.success || !result.data) {
          console.error(`Failed to parse example "${item.metadata.id}": ${result.error}`);
          continue;
        }
        const example: FewShotExample = {
          metadata: item.metadata,
          prompt: item.prompt,
          dsl: result.data,
          explanation: item.explanation,
        };
        this.add(example);
        imported++;
      } catch (error) {
        console.error(`Failed to import example "${item.metadata.id}":`, error);
      }
    }
    return imported;
  }

  /**
   * Export examples to serialized format
   */
  export(): SerializedExample[] {
    return this.getAll().map((example) => ({
      metadata: example.metadata,
      prompt: example.prompt,
      dsl: stringifyYAML(example.dsl),
      explanation: example.explanation,
    }));
  }

  /**
   * Calculate relevance score
   */
  private calculateScore(
    example: FewShotExample,
    normalizedQuery: string,
    queryTokens: string[]
  ): number {
    let score = 0;
    const meta = example.metadata;

    // Name match
    if (normalizedQuery.includes(this.normalizeText(meta.name))) {
      score += 30;
    }

    // Prompt similarity
    const promptTokens = this.tokenize(this.normalizeText(example.prompt));
    const promptOverlap = queryTokens.filter((t) => promptTokens.includes(t)).length;
    score += promptOverlap * 8;

    // Keyword matches
    for (const keyword of meta.keywords) {
      const normalizedKeyword = this.normalizeText(keyword);
      if (normalizedQuery.includes(normalizedKeyword)) {
        score += 15;
      } else if (queryTokens.some((t) => normalizedKeyword.includes(t))) {
        score += 7;
      }
    }

    // Description match
    const descTokens = this.tokenize(this.normalizeText(meta.description));
    const descOverlap = queryTokens.filter((t) => descTokens.includes(t)).length;
    score += descOverlap * 3;

    return score;
  }

  /**
   * Find matched keywords
   */
  private findMatchedKeywords(example: FewShotExample, queryTokens: string[]): string[] {
    const matched: string[] = [];
    for (const keyword of example.metadata.keywords) {
      const normalizedKeyword = this.normalizeText(keyword);
      if (queryTokens.some((t) => normalizedKeyword.includes(t) || t.includes(normalizedKeyword))) {
        matched.push(keyword);
      }
    }
    return matched;
  }

  /**
   * Normalize text for matching
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Tokenize text
   */
  private tokenize(text: string): string[] {
    const tokens = text.split(/\s+/).filter((t) => t.length > 0);
    const result: string[] = [...tokens];

    for (const token of tokens) {
      if (/[\u4e00-\u9fa5]/.test(token) && token.length > 1) {
        for (let i = 0; i < token.length - 1; i++) {
          result.push(token.slice(i, i + 2));
        }
      }
    }

    return [...new Set(result)];
  }
}

/**
 * Create a new example store
 */
export function createExampleStore(config?: ExampleStoreConfig): ExampleStore {
  return new ExampleStore(config);
}
