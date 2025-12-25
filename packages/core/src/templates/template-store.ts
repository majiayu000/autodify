/**
 * Template Store - Registry and Matching System
 */

import type { WorkflowTemplate, TemplateMatch, TemplateCategory } from './types.js';
import { builtinTemplates } from './builtin/index.js';
import { LRUCache, getCacheConfig } from '../utils/cache.js';

/**
 * Template store configuration
 */
export interface TemplateStoreConfig {
  /** Include built-in templates */
  includeBuiltin?: boolean;
  /** Custom templates to add */
  customTemplates?: WorkflowTemplate[];
  /** Enable caching for template matching */
  enableCache?: boolean;
  /** Cache configuration */
  cacheConfig?: {
    maxSize?: number;
    ttl?: number | null;
    enableStats?: boolean;
  };
}

/**
 * Template Store - Manages template registry and matching
 */
export class TemplateStore {
  private templates: Map<string, WorkflowTemplate> = new Map();
  private matchCache: LRUCache<string, TemplateMatch[]> | null = null;

  constructor(config: TemplateStoreConfig = {}) {
    const {
      includeBuiltin = true,
      customTemplates = [],
      enableCache = true,
      cacheConfig,
    } = config;

    // Initialize cache if enabled
    if (enableCache) {
      const envConfig = getCacheConfig('TEMPLATE');
      const finalConfig = {
        maxSize: cacheConfig?.maxSize ?? envConfig.maxSize,
        ttl: cacheConfig?.ttl ?? envConfig.ttl,
        enableStats: cacheConfig?.enableStats ?? envConfig.enableStats,
      };
      this.matchCache = new LRUCache(finalConfig);
    }

    if (includeBuiltin) {
      for (const template of builtinTemplates) {
        this.register(template);
      }
    }

    for (const template of customTemplates) {
      this.register(template);
    }
  }

  /**
   * Register a template
   */
  register(template: WorkflowTemplate): void {
    if (this.templates.has(template.metadata.id)) {
      console.warn(`Template "${template.metadata.id}" already exists, overwriting.`);
    }
    this.templates.set(template.metadata.id, template);
    // Clear cache when templates change
    this.matchCache?.clear();
  }

  /**
   * Unregister a template
   */
  unregister(id: string): boolean {
    const result = this.templates.delete(id);
    // Clear cache when templates change
    if (result) {
      this.matchCache?.clear();
    }
    return result;
  }

  /**
   * Get a template by ID
   */
  get(id: string): WorkflowTemplate | undefined {
    return this.templates.get(id);
  }

  /**
   * Get all templates
   */
  getAll(): WorkflowTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get templates by category
   */
  getByCategory(category: TemplateCategory): WorkflowTemplate[] {
    return this.getAll().filter((t) => t.metadata.category === category);
  }

  /**
   * Get templates by tag
   */
  getByTag(tag: string): WorkflowTemplate[] {
    return this.getAll().filter((t) => t.metadata.tags.includes(tag));
  }

  /**
   * Match templates against a natural language query
   * Returns templates sorted by relevance score
   */
  match(query: string, limit: number = 5): TemplateMatch[] {
    // Check cache first
    const cacheKey = `${query}:${limit}`;
    const cached = this.matchCache?.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    const normalizedQuery = this.normalizeText(query);
    const queryTokens = this.tokenize(normalizedQuery);
    const matches: TemplateMatch[] = [];

    for (const template of this.templates.values()) {
      const score = this.calculateScore(template, normalizedQuery, queryTokens);
      if (score > 0) {
        matches.push({
          template,
          score,
          matchedKeywords: this.findMatchedKeywords(template, queryTokens),
        });
      }
    }

    const result = matches.sort((a, b) => b.score - a.score).slice(0, limit);

    // Cache the result
    this.matchCache?.set(cacheKey, result);

    return result;
  }

  /**
   * Find the best matching template for a query
   */
  findBest(query: string): TemplateMatch | null {
    const matches = this.match(query, 1);
    return matches[0] ?? null;
  }

  /**
   * Calculate relevance score for a template
   */
  private calculateScore(
    template: WorkflowTemplate,
    normalizedQuery: string,
    queryTokens: string[]
  ): number {
    let score = 0;
    const meta = template.metadata;

    // Name match (highest weight)
    if (normalizedQuery.includes(this.normalizeText(meta.name))) {
      score += 50;
    }

    // Keyword matches
    for (const keyword of meta.keywords) {
      const normalizedKeyword = this.normalizeText(keyword);
      if (normalizedQuery.includes(normalizedKeyword)) {
        score += 20;
      } else if (queryTokens.some((token) => normalizedKeyword.includes(token))) {
        score += 10;
      }
    }

    // Tag matches
    for (const tag of meta.tags) {
      const normalizedTag = this.normalizeText(tag);
      if (normalizedQuery.includes(normalizedTag)) {
        score += 15;
      }
    }

    // Description match (partial)
    const descWords = this.tokenize(this.normalizeText(meta.description));
    const commonWords = queryTokens.filter((t) => descWords.includes(t));
    score += commonWords.length * 5;

    // Complexity bonus (prefer simpler templates for simple queries)
    const queryComplexity = this.estimateQueryComplexity(normalizedQuery);
    if (Math.abs(meta.complexity - queryComplexity) <= 1) {
      score += 10;
    }

    return score;
  }

  /**
   * Find keywords that matched in the query
   */
  private findMatchedKeywords(template: WorkflowTemplate, queryTokens: string[]): string[] {
    const matched: string[] = [];
    const meta = template.metadata;

    for (const keyword of meta.keywords) {
      const normalizedKeyword = this.normalizeText(keyword);
      if (queryTokens.some((token) => normalizedKeyword.includes(token) || token.includes(normalizedKeyword))) {
        matched.push(keyword);
      }
    }

    return matched;
  }

  /**
   * Estimate query complexity based on content
   */
  private estimateQueryComplexity(query: string): number {
    let complexity = 1;

    // Check for complexity indicators
    const complexIndicators = [
      '条件', '分支', 'if', 'else', '判断',
      '循环', '迭代', 'loop', '遍历',
      '知识库', 'rag', '检索',
      '分类', '路由', 'router',
      '并行', 'parallel',
      '代码', 'code', 'python', 'javascript',
      'api', 'http', '请求',
    ];

    for (const indicator of complexIndicators) {
      if (query.includes(indicator)) {
        complexity++;
      }
    }

    return Math.min(complexity, 5);
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
   * Tokenize text into words/tokens
   */
  private tokenize(text: string): string[] {
    // Split on spaces and filter empty strings
    const tokens = text.split(/\s+/).filter((t) => t.length > 0);

    // For Chinese text, also include individual characters for short words
    const result: string[] = [...tokens];
    for (const token of tokens) {
      // Check if token contains Chinese characters
      if (/[\u4e00-\u9fa5]/.test(token) && token.length > 1) {
        // Add 2-character combinations for Chinese
        for (let i = 0; i < token.length - 1; i++) {
          result.push(token.slice(i, i + 2));
        }
      }
    }

    return [...new Set(result)];
  }

  /**
   * Get cache statistics (if cache is enabled)
   */
  getCacheStats() {
    return this.matchCache?.getStats() ?? null;
  }

  /**
   * Clear the match cache
   */
  clearCache(): void {
    this.matchCache?.clear();
  }
}

/**
 * Default template store instance with built-in templates
 */
export const defaultTemplateStore = new TemplateStore();

/**
 * Create a new template store
 */
export function createTemplateStore(config?: TemplateStoreConfig): TemplateStore {
  return new TemplateStore(config);
}
