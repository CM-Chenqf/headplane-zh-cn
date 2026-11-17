---
title: 安装
description: 开始安装 Headplane。
outline: [2, 3]
---

# 安装 {#installation}

Headplane 支持多种部署环境。先准备配置文件，再选择适合现有基础设施的安装方式。

## 配置 {#configuration}

Headplane 需要配置文件。可从[示例配置](https://github.com/laity-cqf/headplane-zh-cn/blob/stable/config.example.yaml)开始，主要字段如下：

| 字段                       | 说明                                                                                           |
| -------------------------- | ---------------------------------------------------------------------------------------------- |
| **`headscale.url`**        | Headscale 地址，例如 `http://headscale.example.com`，Docker 中可使用 `http://headscale:8080`。 |
| **`server.cookie_secret`** | Cookie 加密密钥，可通过 `openssl rand -base64 24` 生成随机字符串。                             |
| **`server.data_path`**     | 数据目录；尤其在 Docker 中，应保证挂载和持久化。                                               |

其他选项、密钥文件路径及环境变量覆盖方法，参阅[配置指南](../configuration/index.md)。

## 部署方式 {#deployment-methods}

根据实际环境选择：

### [Docker](./docker.md)：快速部署 {#docker-fast-and-easy-deployment-using-docker}

- 推荐多数场景使用，安装简单。
- 支持网络管理和浏览器 SSH 等高级功能。
- 需要 Docker 和 Docker Compose。

### [原生模式](./native-mode.md)：直接安装到服务器 {#native-mode-direct-installation-on-a-server}

- 适合不使用 Docker 的环境。
- 支持网络管理和浏览器 SSH 等高级功能。
- 需要手动准备依赖和运行环境。

### [受限模式](./limited-mode.md)：最少功能的快速试用 {#limited-mode-quick-and-easy-deployment-with-minimal-features}

- 适合测试和简单环境，不建议用于生产。
- 不提供网络管理、浏览器 SSH 等高级功能或集成。
