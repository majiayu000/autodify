# 从描述到 Dify 工作流：生成、校验与导入

Autodify 生成和编辑 Dify 工作流 DSL。生成 YAML、通过 Autodify 校验、在目标
Dify 环境导入成功、真实调用模型成功，是四件分别需要确认的事。

先按 [快速开始](../../README.md#快速开始) 安装 Node.js 20+ 和项目指定的 pnpm 9，
在仓库根目录安装依赖并构建。下面先走不调用 LLM 的 CLI 路径，再处理真实需求。

## 先验证本地 CLI 和 YAML 路径

```bash
pnpm install --frozen-lockfile
pnpm --filter @autodify/core build
pnpm --filter @autodify/cli build
pnpm --filter @autodify/cli start create "工作流格式示例" --simple -o workflow.yml
pnpm --filter @autodify/cli start validate workflow.yml --json
```

`--simple` 生成固定的 start → llm → end 三节点基础结构，不需要 API key，也不会
执行节点里的模型。它不是把自然语言需求完整理解并生成的业务工作流。filter 命令
在 CLI 包目录运行，例子的输出文件是 `packages/cli/workflow.yml`。

成功时 create 报告三节点、两条边，validate 返回 `valid: true`；这证明本地文件可
解析并通过当前校验器，不证明目标 Dify 版本、插件或模型凭据已经准备好。

## 让模型生成满足真实需求的工作流

启动已有 [Web/API 界面](../../README.md#快速开始)，确认服务凭据已按当前部署文档
配置。描述任务时把输入、分支条件、处理步骤和输出写清楚，例如：

> 输入一段中文和目标语言，翻译后输出译文；目标语言为空时先提示补充，不能直接调用翻译节点。

这是待生成的需求，不是已经验收的结果。生成后在预览中检查输入变量、条件分支、
模型参数和节点连线，再导出 YAML。命令行也可使用没有 `--simple` 的 create，但
CLI 的 OpenAI/Anthropic 凭据使用 `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`；不要把
Web 服务的 `LLM_API_KEY` 配置误当成 CLI 自动读取的同一项。

## 校验并导入到目标 Dify

1. 对导出的文件运行 validate；先修复解析/结构错误，再检查警告和变量引用。
2. 在目标 Dify 环境按 [官方应用导入与导出说明](https://docs.dify.ai/en/cloud/use-dify/workspace/app-management)
   导入 DSL。DSL 版本、模型提供商、插件或知识库依赖可能需要目标环境中的配置。
3. 打开导入后的图，核对模型与变量绑定，先用一条已知输入测试，再分别测试缺少输入、
   条件分支和失败路径。实际调用会使用目标服务的资源和计费。
4. 保留目标 Dify 版本、导出文件、导入错误和测试结果。不要把 `valid: true` 写成
   “所有 Dify 版本均兼容”或“模型运行已通过”。

项目已有 [DSL 格式参考](../reference/DIFY_DSL_SPEC.md)、
[复杂工作流设计说明](../COMPLEX_WORKFLOW_DESIGN.md) 和
[Builder API 示例](../../packages/core/examples/demo.ts)，可用来核对节点和变量结构。
其中示例/参考的版本描述不替代目标 Dify 环境的实测结果。

## 常见问题

**文件找不到。** filter 命令以包目录为工作目录；核对输出位置，或给 validate 一个明确路径。

**本地校验通过但导入失败。** 分别记录目标版本、插件/模型依赖和导入错误，按错误修正；
本地校验器不登录 Dify，也不验证真实模型调用。

**我要的是通用业务自动化而不是 Dify DSL。**
[n8n 的首个工作流教程](https://docs.n8n.io/build-your-first-workflow)介绍其自己的工作流运行方式。
先确定目标运行平台，不能把不同平台的格式当成可以互换的文件。

[返回 README](../../README.md) · [Docker 部署](../../DOCKER.md) ·
[报告问题](https://github.com/majiayu000/autodify/issues) · [许可证声明](../../README.md#license)
