/**
 * Workflow Orchestrator
 *
 * Main entry point for intelligent workflow generation and editing.
 */

import type {
  OrchestratorConfig,
  GenerationRequest,
  GenerationResult,
  EditRequest,
  EditResult,
  ValidationFeedback,
} from './types.js';
import type { ILLMService } from '../llm/types.js';
import { createLLMService } from '../llm/index.js';
import { WorkflowPlanner } from '../planner/index.js';
import { DSLValidator } from '../validator/validator.js';
import { parseYAML, stringifyYAML } from '../utils/yaml.js';
import { defaultTemplateStore } from '../templates/index.js';
import { ExampleStore, builtinExamples } from '../examples/index.js';
import {
  GENERATION_SYSTEM_PROMPT,
  EDIT_SYSTEM_PROMPT,
  buildGenerationPromptFromPlan,
  buildOrchestratorFixPrompt,
  buildEditPrompt,
} from './prompts.js';

/**
 * Workflow Orchestrator
 */
export class WorkflowOrchestrator {
  private config: OrchestratorConfig;
  private llm: ILLMService;
  private planner: WorkflowPlanner;
  private validator: DSLValidator;
  private exampleStore: ExampleStore;

  constructor(config: OrchestratorConfig) {
    this.config = {
      planningModel: config.planningModel ?? 'gpt-4o',
      generationModel: config.generationModel ?? 'gpt-4o',
      maxRetries: config.maxRetries ?? 2,
      verbose: config.verbose ?? false,
      ...config,
    };

    this.llm = createLLMService({
      provider: config.provider,
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      defaultModel: this.config.generationModel,
    });

    this.planner = new WorkflowPlanner({
      provider: config.provider,
      model: this.config.planningModel,
      apiKey: config.apiKey,
      verbose: config.verbose,
    });

    this.validator = new DSLValidator();

    this.exampleStore = new ExampleStore();
    for (const example of builtinExamples) {
      this.exampleStore.add(example);
    }
  }

  /**
   * Generate a workflow from natural language
   */
  async generate(request: GenerationRequest): Promise<GenerationResult> {
    const startTime = Date.now();

    try {
      // Step 1: Try to find matching template (unless skipped)
      if (!request.skipTemplates) {
        const templateMatch = defaultTemplateStore.findBest(request.prompt);

        // Use template only if score is very high (80+) for a confident match
        if (templateMatch && templateMatch.score >= 80) {
          this.log(`Using template: ${templateMatch.template.metadata.name}`);

          const dsl = templateMatch.template.build({
            provider: request.preferredProvider ?? 'openai',
            model: request.preferredModel ?? 'gpt-4o',
            datasetIds: request.datasetIds,
          });

          return {
            success: true,
            dsl,
            yaml: stringifyYAML(dsl),
            metadata: {
              duration: Date.now() - startTime,
              templateUsed: templateMatch.template.metadata.id,
            },
          };
        }
      }

      // Step 2: Plan the workflow
      this.log('Planning workflow...');
      const planResult = await this.planner.plan(request.prompt);

      if (!planResult.success || !planResult.plan) {
        return {
          success: false,
          error: planResult.error ?? 'Failed to plan workflow',
          metadata: { duration: Date.now() - startTime },
        };
      }

      this.log(`Plan created: ${planResult.plan.nodes.length} nodes`);

      // Step 3: Generate DSL from plan
      this.log('Generating DSL...');
      const generationResult = await this.generateFromPlan(planResult.plan, request);

      if (!generationResult.success) {
        return {
          ...generationResult,
          metadata: {
            duration: Date.now() - startTime,
            planSummary: `${planResult.plan.nodes.length} nodes, ${planResult.plan.edges.length} edges`,
          },
        };
      }

      return {
        ...generationResult,
        metadata: {
          duration: Date.now() - startTime,
          planSummary: `${planResult.plan.nodes.length} nodes, ${planResult.plan.edges.length} edges`,
          tokensUsed: undefined, // Would be tracked from LLM response
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: { duration: Date.now() - startTime },
      };
    }
  }

  /**
   * Edit an existing workflow
   */
  async edit(request: EditRequest): Promise<EditResult> {
    try {
      this.log('Editing workflow...');

      // Build edit prompt
      const userPrompt = buildEditPrompt(
        request.currentDsl,
        request.instruction,
        request.targetNodes
      );

      // Call LLM
      const result = await this.llm.chat(
        [
          { role: 'system', content: EDIT_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        { temperature: 0.3 }
      );

      // Extract YAML from response
      const yaml = this.extractYAML(result.content);

      if (!yaml) {
        return {
          success: false,
          error: 'Failed to extract YAML from response',
        };
      }

      // Parse and validate
      const parseResult = parseYAML(yaml);

      if (!parseResult.success || !parseResult.data) {
        return {
          success: false,
          error: `Parse error: ${parseResult.error}`,
        };
      }

      // Validate
      const validation = this.validator.validate(parseResult.data);

      if (!validation.valid) {
        // Try to fix
        const fixResult = await this.tryFix(yaml, validation.errors);
        return fixResult;
      }

      return {
        success: true,
        dsl: parseResult.data,
        yaml: stringifyYAML(parseResult.data),
        changes: this.detectChanges(request.currentDsl, parseResult.data),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate DSL from a plan
   */
  private async generateFromPlan(
    plan: ReturnType<typeof WorkflowPlanner.prototype['plan']> extends Promise<infer R> ? NonNullable<(R extends { plan?: infer P } ? P : never)> : never,
    request: GenerationRequest
  ): Promise<GenerationResult> {
    // Get relevant examples
    const examples = this.exampleStore.findBestExamples(request.prompt, 2);
    const exampleContext = this.exampleStore.formatForPrompt(examples);

    // Build generation prompt
    const userPrompt = buildGenerationPromptFromPlan(plan, {
      preferredProvider: request.preferredProvider,
      preferredModel: request.preferredModel,
      datasetIds: request.datasetIds,
    });

    // Full prompt with examples
    const fullPrompt = exampleContext
      ? `${exampleContext}\n\n${userPrompt}`
      : userPrompt;

    // Call LLM
    const result = await this.llm.chat(
      [
        { role: 'system', content: GENERATION_SYSTEM_PROMPT },
        { role: 'user', content: fullPrompt },
      ],
      { temperature: 0.3, responseFormat: 'text' }
    );

    // Extract YAML from response
    const yaml = this.extractYAML(result.content);

    if (!yaml) {
      return {
        success: false,
        error: 'Failed to extract YAML from response',
      };
    }

    // Parse YAML
    const parseResult = parseYAML(yaml);

    if (!parseResult.success || !parseResult.data) {
      return {
        success: false,
        error: `Parse error: ${parseResult.error}`,
      };
    }

    // Validate DSL
    const validation = this.validator.validate(parseResult.data);

    if (!validation.valid) {
      this.log(`Validation failed: ${validation.errors.length} errors`);

      // Try to fix
      const fixResult = await this.tryFix(yaml, validation.errors);
      return fixResult;
    }

    return {
      success: true,
      dsl: parseResult.data,
      yaml: stringifyYAML(parseResult.data),
    };
  }

  /**
   * Try to fix validation errors
   */
  private async tryFix(
    currentYaml: string,
    errors: Array<{ message: string }>
  ): Promise<GenerationResult> {
    const feedback: ValidationFeedback = {
      errors: errors.map((e) => e.message),
      suggestions: this.generateSuggestions(errors),
    };

    for (let retry = 0; retry < (this.config.maxRetries ?? 2); retry++) {
      this.log(`Fix attempt ${retry + 1}...`);

      const fixPrompt = buildOrchestratorFixPrompt(currentYaml, feedback);

      const result = await this.llm.chat(
        [
          { role: 'system', content: GENERATION_SYSTEM_PROMPT },
          { role: 'user', content: fixPrompt },
        ],
        { temperature: 0.2 }
      );

      const fixedYaml = this.extractYAML(result.content);

      if (!fixedYaml) {
        continue;
      }

      const parseResult = parseYAML(fixedYaml);

      if (!parseResult.success || !parseResult.data) {
        feedback.errors = [`Parse error: ${parseResult.error}`];
        currentYaml = fixedYaml;
        continue;
      }

      const validation = this.validator.validate(parseResult.data);

      if (validation.valid) {
        return {
          success: true,
          dsl: parseResult.data,
          yaml: stringifyYAML(parseResult.data),
        };
      }

      // Update feedback for next retry
      feedback.errors = validation.errors.map((e) => e.message);
      feedback.suggestions = this.generateSuggestions(validation.errors);
      currentYaml = fixedYaml;
    }

    return {
      success: false,
      error: `Failed to fix after ${this.config.maxRetries} retries. Errors: ${feedback.errors.join('; ')}`,
    };
  }

  /**
   * Extract YAML from LLM response
   */
  private extractYAML(content: string): string | null {
    // Try to find YAML in code blocks
    const codeBlockMatch = content.match(/```(?:yaml|yml)?\s*\n([\s\S]*?)\n```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1]!.trim();
    }

    // Try to find YAML without code blocks (starts with version:)
    const directMatch = content.match(/^(version:\s*['"]?0\.5\.0['"]?[\s\S]*)/m);
    if (directMatch) {
      return directMatch[1]!.trim();
    }

    // Assume entire content is YAML if it looks like it
    if (content.includes('version:') && content.includes('workflow:')) {
      return content.trim();
    }

    return null;
  }

  /**
   * Generate fix suggestions from errors
   */
  private generateSuggestions(errors: Array<{ message: string; nodeId?: string }>): string[] {
    const suggestions: string[] = [];

    for (const error of errors) {
      if (error.message.includes('not found')) {
        suggestions.push(`确保所有引用的节点 ID 存在`);
      }
      if (error.message.includes('variable')) {
        suggestions.push(`检查变量引用格式是否正确 ({{#nodeId.variable#}})`);
      }
      if (error.message.includes('edge')) {
        suggestions.push(`确保所有边连接的节点都存在`);
      }
      if (error.message.includes('start')) {
        suggestions.push(`确保有且只有一个 start 节点`);
      }
    }

    return [...new Set(suggestions)];
  }

  /**
   * Detect changes between two DSLs
   */
  private detectChanges(
    oldDsl: { workflow?: { graph: { nodes: Array<{ id: string }>; edges: Array<{ id: string }> } } },
    newDsl: { workflow?: { graph: { nodes: Array<{ id: string }>; edges: Array<{ id: string }> } } }
  ): Array<{ type: 'add' | 'remove' | 'modify'; target: 'node' | 'edge' | 'config'; id?: string; description: string }> {
    const changes: Array<{ type: 'add' | 'remove' | 'modify'; target: 'node' | 'edge' | 'config'; id?: string; description: string }> = [];

    const oldNodes = new Set(oldDsl.workflow?.graph.nodes.map((n) => n.id) ?? []);
    const newNodes = new Set(newDsl.workflow?.graph.nodes.map((n) => n.id) ?? []);

    // Added nodes
    for (const id of newNodes) {
      if (!oldNodes.has(id)) {
        changes.push({ type: 'add', target: 'node', id, description: `Added node ${id}` });
      }
    }

    // Removed nodes
    for (const id of oldNodes) {
      if (!newNodes.has(id)) {
        changes.push({ type: 'remove', target: 'node', id, description: `Removed node ${id}` });
      }
    }

    return changes;
  }

  /**
   * Log message if verbose
   */
  private log(message: string): void {
    if (this.config.verbose) {
      console.log(`[Orchestrator] ${message}`);
    }
  }
}

/**
 * Create a workflow orchestrator
 */
export function createOrchestrator(config: OrchestratorConfig): WorkflowOrchestrator {
  return new WorkflowOrchestrator(config);
}
