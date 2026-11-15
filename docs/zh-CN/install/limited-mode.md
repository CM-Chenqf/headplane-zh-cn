---
title: 受限模式
description: 以受限模式安装 Headplane。
---

# 受限模式 {#limited-mode}

::: warning
**不建议在生产环境使用受限模式。** 该模式缺少网络管理、浏览器 SSH 等高级功能，生产部署应选择其他安装方式。
:::

受限模式用于测试 Headplane 的基本功能，只通过 Headscale API 工作，不启用高级集成，适合本地测试和开发。

::: info 镜像来源
本页保留上游已发布镜像的示例。社区维护的完整双语镜像尚未正式发布；目标地址为 `ghcr.io/cm-chenqf/headplane-zh-cn`，应在构建、运行验收及正式发布后使用对应标签。进度见[语言与维护说明](/zh-CN/features/language)。
:::

## 前提条件 {#prerequisites}

- Docker；Docker Compose 为可选。
- 已运行的 Headscale 0.27.0 或更新版本。
- 已准备好 Headplane [配置文件](./index.md#configuration)。

## 安装 {#installation}

::: tip
不使用 Docker 时，可按[原生模式](./native-mode.md)安装，并跳过高级功能设置。
:::

运行以下命令：

```bash
docker run -d \
    -p 3000:3000 \
    -v /path/to/your/config.yaml:/etc/headplane/config.yaml \
    -v /path/to/data/storage:/var/lib/headplane \
    --name headplane \
    --restart unless-stopped \
    ghcr.io/tale/headplane:latest
```

必须挂载配置文件，并提供持久化数据目录。按需调整端口映射。

### 可选：Docker Compose {#optional-docker-compose}

最小 `compose.yaml` 示例：

```yaml
services:
  headplane:
    image: ghcr.io/tale/headplane:latest
    container_name: headplane
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - "/path/to/your/config.yaml:/etc/headplane/config.yaml"
      - "/path/to/data/storage:/var/lib/headplane"
```

## 访问 Headplane {#accessing-headplane}

容器启动后访问 `http://localhost:3000/admin`。远程访问时，将 `localhost` 替换为服务器 IP 或域名。

使用 Headscale API 密钥登录。在 Headscale 环境中执行以下命令，并按需调整有效期：

```bash
# 按需调整有效期
headscale apikeys create --expiration 90d
```

受限模式面向测试与开发。生产环境请选择其他方式，以获得完整功能和更可靠的部署。

受限模式技术上也支持[单点登录](../features/sso.md)，但部分功能可能无法按预期工作；完整 SSO 体验应采用其他部署方式。
