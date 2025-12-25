/**
 * Workflow Planner - Main planner class
 */

import type {
  PlannerOptions,
  PlanningResult,
} from './types.js';
import { analyzeIntent } from './intent-analyzer.js';
import { planFromRules } from './rule-based-planner.js';
import { planWithLLM, planFromTemplate } from './llm-planner.js';
import { defaultTemplateStore } from '../templates/index.js';

/**
 * Workflow Planner
 */
export class WorkflowPlanner {
  private options: Required<PlannerOptions>;

  constructor(options: PlannerOptions = {}) {
    this.options = {
      provider: options.provider ?? 'openai',
      model: options.model ?? 'gpt-4o',
      apiKey: options.apiKey ?? '',
      maxRetries: options.maxRetries ?? 2,
      verbose: options.verbose ?? false,
    };
  }

  /**
   * Plan a workflow from natural language description
   */
  async plan(userRequest: string): Promise<PlanningResult> {
    const startTime = Date.now();

    try {
      // Step 1: Analyze intent locally
      const intent = analyzeIntent(userRequest);

      if (this.options.verbose) {
        console.log('Analyzed intent:', intent);
      }

      // Step 2: Try to match existing template (only for simple intents with high confidence)
      // Skip template for complex workflows (complexity >= 4 or conditional/classification features)
      const hasComplexFeatures = intent.features.some(f =>
        f.type === 'conditional' || f.type === 'classification' || f.type === 'iteration'
      );
      const isComplex = intent.complexity >= 4 || hasComplexFeatures;

      if (!isComplex) {
        const templateMatch = defaultTemplateStore.findBest(userRequest);

        if (templateMatch && templateMatch.score >= 80) {
          // Use template-based planning only for high confidence matches
          if (this.options.verbose) {
            console.log('Using template:', templateMatch.template.metadata.name);
          }
          const plan = planFromTemplate(userRequest, templateMatch.template, intent);
          return {
            success: true,
            plan,
            duration: Date.now() - startTime,
          };
        }
      } else if (this.options.verbose) {
        console.log('Complex workflow detected, skipping template matching');
      }

      // Step 3: LLM-based planning
      if (!this.options.apiKey) {
        // Fall back to rule-based planning without API
        const plan = planFromRules(userRequest, intent);
        return {
          success: true,
          plan,
          duration: Date.now() - startTime,
        };
      }

      // Call LLM for complex planning
      const plan = await planWithLLM(
        userRequest,
        intent,
        this.options.apiKey,
        this.options.provider,
        this.options.model
      );
      return {
        success: true,
        plan,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      };
    }
  }
}

/**
 * Create a workflow planner
 */
export function createPlanner(options?: PlannerOptions): WorkflowPlanner {
  return new WorkflowPlanner(options);
}
