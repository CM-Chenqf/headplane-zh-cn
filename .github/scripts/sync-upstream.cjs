const { execFileSync } = require("node:child_process");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const ISSUE_MARKER = "<!-- headscale-web-upstream-sync -->";
const LABEL = "upstream-sync";

function watchedBranch(branch) {
  return branch === "main" || /^release\/\d+\.\d+$/.test(branch);
}

function reviewCategory(path) {
  if (path.startsWith("docs/") || /\.mdx?$/.test(path)) return "文档";
  if (path.startsWith("app/") || path.startsWith("cmd/hp_ssh/")) return "界面与提示";
  return "构建、兼容性与其他功能";
}

function syncBranchName(branch, sha) {
  if (!watchedBranch(branch) || !/^[a-f0-9]{40}$/.test(sha)) {
    throw new Error("Unexpected upstream branch or commit");
  }
  return `sync/upstream/${branch}/${sha.slice(0, 12)}`;
}

function filesForReview(paths) {
  const groups = new Map();
  for (const path of paths) {
    const category = reviewCategory(path);
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category).push(path);
  }

  return [...groups].map(([category, files]) => {
    const listed = files.slice(0, 80).map((file) => `- \`${file.replace(/`/g, "\\`")}\``);
    if (files.length > 80) listed.push(`- 另有 ${files.length - 80} 个文件，详见 Files changed。`);
    return `### ${category}\n\n${listed.join("\n")}`;
  }).join("\n\n");
}

function pullRequestBody(upstream, branch, sha, paths) {
  return [
    "同步上游功能后，需要检查本 PR 中的新增和变更文案，并补齐中文界面与中文文档。",
    `上游：${upstream}，分支：\`${branch}\`，提交：${sha}。`,
    `https://github.com/${upstream}/commit/${sha}`,
    "- [ ] 保留现有中英文切换和 fork 发布配置，解决合并冲突。\n" +
      "- [ ] 翻译新增英文，并复核已修改英文对应的中文。\n" +
      "- [ ] 同步中文文档、配置说明及需要更新的截图。\n" +
      "- [ ] 沿用上游兼容版本，运行构建及相关测试。\n" +
      "- [ ] 完成翻译验收后合并；不要仅为消除冲突而覆盖中文改动。",
    "本流程只检测更新并创建 PR，不自动合并、不复制版本标签、不发布镜像。" +
      "请检查 PR 的 Actions 状态；如果 GitHub 要求批准工作流运行，先在 PR 页面批准。",
    filesForReview(paths),
  ].join("\n\n");
}

function issueBody(upstream, pending) {
  return [
    ISSUE_MARKER,
    `上游 \`${upstream}\` 有待处理的更新。合并功能后仍需完成中文界面和文档复核。`,
    ...pending.map((item) => `- [ ] \`${item.branch}\` @ \`${item.sha.slice(0, 12)}\`：${item.message}`),
    "请使用普通 merge commit 合并同步 PR，以保留上游历史。不同上游提交的同步分支相互独立，" +
      "同一发布线可选择最新 PR 处理，再关闭已被它包含的旧 PR。",
    "此 Issue 在上游提交发生变化时追加提醒；定时检查不会自动完成翻译或发布。",
  ].join("\n\n");
}

function git(args, options = {}) {
  return execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 8 * 1024 * 1024,
    ...options,
  }).trim();
}

function hasCommit(base, upstream) {
  try {
    git(["merge-base", "--is-ancestor", upstream, base]);
    return true;
  } catch (error) {
    if (error.status === 1) return false;
    throw error;
  }
}

async function sync({ github, context, core }) {
  const config = JSON.parse(readFileSync(resolve(".github/upstream.json"), "utf8"));
  const { owner, repo } = context.repo;
  if (`${owner}/${repo}`.toLowerCase() !== config.downstream.toLowerCase()) {
    throw new Error("This workflow can only write to the configured downstream repository");
  }
  if (!/^[\w.-]+\/[\w.-]+$/.test(config.repository)) {
    throw new Error("Invalid upstream repository");
  }

  git([
    "fetch", "--no-tags", `https://github.com/${config.repository}.git`,
    "+refs/heads/main:refs/remotes/sync-source/main",
    "+refs/heads/release/*:refs/remotes/sync-source/release/*",
  ]);
  const branches = git([
    "for-each-ref", "--format=%(refname:strip=3)", "refs/remotes/sync-source/",
  ]).split("\n").filter(watchedBranch);

  try {
    await github.rest.issues.getLabel({ owner, repo, name: LABEL });
  } catch (error) {
    if (error.status !== 404) throw error;
    await github.rest.issues.createLabel({
      owner, repo, name: LABEL, color: "1D76DB", description: "Upstream updates and translation review",
    });
  }

  const pending = [];
  const failures = [];
  for (const branch of branches) {
    const sha = git(["rev-parse", `refs/remotes/sync-source/${branch}`]);
    try {
      let base;
      try {
        base = (await github.rest.repos.getBranch({ owner, repo, branch })).data.commit.sha;
      } catch (error) {
        if (error.status !== 404) throw error;
        pending.push({ branch, sha, message: "新的上游发布分支，需要先建立保留双语改动的对应分支。" });
        continue;
      }
      git(["fetch", "--no-tags", "origin", `refs/heads/${branch}`]);
      if (hasCommit(base, sha)) continue;

      const head = syncBranchName(branch, sha);
      const { data: pulls } = await github.rest.pulls.list({
        owner, repo, state: "all", base: branch, head: `${owner}:${head}`, per_page: 100,
      });
      // A squash merge lacks upstream ancestry, but its already merged PR still
      // records that this exact revision was reviewed. Never reopen a rejected PR.
      if (pulls.some((pull) => pull.merged_at)) continue;
      let pull = pulls.find((candidate) => candidate.state === "open");
      if (!pull && pulls.length > 0) {
        pending.push({ branch, sha, message: `之前的同步 PR 已关闭但未合并：${pulls[0].html_url}` });
        continue;
      }
      if (!pull) {
        // Immutable revision branches: no force-push, no tag import, and no
        // overwriting conflict resolutions made by a maintainer on an older PR.
        const remoteHead = git(["ls-remote", "--heads", "origin", `refs/heads/${head}`]);
        if (!remoteHead) git(["push", "origin", `${sha}:refs/heads/${head}`]);
        const changed = git(["diff", "--name-only", `${base}...${sha}`]).split("\n").filter(Boolean);
        pull = (await github.rest.pulls.create({
          owner, repo, base: branch, head,
          title: `chore(sync): ${branch} @ ${sha.slice(0, 12)}`,
          body: pullRequestBody(config.repository, branch, sha, changed),
        })).data;
        await github.rest.issues.addLabels({ owner, repo, issue_number: pull.number, labels: [LABEL] });
      }
      pending.push({ branch, sha, message: `同步与汉化检查：${pull.html_url}` });
    } catch (error) {
      const message = `处理 ${branch} 失败，请查看本次 Actions 日志。`;
      pending.push({ branch, sha, message });
      failures.push(`${branch}: ${error.message}`);
      core.error(`${branch}: ${error.message}`);
    }
  }

  const issues = await github.paginate(github.rest.issues.listForRepo, {
    owner, repo, state: "open", labels: LABEL, per_page: 100,
  });
  const tracking = issues.find((issue) => !issue.pull_request && issue.body?.includes(ISSUE_MARKER));
  if (pending.length > 0) {
    const body = issueBody(config.repository, pending);
    if (!tracking) {
      await github.rest.issues.create({
        owner, repo, title: "[上游同步] 待合并更新与汉化检查", body, labels: [LABEL],
        ...(config.assignee ? { assignees: [config.assignee] } : {}),
      });
    } else if (tracking.body !== body) {
      await github.rest.issues.update({ owner, repo, issue_number: tracking.number, body });
      await github.rest.issues.createComment({
        owner, repo, issue_number: tracking.number,
        body: "上游更新清单发生变化，请查看 Issue 顶部的同步 PR 和汉化检查项。",
      });
    }
    await core.summary.addRaw(body).write();
  } else {
    if (tracking) {
      await github.rest.issues.update({ owner, repo, issue_number: tracking.number, state: "closed" });
    }
    await core.summary.addRaw("所有已跟踪的上游分支均已同步。本次没有待处理更新。").write();
  }
  if (failures.length > 0) core.setFailed(failures.join("\n"));
}

module.exports = sync;
module.exports.watchedBranch = watchedBranch;
module.exports.reviewCategory = reviewCategory;
module.exports.syncBranchName = syncBranchName;
module.exports.pullRequestBody = pullRequestBody;
module.exports.issueBody = issueBody;
module.exports.hasCommit = hasCommit;
