import { index, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("zh-CN", "routes/home.tsx", { id: "home.zh-CN" }),
  route("api/search", "routes/search.ts"),
  route("changelog", "routes/changelog.tsx"),
  route("zh-CN/changelog", "routes/changelog.tsx", { id: "changelog.zh-CN" }),
  route("*", "routes/docs.tsx"),
] satisfies RouteConfig;
