/**
 * YAML Utils Tests
 */

import { describe, it, expect } from 'vitest';
import {
  parseYAML,
  stringifyYAML,
  parseYAMLOrThrow,
  isValidDSLYAML,
  formatYAML,
  extractField,
} from './yaml.js';
import type { DifyDSL } from '../types/index.js';

describe('YAML Utils', () => {
  const validDSL: DifyDSL = {
    version: '0.5.0',
    kind: 'app',
    app: {
      name: 'Test',
      mode: 'workflow',
      icon: '🤖',
      icon_type: 'emoji',
      description: 'Test workflow',
    },
    workflow: {
      graph: {
        nodes: [],
        edges: [],
      },
    },
  };

  const validYAML = `version: '0.5.0'
kind: app
app:
  name: Test
  mode: workflow
  icon: '🤖'
  icon_type: emoji
  description: Test workflow
workflow:
  graph:
    nodes: []
    edges: []`;

  describe('parseYAML', () => {
    it('should parse valid YAML', () => {
      const result = parseYAML(validYAML);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.version).toBe('0.5.0');
      expect(result.data?.app.name).toBe('Test');
    });

    it('should fail on invalid YAML syntax', () => {
      const invalidYAML = `version: '0.5.0'
  invalid indentation:`;

      const result = parseYAML(invalidYAML);

      expect(result.success).toBe(false);
      expect(result.error).toContain('YAML parse error');
    });

    it('should fail on missing version', () => {
      const noVersion = `kind: app
app:
  name: Test`;

      const result = parseYAML(noVersion);

      expect(result.success).toBe(false);
      expect(result.error).toContain('missing required field "version"');
    });

    it('should fail on invalid kind', () => {
      const invalidKind = `version: '0.5.0'
kind: invalid
app:
  name: Test`;

      const result = parseYAML(invalidKind);

      expect(result.success).toBe(false);
      expect(result.error).toContain('"kind" must be "app"');
    });

    it('should fail on missing app', () => {
      const noApp = `version: '0.5.0'
kind: app`;

      const result = parseYAML(noApp);

      expect(result.success).toBe(false);
      expect(result.error).toContain('missing required field "app"');
    });

    it('should fail on workflow mode without workflow field', () => {
      const noWorkflow = `version: '0.5.0'
kind: app
app:
  name: Test
  mode: workflow
  icon: test
  icon_type: emoji`;

      const result = parseYAML(noWorkflow);

      expect(result.success).toBe(false);
      expect(result.error).toContain('requires "workflow" field');
    });
  });

  describe('stringifyYAML', () => {
    it('should serialize DSL to YAML', () => {
      const yaml = stringifyYAML(validDSL);

      expect(yaml).toContain("version: '0.5.0'");
      expect(yaml).toContain("kind: 'app'");
      expect(yaml).toContain("name: 'Test'");
    });

    it('should respect options', () => {
      const yaml = stringifyYAML(validDSL, { indent: 4 });

      // Check that indentation is 4 spaces
      expect(yaml).toMatch(/\n {4}\w/);
    });
  });

  describe('parseYAMLOrThrow', () => {
    it('should return DSL for valid YAML', () => {
      const dsl = parseYAMLOrThrow(validYAML);

      expect(dsl.version).toBe('0.5.0');
    });

    it('should throw for invalid YAML', () => {
      expect(() => parseYAMLOrThrow('invalid: :')).toThrow();
    });
  });

  describe('isValidDSLYAML', () => {
    it('should return true for valid YAML', () => {
      expect(isValidDSLYAML(validYAML)).toBe(true);
    });

    it('should return false for invalid YAML', () => {
      expect(isValidDSLYAML('invalid: :')).toBe(false);
    });
  });

  describe('formatYAML', () => {
    it('should format YAML', () => {
      const messyYAML = `version: "0.5.0"
kind: "app"
app: {name: Test, mode: workflow, icon: "🤖", icon_type: emoji}
workflow: {graph: {nodes: [], edges: []}}`;

      const formatted = formatYAML(messyYAML);

      expect(formatted).toContain('\n');
      expect(formatted).toContain('nodes:');
    });

    it('should throw for invalid YAML', () => {
      expect(() => formatYAML('invalid: :')).toThrow();
    });
  });

  describe('extractField', () => {
    it('should extract nested fields', () => {
      const name = extractField(validYAML, 'app.name');
      expect(name).toBe('Test');

      const mode = extractField(validYAML, 'app.mode');
      expect(mode).toBe('workflow');
    });

    it('should return undefined for non-existent fields', () => {
      const result = extractField(validYAML, 'app.nonexistent');
      expect(result).toBeUndefined();
    });

    it('should return undefined for invalid YAML', () => {
      const result = extractField('invalid: :', 'app.name');
      expect(result).toBeUndefined();
    });
  });
});
