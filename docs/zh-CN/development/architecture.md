---
title: 架构
description: Headplane 服务端代码采用的服务架构模式。
outline: [2, 3]
---

# 架构 {#architecture}

服务端由单一 Node.js 进程中的独立服务模块组成。各服务自行管理状态和生命周期，不依赖共享的巨型对象或依赖注入框架。

本页记录服务端服务应遵循的模式，示例保留该发布线的原始接口与代码。

## 核心模式：闭包工厂 {#core-pattern-closure-factories}

每个服务都是**工厂函数**：参数接收依赖，闭包保存私有状态，返回普通函数对象。不使用类、装饰器或模块级全局变量。

```ts
// ✅ 正确：闭包工厂
export function createOidcService(config: OidcConfig): OidcService {
  // 私有状态：归当前实例所有，外部不可见
  let endpoints: ResolvedEndpoints | undefined;
  let cachedAuthMethod: string | undefined;

  function status() {
    if (endpoints) return { state: "ready", endpoints };
    return { state: "pending" };
  }

  async function startFlow() {
    // 使用闭包中的 `config` 和 `endpoints`
  }

  function invalidate() {
    endpoints = undefined;
    cachedAuthMethod = undefined;
  }

  return { status, startFlow, invalidate };
}
```

```ts
// ❌ 错误：模块级全局状态
let endpoints: ResolvedEndpoints | undefined;

export function init(config: OidcConfig) {
  // 修改模块全局变量：难以测试，且依赖导入顺序
}

export function startFlow() {
  // 读取模块全局变量：无法同时创建两个实例
}
```

```ts
// ❌ 错误：使用带 `this` 的类
export class OidcService {
  private endpoints?: ResolvedEndpoints;
  // 相比闭包仅增加样板代码，没有额外价值
}
```

### 为什么使用闭包？ {#why-closures}

- **可测试**：每个测试创建独立实例和配置，无需 `vi.resetModules()`、依赖导入顺序或清理单例。
- **可组合**：通过工厂参数接收其他服务，无需注册容器或使用字符串键。
- **可热重载**：调用 `service.reload(newConfig)` 或创建新实例，旧状态由垃圾回收处理。
- **依赖明确**：所有依赖都出现在工厂签名中，没有隐藏的环境状态。

## 服务接口 {#service-interface}

每个服务定义公开的 TypeScript 接口。路由、其他服务和测试依赖该接口，而非内部实现。

```ts
export interface OidcService {
  status(): OidcStatus;
  startFlow(): Promise<Result<FlowData, OidcError>>;
  handleCallback(params: URLSearchParams, state: FlowState): Promise<Result<Identity, OidcError>>;
  invalidate(): void;
  reload(config: OidcConfig): void;
}
```

### 生命周期钩子 {#lifecycle-hooks}

定时器、轮询或文件监听等后台工作应提供生命周期钩子，由所属服务管理：

```ts
export interface AuthService {
  require(request: Request): Promise<Principal>;
  can(principal: Principal, cap: Capabilities): boolean;
  // 生命周期
  start(): void; // 启动定时会话清理
  stop(): void; // 清除定时器并释放资源
}

export function createAuthService(opts: AuthServiceOptions): AuthService {
  let pruneTimer: NodeJS.Timeout | undefined;

  return {
    require(request) {
      /* ... */
    },
    can(principal, cap) {
      /* ... */
    },
    start() {
      pruneTimer = setInterval(() => void pruneExpiredSessions(), 15 * 60 * 1000);
    },
    stop() {
      if (pruneTimer) clearInterval(pruneTimer);
    },
  };
}
```

## Result 类型 {#result-type}

可能失败的操作使用共享 `Result<T, E>`，以便每个调用点显式处理失败，而非依赖抛出异常。

```ts
import { type Result, ok, err } from "~/server/result";

// 返回成功结果
return ok({ url, flowState });

// 返回失败结果
return err({ code: "discovery_failed", message: "..." });
```

路由与其他调用者使用判别联合：

```ts
const result = await runtime.oidc.startFlow();
if (!result.ok) {
  // result.error 具有明确类型，可据此渲染相应界面
  return redirect(`/login?s=${result.error.code}`);
}
// result.value 具有明确类型
return redirect(result.value.url);
```

`Result` 位于 `app/server/result.ts`，保持最小结构：

```ts
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };
```

## 组合根 {#composition-root}

服务在 `server/index.ts` 中统一连接。该**组合根**是唯一了解所有服务及其关系的位置。

```ts
export interface AppRuntime {
  config: HeadplaneConfig;
  db: DbClient;
  auth: AuthService;
  oidc?: OidcService;
  headscale: Headscale;
  agents?: AgentManager;
  stop(): Promise<void>;
}

export async function createAppRuntime(): Promise<AppRuntime> {
  const config = await loadConfig();
  const db = await createDbClient(/* ... */);
  const auth = createAuthService({ db /* ... */ });
  const oidc = config.oidc ? createOidcService({/* ... */}) : undefined;

  return {
    config,
    db,
    auth,
    oidc,
    async stop() {
      auth.stop?.();
    },
  };
}
```

React Router 的 `AppLoadContext` 包装运行时：

```ts
const runtime = await createAppRuntime();

getLoadContext() {
  return { runtime };
}
```

路由通过 `context.runtime` 访问服务：

```ts
export async function loader({ context }: Route.LoaderArgs) {
  const principal = await context.runtime.auth.require(request);
  // ...
}
```

### 依赖方向 {#dependency-direction}

服务依赖其他服务时，只通过明确的工厂参数传入，不导入另一服务模块并读取其状态：

```ts
// ✅ 正确：显式依赖
export function createAuthService(opts: {
  db: DbClient;
  // ...
}): AuthService {}

// ❌ 错误：隐藏耦合
import { getDb } from "~/server/db";
export function createAuthService(): AuthService {
  const db = getDb(); // 来源是什么？是否已初始化？
}
```

## 错误处理 {#error-handling}

### 配置阶段与交互阶段 {#config-time-vs-flow-time}

区分初始化时的配置错误与用户操作中的流程错误，以确定展示位置：

| 类型     | 发生时机         | 界面呈现         | 示例                                      |
| -------- | ---------------- | ---------------- | ----------------------------------------- |
| 配置阶段 | 用户操作之前     | 登录页横幅       | `discovery_failed`、`invalid_api_key`     |
| 交互阶段 | 用户开始流程之后 | 携带错误码重定向 | `token_exchange_failed`、`state_mismatch` |
| 非致命   | 流程进行中       | 仅记录日志       | `userinfo_failed`                         |

### 错误码 {#error-codes}

每个服务错误使用唯一的 `code`，对应：

1. 面向运维人员、包含处理细节的日志。
2. 面向用户的界面组件。
3. 故障排查文档章节。

```ts
export interface OidcError {
  code: OidcErrorCode; // 机器可读，用于 URL 和界面分支判断
  message: string; // 供人阅读，仅用于服务端日志
  hint?: string; // 写入日志的故障排查建议
}
```

## 测试 {#testing}

### 单元测试 {#unit-tests}

每个测试按需创建新实例，无需模拟框架：

```ts
import { createOidcService } from "~/server/oidc/provider";

test("status is pending before first discovery", () => {
  const oidc = createOidcService(testConfig);
  expect(oidc.status().state).toBe("pending");
});

test("invalidate clears cached endpoints", async () => {
  const oidc = createOidcService(testConfig);
  await oidc.discover();
  oidc.invalidate();
  expect(oidc.status().state).toBe("pending");
});
```

### 服务替身 {#faking-services}

下列为上游旧版架构文档中的局部运行时示例，只组合路由测试需要的服务；实际 Headscale 行为应在真实集成环境验证。

```ts
function createTestRuntime(overrides: Partial<AppRuntime> = {}): AppRuntime {
  return {
    config: testConfig,
    db: createTestDb(),
    auth: createTestAuth(),
    headscale: createTestHeadscale(),
    stop: async () => {},
    ...overrides,
  };
}

test("login page shows SSO button when OIDC is ready", () => {
  const runtime = createTestRuntime({
    oidc: createOidcService(testOidcConfig),
  });
  // 使用此运行时测试路由 loader
});
```

### 集成测试 {#integration-tests}

用 `testcontainers` 启动 Dex、Keycloak 等真实 OIDC 提供商，在无需浏览器自动化的情况下验证完整流程：

```ts
// 为 Dex 配置静态客户端和静态密码
// 直接请求令牌端点
// 端到端验证完整的服务端流程
```

## 添加新服务 {#adding-a-new-service}

1. 在 `app/server/<name>/` 定义接口。
2. 编写接收明确依赖、返回接口的工厂函数，将状态留在闭包中。
3. 有后台任务或缓存时，增加 `start`、`stop`、`reload`、`invalidate` 生命周期钩子。
4. 可能失败的操作使用 `Result<T, E>`，错误类型包含 `code`。
5. 在 `server/index.ts` 的 `createAppRuntime()` 连接服务。
6. 编写创建独立实例的测试，无需模拟整个模块。
