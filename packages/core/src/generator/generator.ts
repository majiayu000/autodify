/**
 * DSL Generator
 *
 * Generates Dify workflow DSL from natural language.
 */

import type { DifyDSL, Node, NodeData } from '../types/index.js';
import { parseYAML, stringifyYAML } from '../utils/yaml.js';
import { validateDSL } from '../validator/index.js';
import type { GeneratorOptions, GenerateResult } from './types.js';
import { buildGenerationPrompt, buildFixPrompt } from './prompts.js';

/**
 * 节点布局常量
 */
const NODE_LAYOUT = {
  DEFAULT_WIDTH: 244,
  DEFAULT_HEIGHT: 54,
  START_HEIGHT: 90,
  END_HEIGHT: 90,
  LLM_HEIGHT: 98,
  ANSWER_HEIGHT: 103,
  CODE_HEIGHT: 54,
  HTTP_HEIGHT: 110,
  AGENT_HEIGHT: 198,
  HORIZONTAL_GAP: 60,
  START_X: 80,
  START_Y: 282,
};

/**
 * 生成时间戳 ID
 */
let lastGeneratedNodeId = 0;

function generateNodeId(): string {
  const candidate = Date.now() * 1000 + Math.floor(Math.random() * 1000);
  lastGeneratedNodeId = Math.max(candidate, lastGeneratedNodeId + 1);
  return String(lastGeneratedNodeId);
}

/**
 * 获取节点高度
 */
function getNodeHeight(nodeType: string): number {
  switch (nodeType) {
    case 'start':
      return NODE_LAYOUT.START_HEIGHT;
    case 'end':
      return NODE_LAYOUT.END_HEIGHT;
    case 'llm':
      return NODE_LAYOUT.LLM_HEIGHT;
    case 'answer':
      return NODE_LAYOUT.ANSWER_HEIGHT;
    case 'code':
      return NODE_LAYOUT.CODE_HEIGHT;
    case 'http-request':
      return NODE_LAYOUT.HTTP_HEIGHT;
    case 'agent':
      return NODE_LAYOUT.AGENT_HEIGHT;
    default:
      return NODE_LAYOUT.DEFAULT_HEIGHT;
  }
}

/**
 * 为节点添加布局信息
 */
function addNodeLayout(nodes: Node<NodeData>[]): Node<NodeData>[] {
  let currentX = NODE_LAYOUT.START_X;
  const y = NODE_LAYOUT.START_Y;

  return nodes.map((node) => {
    const width = NODE_LAYOUT.DEFAULT_WIDTH;
    const height = getNodeHeight(node.data.type);

    const position = { x: currentX, y };
    currentX += width + NODE_LAYOUT.HORIZONTAL_GAP;

    return {
      ...node,
      position,
      positionAbsolute: position,
      width,
      height,
      sourcePosition: 'right' as const,
      targetPosition: 'left' as const,
      selected: false,
    };
  });
}

/**
 * 规范化 DSL
 */
function normalizeDSL(dsl: DifyDSL): DifyDSL {
  if (!dsl.workflow?.graph) {
    return dsl;
  }

  // 添加节点布局
  const nodesWithLayout = addNodeLayout(dsl.workflow.graph.nodes as Node<NodeData>[]);

  // 更新节点 ID 映射
  const idMap = new Map<string, string>();
  const updatedNodes = nodesWithLayout.map((node) => {
    const newId = generateNodeId();
    idMap.set(node.id, newId);
    return { ...node, id: newId };
  });

  // 更新边的 source/target
  const updatedEdges = dsl.workflow.graph.edges.map((edge) => {
    const newSource = idMap.get(edge.source) || edge.source;
    const newTarget = idMap.get(edge.target) || edge.target;
    return {
      ...edge,
      id: `${newSource}-source-${newTarget}-target`,
      source: newSource,
      target: newTarget,
    };
  });

  // 更新变量引用 ({{#nodeId.var#}})
  const updateVariableRefs = (text: string): string => {
    return text.replace(/\{\{#([^.]+)\.([^#]+)#\}\}/g, (match, nodeId, varName) => {
      const newId = idMap.get(nodeId);
      return newId ? `{{#${newId}.${varName}#}}` : match;
    });
  };

  // 遍历节点更新变量引用
  const nodesWithUpdatedRefs = updatedNodes.map((node) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = { ...node.data };

    // 更新 LLM prompt_template
    if (data.prompt_template && Array.isArray(data.prompt_template)) {
      data.prompt_template = data.prompt_template.map((pt: { role: string; text: string }) => ({
        ...pt,
        text: updateVariableRefs(pt.text),
      }));
    }

    // 更新 answer
    if (data.answer && typeof data.answer === 'string') {
      data.answer = updateVariableRefs(data.answer);
    }

    // 更新 value_selector in outputs
    if (data.outputs && Array.isArray(data.outputs)) {
      data.outputs = data.outputs.map((output: { variable: string; value_selector?: string[] }) => {
        if (output.value_selector && Array.isArray(output.value_selector)) {
          return {
            ...output,
            value_selector: output.value_selector.map((id: string, idx: number) =>
              idx === 0 ? idMap.get(id) || id : id
            ),
          };
        }
        return output;
      });
    }

    // 更新 variables 中的 value_selector
    if (data.variables && Array.isArray(data.variables)) {
      data.variables = data.variables.map((v: { variable?: string; value_selector?: string[] }) => {
        if (v.value_selector && Array.isArray(v.value_selector)) {
          return {
            ...v,
            value_selector: v.value_selector.map((id: string, idx: number) =>
              idx === 0 ? idMap.get(id) || id : id
            ),
          };
        }
        return v;
      });
    }

    return { ...node, data: data as NodeData };
  });

  return {
    ...dsl,
    version: '0.1.3',
    workflow: {
      ...dsl.workflow,
      conversation_variables: dsl.workflow.conversation_variables || [],
      environment_variables: dsl.workflow.environment_variables || [],
      graph: {
        nodes: nodesWithUpdatedRefs,
        edges: updatedEdges,
        viewport: {
          x: 0,
          y: 0,
          zoom: 1,
        },
      },
      features: {
        file_upload: {
          enabled: false,
          image: {
            enabled: false,
            number_limits: 3,
            transfer_methods: ['local_file', 'remote_url'],
          },
        },
        opening_statement: '',
        retriever_resource: { enabled: true },
        sensitive_word_avoidance: { enabled: false },
        speech_to_text: { enabled: false },
        suggested_questions: [],
        suggested_questions_after_answer: { enabled: false },
        text_to_speech: { enabled: false, language: '', voice: '' },
        ...dsl.workflow.features,
      },
    },
  };
}

/**
 * LLM 调用接口
 */
export interface LLMClient {
  generate(prompt: string): Promise<string>;
}

/**
 * 默认生成选项
 */
const defaultOptions: GeneratorOptions = {
  modelProvider: 'openai',
  modelName: 'gpt-4o',
  temperature: 0.7,
  maxRetries: 3,
  validate: true,
};

/**
 * DSL 生成器类
 */
export class DSLGenerator {
  private options: GeneratorOptions;
  private llmClient: LLMClient;

  constructor(llmClient: LLMClient, options: GeneratorOptions = {}) {
    this.options = { ...defaultOptions, ...options };
    this.llmClient = llmClient;
  }

  /**
   * 从自然语言生成 DSL
   */
  async generate(userRequest: string): Promise<GenerateResult> {
    const prompt = buildGenerationPrompt(userRequest);

    let lastError: string | undefined;
    let retries = 0;

    for (let i = 0; i < (this.options.maxRetries ?? 3); i++) {
      try {
        // 调用 LLM 生成
        let response = await this.llmClient.generate(prompt);

        // 清理响应（移除 markdown 代码块标记）
        response = this.cleanYAMLResponse(response);

        // 解析 YAML
        const parseResult = parseYAML(response);
        if (!parseResult.success) {
          lastError = parseResult.error;
          retries++;

          // 尝试修复
          if (i < (this.options.maxRetries ?? 3) - 1) {
            const fixPrompt = buildFixPrompt(response, [parseResult.error!]);
            const fixedResponse = await this.llmClient.generate(fixPrompt);
            response = this.cleanYAMLResponse(fixedResponse);

            const fixedParseResult = parseYAML(response);
            if (fixedParseResult.success) {
              return this.validateAndReturn(fixedParseResult.data!, response, retries);
            }
          }
          continue;
        }

        // 验证 DSL
        if (this.options.validate) {
          return this.validateAndReturn(parseResult.data!, response, retries);
        }

        return {
          success: true,
          dsl: parseResult.data!,
          yaml: response,
          retries,
        };
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        retries++;
      }
    }

    return {
      success: false,
      error: lastError ?? 'Unknown error',
      retries,
    };
  }

  /**
   * 验证并返回结果
   */
  private validateAndReturn(dsl: DifyDSL, yaml: string, retries: number): GenerateResult {
    const validation = validateDSL(dsl);

    if (!validation.valid) {
      const errorMessages = validation.errors.map((e) => e.message);
      return {
        success: false,
        dsl,
        yaml,
        error: `Validation failed: ${errorMessages.join('; ')}`,
        retries,
      };
    }

    // 规范化 DSL（添加布局、更新 ID 等）
    const normalizedDSL = normalizeDSL(dsl);
    const normalizedYAML = stringifyYAML(normalizedDSL);

    return {
      success: true,
      dsl: normalizedDSL,
      yaml: normalizedYAML,
      retries,
    };
  }

  /**
   * 清理 YAML 响应
   */
  private cleanYAMLResponse(response: string): string {
    // 移除 markdown 代码块标记
    let cleaned = response.trim();

    // 移除开头的 ```yaml 或 ```
    if (cleaned.startsWith('```yaml')) {
      cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.slice(3);
    }

    // 移除结尾的 ```
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3);
    }

    return cleaned.trim();
  }

  /**
   * 生成简单工作流（快捷方法）
   */
  async generateSimpleWorkflow(
    name: string,
    systemPrompt: string,
    inputLabel: string = '输入'
  ): Promise<GenerateResult> {
    const request = `创建一个名为"${name}"的工作流：
- 接收用户的${inputLabel}
- 使用 LLM 处理，系统提示词是：${systemPrompt}
- 输出处理结果`;

    return this.generate(request);
  }
}

/**
 * 创建一个简单的 DSL 生成器（用于测试）
 */
export function createSimpleDSL(name: string, description: string): DifyDSL {
  const startId = generateNodeId();
  const llmId = generateNodeId();
  const endId = generateNodeId();

  const baseDSL: DifyDSL = {
    version: '0.1.3',
    kind: 'app',
    app: {
      name,
      mode: 'workflow',
      icon: '🤖',
      icon_type: 'emoji',
      icon_background: '#FFEAD5',
      description,
      use_icon_as_answer_icon: false,
    },
    workflow: {
      conversation_variables: [],
      environment_variables: [],
      graph: {
        nodes: [
          {
            id: startId,
            type: 'custom',
            position: { x: 80, y: 282 },
            positionAbsolute: { x: 80, y: 282 },
            width: 244,
            height: 90,
            sourcePosition: 'right',
            targetPosition: 'left',
            selected: false,
            data: {
              type: 'start',
              title: '开始',
              desc: '',
              variables: [
                {
                  variable: 'input',
                  label: '输入',
                  type: 'paragraph',
                  required: true,
                  max_length: 2000,
                  options: [],
                },
              ],
            },
          },
          {
            id: llmId,
            type: 'custom',
            position: { x: 384, y: 282 },
            positionAbsolute: { x: 384, y: 282 },
            width: 244,
            height: 98,
            sourcePosition: 'right',
            targetPosition: 'left',
            selected: false,
            data: {
              type: 'llm',
              title: 'AI 处理',
              desc: '',
              model: {
                provider: 'openai',
                name: 'gpt-4o',
                mode: 'chat',
                completion_params: {
                  temperature: 0.7,
                },
              },
              prompt_template: [
                {
                  role: 'system',
                  text: '你是一个有帮助的助手。',
                },
                {
                  role: 'user',
                  text: `{{#${startId}.input#}}`,
                },
              ],
              context: {
                enabled: false,
              },
              vision: {
                enabled: false,
              },
            },
          },
          {
            id: endId,
            type: 'custom',
            position: { x: 688, y: 282 },
            positionAbsolute: { x: 688, y: 282 },
            width: 244,
            height: 90,
            sourcePosition: 'right',
            targetPosition: 'left',
            selected: false,
            data: {
              type: 'end',
              title: '结束',
              desc: '',
              outputs: [
                {
                  variable: 'result',
                  value_selector: [llmId, 'text'],
                },
              ],
            },
          },
        ],
        edges: [
          {
            id: `${startId}-source-${llmId}-target`,
            source: startId,
            sourceHandle: 'source',
            target: llmId,
            targetHandle: 'target',
            type: 'custom',
            zIndex: 0,
            data: {
              sourceType: 'start',
              targetType: 'llm',
              isInIteration: false,
            },
          },
          {
            id: `${llmId}-source-${endId}-target`,
            source: llmId,
            sourceHandle: 'source',
            target: endId,
            targetHandle: 'target',
            type: 'custom',
            zIndex: 0,
            data: {
              sourceType: 'llm',
              targetType: 'end',
              isInIteration: false,
            },
          },
        ],
        viewport: {
          x: 0,
          y: 0,
          zoom: 1,
        },
      },
      features: {
        file_upload: {
          enabled: false,
          image: {
            enabled: false,
            number_limits: 3,
            transfer_methods: ['local_file', 'remote_url'],
          },
        },
        opening_statement: '',
        retriever_resource: { enabled: true },
        sensitive_word_avoidance: { enabled: false },
        speech_to_text: { enabled: false },
        suggested_questions: [],
        suggested_questions_after_answer: { enabled: false },
        text_to_speech: { enabled: false, language: '', voice: '' },
      },
    },
  };

  return baseDSL;
}

/**
 * 将 DSL 序列化为 YAML
 */
export function dslToYAML(dsl: DifyDSL): string {
  return stringifyYAML(dsl);
}
