# 中文汉化说明 / Chinese Localization Notice

本分支是 [xob0t/Google-Photos-Toolkit](https://github.com/xob0t/Google-Photos-Toolkit) 的**简体中文界面汉化版**。

上游项目作者：**xob0t**（MIT License）。本分支仅做界面文案与运行时提示的翻译，**未修改任何业务逻辑与 API 调用**。

![界面对比：左为上游英文版，右为汉化版](media/demo-zh.png)

<sub>汉化版界面截图。上游英文版见 [media/demo-en.png](media/demo-en.png)。</sub>

## 汉化内容

| 范围 | 说明 |
|---|---|
| 主界面 | 步骤标题、7 个来源选项、约 20 个筛选器、14 个操作按钮、日志区、页脚 |
| 动态文案 | 筛选条件实时预览描述、参数校验错误提示 |
| 运行时提示 | 全部日志输出、操作前确认弹窗、按钮悬浮提示 |
| 文档 | README |

**刻意保留英文的部分**（避免破坏兼容性）：

- CSV 导出的表头字段名（`mediaKey`、`dedupKey`、`sizeBytes` 等），供下游脚本解析
- 浏览器控制台里的调试信息（`console.error`）
- 内部 RPC 标识符

**刻意保留原作者署名的部分**：

- 脚本元数据 `@author xob0t`、`@namespace` 与 `@icon` 仍指向上游，以符合 MIT 许可要求并表明衍生关系
- 已改动的是 `@homepageURL` 与 `@supportURL`，现指向本仓库的中文说明页与 issue 区，避免中文用户被引到英文页面


## 安装

1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 用户脚本管理器
   - Android 上推荐 [Firefox](https://www.mozilla.org/firefox/browsers/mobile/android/)，它支持 Tampermonkey
2. 从本分支的 [Releases](https://github.com/yihuochejialao/Google-Photos-Toolkit/releases) 下载 `google_photos_toolkit.user.js`
   - 或手动构建，见下方
3. 打开 <https://photos.google.com>，点击工具栏的 GPTK 按钮

> **提示**：请勿同时安装上游英文版与本汉化版，两者会冲突（同一 `@match` 范围、同一 DOM 挂载点）。

## 从源码构建

```bash
git clone -b cn-hans https://github.com/yihuochejialao/Google-Photos-Toolkit.git
cd Google-Photos-Toolkit
pnpm install
pnpm test        # 单元测试
pnpm run build   # 产出 google_photos_toolkit.user.js
```

## 与上游的同步

本分支基于上游 `main`（v3.3.0）汉化。上游更新后，可这样同步并重新应用汉化：

```bash
git remote add upstream https://github.com/xob0t/Google-Photos-Toolkit.git
git fetch upstream
git rebase upstream/main
# 然后重新对照 src/ 下的文案差异，把汉化改动重放一遍
```

由于汉化只涉及字符串字面量，冲突面很小，通常只需重新处理 `src/ui/markup/` 与各 `log()` 调用点。

## 免责声明

本项目通过调用 Google 相册**未公开的 Web API** 工作，接口随时可能变更导致失效。原作者与本汉化版均不对由此产生的任何数据损失承担责任。请在使用「移到回收站」「按文件名改日期」等破坏性操作前自行确认。
