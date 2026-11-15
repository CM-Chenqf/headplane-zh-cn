# 0.8 发布线的设置 {#settings-on-the-08-release-line}

设置、预授权密钥、认证限制及 Headplane Agent 已支持中英切换。原有权限、筛选、版本能力和请求字段保持不变。

## 预授权密钥 {#pre-auth-keys}

为 Headscale 用户创建密钥，或在支持时使用原有纯标签选项。自助账号仅可管理自己的用户。标签名、tag: 前缀、用户名及生成的命令保持原样。新密钥生成后立即复制；关闭后不可假定能再次找回完整值。

有效期以天输入（1–365,000），隐藏表单字段始终提交原始整数，不受语言分组符影响。“可重复使用”与“临时设备”是独立选项。使密钥过期将禁止它用于新设备认证，无法撤销。有效、已使用／已过期及纯标签筛选沿用旧版行为。

## 认证限制 {#authentication-restrictions}

OIDC 可按邮箱域名、用户组和用户限制认证。某类列表为空时，允许该类所有值。仍需原有读取 / 配置 IAM 权限及可写配置。身份和域名后缀保持原样，切换语言保留草稿并更新本地校验提示。参阅 [SSO](/zh-CN/features/sso) 和[代理认证](/zh-CN/features/proxy-auth)。

## Headplane Agent {#headplane-agent}

[Agent](/zh-CN/features/agent) 仍要求 Headscale 0.28+ 及 headscale.api_key。页面翻译未启用、等待批准、健康、同步时间与数量及错误状态。已知诊断附中文解释，未知错误和原始详情继续显示。切换语言不会触发同步。
