---
title: Headplane Agent
description: 配置 Headplane Agent 以启用更多功能。
---

# Headplane Agent {#headplane-agent}

Headplane Agent 是可选组件，定期从 Tailnet 同步节点版本、操作系统等信息。与旧版不同，无需手动创建或管理预授权密钥：Headplane 在每次 Agent 启动时准备新密钥，并在重启间复用现有 Tailnet 状态。

## 前提条件 {#prerequisites}

1. **Headscale 0.28 或更新版本**。Agent 使用 0.28 起提供的纯标签预授权密钥。
2. Headplane 配置中必须设置 **`headscale.api_key`**。Agent 用它自动生成加入 Tailnet 所需的密钥，并在 Headscale 要求人工批准时尝试自动批准注册。

## 配置 {#configuration}

在 Headplane 配置中设置以下字段。完整说明见[示例配置](https://github.com/laity-cqf/headplane-zh-cn/blob/stable/config.example.yaml)。

| 字段                                | 说明                                                         |
| ----------------------------------- | ------------------------------------------------------------ |
| **`integration.agent.enabled`**     | 设为 `true` 启用 Agent。                                     |
| `integration.agent.host_name`       | 可选，Agent 的 Headscale 名称，默认 `headplane-agent`。      |
| `integration.agent.cache_ttl`       | 可选，同步间隔，单位毫秒；默认 `180000`，即 3 分钟。         |
| `integration.agent.work_dir`        | 可选，保存 Tailnet 状态的工作目录。                          |
| `integration.agent.executable_path` | 可选，二进制路径，默认 `/usr/libexec/headplane/agent`。      |
| `integration.agent.tailscale_netns` | 可选，使用 Tailscale 的 socket 级路由环路处理，默认 `true`。 |

## 原生模式配置 {#native-mode-configuration}

本地构建后，`./build` 下会生成 `hp_agent`。将其移至 `/usr/libexec/headplane/agent` 并赋予可执行权限。

::: tip
无法移动二进制文件时，通过 **`integration.agent.executable_path`** 指定实际位置。
:::

默认数据目录是 `/var/lib/headplane/agent`。可用 **`integration.agent.work_dir`** 修改；目录必须存在，并允许 Headplane 的运行用户写入。

Headplane 将 `tailscaled.state` 保存在此目录，以便重启后保留 Tailnet 身份，避免每次注册新主机。若状态丢失或不可用，则退回到预授权密钥方式注册新 Agent 节点。

## Tailscale socket 路由处理 {#tailscale-socket-routing-handling}

默认使用 Tailscale 的 socket 处理，避免 Tailscale 自身发出的流量再次进入 Tailscale 管理的路由。它会尝试给出站 socket 设置绕过标记，供路由和策略识别。

容器移除全部 capabilities 后，`SO_MARK` 返回 `EPERM`。这不会破坏容器路由，但会让 Tailscale 回退到 `SO_BINDTODEVICE(DefaultRouteInterface())`。多网络容器中，即使 Linux 路由表已提供经另一接口到达 Headscale 的正确路由，此回退仍可能把连接固定到默认接口。此时正常的目的地址路由本可选择正确接口，并不依靠 `SO_MARK` 选择 Headscale 接口。

确认容器网络命名空间中的操作系统路由确实可达 Headscale 后，可改为依赖系统路由：

```yaml
integration:
  agent:
    enabled: true
    tailscale_netns: false
```

设为 `false` 仅在独立 `hp_agent` 进程内停用 Tailscale 的标记或绑定逻辑。Agent 与 Headplane 主进程仍共享容器的 Linux 网络命名空间。主进程网络行为、capabilities、Docker 网络、接口、路由表及默认网关均不改变。除非确定回退选错接口，否则应保持启用；裸机或经 Tailscale 路由的部署可能依赖其环路规避机制。

## 交互式批准 {#interactive-approval}

通常 Agent 使用自动生成的预授权密钥无交互连接。Headscale 若要求交互式批准，Headplane 会识别 Agent 输出的认证 URL，并用 `headscale.api_key` 自动批准。设置页仍保留批准链接，供自动批准失败时手动处理。

## 使用 {#usage}

<figure>
  <img class="dark-only" src="../../assets/preview-dark.png" alt="Headplane 管理面板" />
  <img class="light-only" src="../../assets/preview-light.png" alt="Headplane 管理面板" />
  <figcaption>Headplane 管理面板（上游英文界面截图）</figcaption>
</figure>

启用并配置后重启 Headplane。界面将显示各节点的主机详情；目标节点启用 Tailscale SSH 后，还可使用浏览器 SSH。

<figure>
  <img class="dark-only" src="../../assets/machine-dark.png" alt="设备详情页" />
  <img class="light-only" src="../../assets/machine-light.png" alt="设备详情页" />
  <figcaption>设备详情页（上游英文界面截图）</figcaption>
</figure>
