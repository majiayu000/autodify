/**
 * DSL Validator Tests
 */

import { describe, it, expect } from 'vitest';
import { validateDSL, DSLValidator } from './validator.js';
import { createSimpleDSL } from '../generator/generator.js';
import type { DifyDSL } from '../types/index.js';

describe('DSLValidator', () => {
  describe('validateDSL', () => {
    it('should validate a simple valid DSL', () => {
      const dsl = createSimpleDSL('Test', 'Test workflow');
      const result = validateDSL(dsl);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing start node', () => {
      const dsl: DifyDSL = {
        version: '0.5.0',
        kind: 'app',
        app: {
          name: 'Test',
          mode: 'workflow',
          icon: '🤖',
          icon_type: 'emoji',
        },
        workflow: {
          graph: {
            nodes: [
              {
                id: 'end',
                type: 'custom',
                data: {
                  type: 'end',
                  title: '结束',
                  outputs: [],
                },
              },
            ],
            edges: [],
          },
        },
      };

      const result = validateDSL(dsl);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'MISSING_START_NODE')).toBe(true);
    });

    it('should detect missing end node', () => {
      const dsl: DifyDSL = {
        version: '0.5.0',
        kind: 'app',
        app: {
          name: 'Test',
          mode: 'workflow',
          icon: '🤖',
          icon_type: 'emoji',
        },
        workflow: {
          graph: {
            nodes: [
              {
                id: 'start',
                type: 'custom',
                data: {
                  type: 'start',
                  title: '开始',
                  variables: [],
                },
              },
            ],
            edges: [],
          },
        },
      };

      const result = validateDSL(dsl);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'MISSING_END_NODE')).toBe(true);
    });

    it('should detect duplicate node IDs', () => {
      const dsl: DifyDSL = {
        version: '0.5.0',
        kind: 'app',
        app: {
          name: 'Test',
          mode: 'workflow',
          icon: '🤖',
          icon_type: 'emoji',
        },
        workflow: {
          graph: {
            nodes: [
              {
                id: 'start',
                type: 'custom',
                data: {
                  type: 'start',
                  title: '开始',
                  variables: [],
                },
              },
              {
                id: 'start',  // Duplicate!
                type: 'custom',
                data: {
                  type: 'end',
                  title: '结束',
                  outputs: [],
                },
              },
            ],
            edges: [],
          },
        },
      };

      const result = validateDSL(dsl);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'DUPLICATE_NODE_ID')).toBe(true);
    });

    it('should detect invalid edge source', () => {
      const dsl: DifyDSL = {
        version: '0.5.0',
        kind: 'app',
        app: {
          name: 'Test',
          mode: 'workflow',
          icon: '🤖',
          icon_type: 'emoji',
        },
        workflow: {
          graph: {
            nodes: [
              {
                id: 'start',
                type: 'custom',
                data: {
                  type: 'start',
                  title: '开始',
                  variables: [],
                },
              },
              {
                id: 'end',
                type: 'custom',
                data: {
                  type: 'end',
                  title: '结束',
                  outputs: [],
                },
              },
            ],
            edges: [
              {
                id: 'e1',
                source: 'nonexistent',  // Invalid!
                sourceHandle: 'source',
                target: 'end',
                targetHandle: 'target',
                type: 'custom',
                data: {
                  sourceType: 'start',
                  targetType: 'end',
                  isInIteration: false,
                },
              },
            ],
          },
        },
      };

      const result = validateDSL(dsl);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'INVALID_EDGE_SOURCE')).toBe(true);
    });

    it('should warn about isolated nodes', () => {
      const dsl: DifyDSL = {
        version: '0.5.0',
        kind: 'app',
        app: {
          name: 'Test',
          mode: 'workflow',
          icon: '🤖',
          icon_type: 'emoji',
        },
        workflow: {
          graph: {
            nodes: [
              {
                id: 'start',
                type: 'custom',
                data: {
                  type: 'start',
                  title: '开始',
                  variables: [],
                },
              },
              {
                id: 'isolated',  // Not connected
                type: 'custom',
                data: {
                  type: 'llm',
                  title: 'LLM',
                  model: {
                    provider: 'openai',
                    name: 'gpt-4o',
                    mode: 'chat',
                  },
                  prompt_template: [{ role: 'user', text: 'test' }],
                },
              },
              {
                id: 'end',
                type: 'custom',
                data: {
                  type: 'end',
                  title: '结束',
                  outputs: [],
                },
              },
            ],
            edges: [
              {
                id: 'e1',
                source: 'start',
                sourceHandle: 'source',
                target: 'end',
                targetHandle: 'target',
                type: 'custom',
                data: {
                  sourceType: 'start',
                  targetType: 'end',
                  isInIteration: false,
                },
              },
            ],
          },
        },
      };

      const result = validateDSL(dsl);

      expect(result.warnings.some((w) => w.code === 'ISOLATED_NODE')).toBe(true);
    });

    it('should detect self-reference edges', () => {
      const dsl: DifyDSL = {
        version: '0.5.0',
        kind: 'app',
        app: {
          name: 'Test',
          mode: 'workflow',
          icon: '🤖',
          icon_type: 'emoji',
        },
        workflow: {
          graph: {
            nodes: [
              {
                id: 'start',
                type: 'custom',
                data: {
                  type: 'start',
                  title: '开始',
                  variables: [],
                },
              },
              {
                id: 'end',
                type: 'custom',
                data: {
                  type: 'end',
                  title: '结束',
                  outputs: [],
                },
              },
            ],
            edges: [
              {
                id: 'e1',
                source: 'start',
                sourceHandle: 'source',
                target: 'start',  // Self-reference!
                targetHandle: 'target',
                type: 'custom',
                data: {
                  sourceType: 'start',
                  targetType: 'start',
                  isInIteration: false,
                },
              },
            ],
          },
        },
      };

      const result = validateDSL(dsl);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'SELF_REFERENCE_EDGE')).toBe(true);
    });
  });

  describe('DSLValidator class', () => {
    it('should respect options', () => {
      const validator = new DSLValidator({
        checkTopology: false,
        checkVariableRefs: false,
      });

      const dsl: DifyDSL = {
        version: '0.5.0',
        kind: 'app',
        app: {
          name: 'Test',
          mode: 'workflow',
          icon: '🤖',
          icon_type: 'emoji',
        },
        workflow: {
          graph: {
            nodes: [],
            edges: [],
          },
        },
      };

      // With topology check disabled, this should not report missing start/end
      const result = validator.validate(dsl);

      // Schema validation should still fail for empty nodes
      expect(result.errors.some((e) => e.code === 'MISSING_START_NODE')).toBe(false);
    });
  });
});
