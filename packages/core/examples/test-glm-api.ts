/**
 * 测试 GLM-4 API 响应格式 (Anthropic 兼容)
 */

const GLM_CONFIG = {
  apiKey: process.env.GLM_API_KEY,
  baseUrl: 'https://open.bigmodel.cn/api/anthropic',
  model: 'glm-4.7',
};

async function testGLMApi() {
  console.log('测试 GLM-4 API (Anthropic 兼容格式)...\n');
  console.log('URL:', `${GLM_CONFIG.baseUrl}/v1/messages`);

  // Anthropic API 格式使用 /v1/messages 端点
  const response = await fetch(`${GLM_CONFIG.baseUrl}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': GLM_CONFIG.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: GLM_CONFIG.model,
      max_tokens: 1000,
      system: '你是一个助手',
      messages: [
        { role: 'user', content: '你好，请用一句话介绍自己' },
      ],
      temperature: 0.7,
    }),
  });

  console.log('Status:', response.status);

  const data = await response.json();
  console.log('\n响应数据:');
  console.log(JSON.stringify(data, null, 2));
}

testGLMApi().catch(console.error);
