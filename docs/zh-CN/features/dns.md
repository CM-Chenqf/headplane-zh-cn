# 0.8 发布线的 DNS {#dns-on-the-08-release-line}

使用语言按钮切换英文与简体中文。DNS 页包括 Tailnet 基础域名、DNS 服务器、分域 DNS、自定义记录、搜索域及 Magic DNS。配置键和实际值不翻译。

## 前提条件 {#requirements}

读取需要可读的 Headscale 配置及原有网络读取权限；更改需要配置可写且具有网络写入权限。沿用本发布线的 [Docker](/zh-CN/install/docker#network-management)或[原生集成](/zh-CN/install/native-mode#network-management)配置。只读或权限受限页面仍不可编辑。

## 名称与记录 {#names-and-records}

重命名 Tailnet 可能影响现有设备访问。DNS 服务器需填写 IPv4 或 IPv6 地址，分域 DNS 另外填写域名后缀。重复服务器和记录提示跟随语言切换，不清空打开的表单。记录类型仍是 A/AAAA，IP 值保持原样；应填写与类型匹配的地址。外部记录文件继续使用原有挂载路径及重启行为。

## 搜索域与 Magic DNS {#search-domains-and-magic-dns}

启用 Magic DNS 后，Tailnet 域名位于首位。旧发布线的搜索域拖动仅改变本地预览顺序，不会保存排序到 Headscale；添加和移除仍提交原有操作。本次汉化不增加新的排序 API。

## 应用更改 {#applying-changes}

使用现有 Headscale 配置和集成钩子；0.8 不引入主分支的新重启流程或 DNS 校验规则。更改后检查 Headscale 服务状态。两种语言提交相同的 action ID、域名、IP 和记录类型。
