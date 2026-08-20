# SpeakMate

AI 口语听力陪练，通过实时对话、录音复盘和个性化反馈，帮助用户提升英语听说能力。

## MVP 功能

- 用户登录：email/password + JWT Bearer Token
- 选择练习场景
- AI 生成口语题目或对话
- 用户录音回答
- 语音转文字
- AI 生成评分和改进建议
- 保存历史练习记录

## 架构边界

当前代码按可接入 LangGraph 的方向拆分：

- `apps/api`: HTTP 路由和依赖组装。
- `packages/core`: 业务用例、领域类型、端口定义。
- `packages/providers`: AI/LLM 适配器，后续 LangGraph 实现放这里。
- `packages/db`: 存储适配器。

更多说明见 `docs/architecture.md`。

## API

认证接口：

- `POST /api/auth/register`: 注册并返回 `accessToken`
- `POST /api/auth/login`: 登录并返回 `accessToken`
- `GET /api/auth/me`: 使用 `Authorization: Bearer <token>` 查询当前用户

练习接口需要 `Authorization: Bearer <token>`：

- `GET /api/practice`
- `POST /api/practice`
- `GET /api/practice/:id`
- `POST /api/practice/:id`

本地开发可设置 `JWT_SECRET`。如果未设置，会使用开发用默认值，不要用于生产环境。

## PostgreSQL

设置 `DATABASE_URL` 后，API 会使用真正的 PostgreSQL 存储，并在启动时自动执行当前 migrations：

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/speakmate
JWT_SECRET=change-me-before-production
bun run dev:api
```

如果没有设置 `DATABASE_URL`，API 会退回内存存储，适合快速开发但重启后数据会丢失。

## 前端开发

前端在 `apps/web`，技术栈是 React + Tailwind + Radix UI。

启动 API：

```bash
bun run dev:api
```

启动 Web：

```bash
bun run dev:web
```

如果 API 不在默认的 `http://localhost:3000`，在 `apps/web` 设置：

```bash
VITE_API_URL=http://localhost:3001
```
