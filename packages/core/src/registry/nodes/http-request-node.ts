/**
 * HTTP Request Node Metadata
 */

import type { NodeMeta } from '../types.js';

/**
 * HTTP Request 节点元信息
 */
export const httpRequestNodeMeta: NodeMeta = {
  type: 'http-request',
  displayName: 'HTTP 请求',
  description: '发送 HTTP 请求调用外部 API',
  category: 'tool',
  inputs: [
    {
      name: 'any',
      type: 'any',
      description: '任意输入',
    },
  ],
  outputs: [
    {
      name: 'status_code',
      type: 'number',
      description: 'HTTP 状态码',
    },
    {
      name: 'body',
      type: 'string',
      description: '响应体',
    },
    {
      name: 'headers',
      type: 'object',
      description: '响应头',
    },
  ],
  configFields: [
    {
      name: 'method',
      type: 'select',
      description: 'HTTP 方法',
      required: true,
      options: ['get', 'post', 'put', 'patch', 'delete', 'head'],
    },
    {
      name: 'url',
      type: 'string',
      description: '请求 URL',
      required: true,
    },
    {
      name: 'authorization',
      type: 'object',
      description: '授权配置',
      required: false,
    },
    {
      name: 'headers',
      type: 'array',
      description: '请求头',
      required: false,
    },
    {
      name: 'body',
      type: 'object',
      description: '请求体',
      required: false,
    },
  ],
  examples: [
    {
      description: 'GET 请求',
      config: {
        method: 'get',
        url: 'https://api.example.com/data',
        timeout: { connect: 10, read: 30, write: 10 },
      },
    },
  ],
  notes: ['URL 支持变量模板 {{#node.var#}}'],
};
