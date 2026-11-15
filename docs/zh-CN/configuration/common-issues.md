---
title: 常见问题
description: 常见问题与解决方法。
---

# 常见问题与解决方法 {#common-issues-and-their-solutions}

本页列出使用 Headplane 时可能遇到的问题及其处理方法。

## 无法登录 {#login-does-not-work}

::: tip
Headplane 会尝试检测配置错误，并在登录页显示警告。例如：

<figure>
  <img class="dark-only" src="../../assets/login-banner-dark.png" alt="登录警告横幅" />
  <img class="light-only" src="../../assets/login-banner-light.png" alt="登录警告横幅" />
  <figcaption>登录警告横幅（上游英文界面截图）</figcaption>
</figure>
:::

尝试登录却没有反应，可能是会话 Cookie 配置与访问方式不匹配。检查 Headplane 的 `server.cookie_secure`：

- 通过 HTTPS 访问：设为 `true`。
- 通过 HTTP 访问：设为 `false`。
