import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestApp, closeTestApp } from '../helpers/build-app.js';

describe('Health Check API', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  describe('GET /api/health', () => {
    it('应该返回 200 状态码', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/health',
      });

      expect(response.statusCode).toBe(200);
    });

    it('应该返回正确的健康状态', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/health',
      });

      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('status', 'ok');
      expect(body).toHaveProperty('timestamp');
    });

    it('时间戳应该是有效的 ISO 8601 格式', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/health',
      });

      const body = JSON.parse(response.body);
      const timestamp = new Date(body.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.toString()).not.toBe('Invalid Date');
    });

    it('应该设置正确的 Content-Type', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/health',
      });

      expect(response.headers['content-type']).toContain('application/json');
    });
  });

  describe('GET /', () => {
    it('应该返回 API 基本信息', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('name', 'Autodify API');
      expect(body).toHaveProperty('version');
      expect(body).toHaveProperty('status', 'running');
    });
  });
});
