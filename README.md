# DocFlow · 团队文档智能问答

面向 5-20 人团队的知识库问答原型：上传内部文档，用自然语言检索答案。每条回答带引用来源；找不到就明确拒答，不编造。

技术栈：Next.js App Router · React · TypeScript · Tailwind · shadcn/ui · 本地 Dify RAG。

## 架构

```
Next.js UI  ──SSE──▶  /api/chat  ──▶  本地 Dify
文档库页     ──────▶  /api/documents ──▶  Dify 知识库 Dataset API
```

API Key 只出现在服务端 `.env.local`，浏览器拿不到。

## 启动

前置：本地 Dify 已用 docker compose 跑起来（当前 Nginx 在 `http://127.0.0.1`），并且本机 Ollama 在跑（对话 + Embedding）。

### Ollama

二进制在 `~/.local/ollama`（或已链到 `~/.local/bin/ollama`）。必须绑到 `0.0.0.0`，Docker 里的 Dify 才能通过 `host.docker.internal` 访问；只听 `127.0.0.1` 时容器连不上。

```bash
export OLLAMA_HOST=0.0.0.0:11434
export OLLAMA_ORIGINS='*'
cd ~/.local/ollama
./ollama serve
```

另开终端确认，并按需拉模型（本机 8GB：对话用 1.5B，不要上 3B/7B）：

```bash
curl -sS http://127.0.0.1:11434/api/tags
# 首次或换机器时：
ollama pull qwen2.5:1.5b
ollama pull bge-small-zh
```

Dify 里 Ollama 的 Base URL 填 `http://host.docker.internal:11434`，不要填 `localhost`。对话模型 `qwen2.5:1.5b`，知识库 Embedding `bge-small-zh`。

### Next.js

```bash
cd docflow
cp .env.example .env.local
# 填入 DIFY_API_KEY / DIFY_DATASET_ID（见下方）
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

## 接入本地 Dify

1. 浏览器打开 [http://127.0.0.1](http://127.0.0.1) 登录 Console。
2. **知识库**：新建「小帆科技公司内部文档」。Embedding 配好后选高质量索引；没有 Embedding 就把 `.env.local` 里 `DIFY_INDEXING_TECHNIQUE` 改成 `economy`。
3. 在知识库设置里打开 API，复制 Dataset API Key；浏览器 URL 里的 UUID 即 `DIFY_DATASET_ID`。
4. **应用**：新建聊天助手，打开「引用和归属」，绑定上述知识库。
5. 把 `samples/dify-prompt.md` 贴进系统提示词。检索 Top-K 建议 5，分数阈值与前端 `0.6` 对齐。
6. 应用「访问 API」里创建密钥，写入 `DIFY_API_KEY`。
7. 重启 `npm run dev`，到「文档库」页点「导入样本文档」，或手动上传 `samples/*.md`。
8. 回到问答页，先用示例 Chips 测 3 个问题，再跑 `test-questions.md` 的 20 题。



## 产品决策与测试

- 决策记录：[DECISIONS.md](./DECISIONS.md)
- 20 题测试集：[test-questions.md](./test-questions.md)



## 面试一句话

> 选 RAG 不微调，是因为内部知识周更；Dify 做检索编排，我做引用溯源、低置信拒答和流式状态机。

