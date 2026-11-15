---
title: 简介
description: Headplane 与 Headscale 是什么？
---

# Headplane 与 Headscale 是什么？ {#what-is-headplane-and-headscale}

Headplane 是 Headscale 的 Web 管理界面，为它补充 VPN 网络管理功能。Headscale 是 Tailscale 控制服务器的自托管实现，可配合 Tailscale 客户端创建并管理专用 VPN 网络。

<figure>
  <img class="dark-only" src=".././assets/preview-dark.png" alt="Headplane 管理面板" />
  <img class="light-only" src=".././assets/preview-light.png" alt="Headplane 管理面板" />
  <figcaption>Headplane 管理面板（上游英文界面截图）</figcaption>
</figure>

Headscale 默认不附带 Web 界面，Headplane 则提供用于管理 Headscale 实例的完整界面，可以管理设备、网络和 ACL。

除了基本管理，还支持浏览器远程 SSH、基于 OpenID Connect（OIDC）的单点登录（SSO），以及 Tailnet 配置与状态详情。DNS 管理、ACL 编辑和 Headscale 配置均可在界面中完成。

<figure>
  <img class="dark-only" src=".././assets/dns-dark.png" alt="Headplane DNS 管理" />
  <img class="light-only" src=".././assets/dns-light.png" alt="Headplane DNS 管理" />
  <figcaption>Headplane DNS 管理（上游英文界面截图）</figcaption>
</figure>

Headplane 参考官方 Tailscale 产品及管理面板提供的功能，主要包括：

- 设备管理：密钥过期、网络路由、设备名称和所有者。
- 用于访问控制的 ACL 和标签配置。
- 使用 OpenID Connect（OIDC）提供商登录。
- 编辑 DNS 设置并自动配置 Headscale。
- 管理 Headscale 设置。

<figure>
  <img class="dark-only" src=".././assets/machine-dark.png" alt="Headplane 设备管理" />
  <img class="light-only" src=".././assets/machine-light.png" alt="Headplane 设备管理" />
  <figcaption>Headplane 设备管理（上游英文界面截图）</figcaption>
</figure>

::: info 社区维护版本
本仓库是 [tale/headplane](https://github.com/tale/headplane) 的非官方中英双语 fork，不是官方中文版，也不隶属于 Tailscale 或 Headscale。原作者版权和 MIT 许可证保持不变。
:::
