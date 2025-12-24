/**
 * 测试 GLM-4 API - OpenAI 兼容格式
 */

const GLM_CONFIG = {
  apiKey: process.env.GLM_API_KEY,
  baseUrl: 'https://open.bigmodel.cn/api/paas/v4',  // OpenAI 兼容端点
  model: 'glm-4',
};

async function testGLMOpenAI() {
  console.log('测试 GLM-4 API (OpenAI 格式)...\n');

  const response = await fetch(`${GLM_CONFIG.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GLM_CONFIG.apiKey}`,
    },
    body: JSON.stringify({
      model: GLM_CONFIG.model,
      max_tokens: 1000,
      messages: [
        { role: 'system', content: '你是一个助手' },
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

testGLMOpenAI().catch(console.error);
