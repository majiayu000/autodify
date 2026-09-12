import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateWorkflowStream, type StreamChunk } from './generate';

function sseBody(chunks: unknown[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const payload = chunks.map((c) => `data: ${JSON.stringify(c)}\n\n`).join('');
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(payload));
      controller.close();
    },
  });
}

describe('generateWorkflowStream', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('resolves success with dsl/yaml from server complete event', async () => {
    const dsl = {
      app: { name: 'demo' },
      workflow: { graph: { nodes: [], edges: [] } },
    };
    const yaml = 'app:\n  name: demo\n';

    const chunks: StreamChunk[] = [
      {
        type: 'thinking',
        thinking: { step: 'analyze', message: 'Analyzing prompt' },
        done: false,
      },
      {
        type: 'node_created',
        node: { id: 'n1', type: 'start', title: 'Start' },
        nodeProgress: { current: 1, total: 1 },
        done: false,
      },
      {
        type: 'edges_created',
        edges: [],
        done: false,
      },
      {
        type: 'complete',
        dsl,
        yaml,
        metadata: { model: 'test-model' },
        done: false,
      },
      {
        type: 'done',
        done: true,
      },
    ];

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        body: sseBody(chunks),
      })
    );

    const received: StreamChunk[] = [];
    const result = await generateWorkflowStream({ prompt: 'build a workflow' }, (chunk) => {
      received.push(chunk);
    });

    expect(result).toEqual({
      success: true,
      dsl,
      yaml,
      metadata: { model: 'test-model' },
    });
    expect(received.map((c) => c.type)).toEqual([
      'thinking',
      'node_created',
      'edges_created',
      'complete',
      'done',
    ]);
    expect(received.find((c) => c.type === 'complete')).toMatchObject({ dsl, yaml });
  });

  it('still supports legacy content chunks for DSL', async () => {
    const dslPayload = { dsl: { app: { name: 'legacy' } }, yaml: 'legacy: true' };

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        body: sseBody([
          { type: 'content', content: JSON.stringify(dslPayload), done: false },
          { type: 'done', done: true },
        ]),
      })
    );

    const result = await generateWorkflowStream({ prompt: 'legacy' }, () => undefined);

    expect(result).toEqual({
      success: true,
      dsl: dslPayload.dsl,
      yaml: dslPayload.yaml,
    });
  });
});
