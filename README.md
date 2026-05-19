# lark-cli-mcp-wrapper (Fixed Fork v1.1.0)

将 lark-cli 的 200+ 个命令封装为 MCP stdio server，让 Amazon Quick Desktop 等支持 MCP 的 AI 助手直接操作飞书/Lark。

> 这是基于 [ddpie/lark-cli-mcp-wrapper](https://github.com/ddpie/lark-cli-mcp-wrapper) 的修复版本。

## 修复内容 (v1.1.0)

### Bug: `--format json` 导致 12 个工具失效

**根因**: 原代码在 `tools.ts` 的 `executeTool()` 中对所有命令都添加 `--format json` 参数。但 lark-cli 的 shortcut 命令（以 `+` 开头，如 `docs +create`）中有一部分**不支持 `--format` flag**。传了未知 flag 后 lark-cli 直接打印 Usage 退出，用户传入的 `--title`、`--markdown` 等参数完全没被执行。

**修复**: shortcut 命令不再添加 `--format json`（它们默认输出就是 JSON）。

```diff
- const cliArgs = [def.service, def.command, "--format", "json"];
+ const isShortcut = def.command.startsWith("+");
+ const cliArgs = isShortcut
+   ? [def.service, def.command]
+   : [def.service, def.command, "--format", "json"];
```

### 受影响的工具 (12 个)

| 工具 | 功能 | 修复前 | 修复后 |
|------|------|--------|--------|
| lark_docs_create | 创建文档 | ❌ | ✅ |
| lark_docs_update | 更新文档 | ❌ | ✅ |
| lark_sheets_read | 读取表格 | ❌ | ✅ |
| lark_sheets_write | 写入表格 | ❌ | ✅ |
| lark_im_messages_send | 发送消息 | ❌ | ✅ |
| lark_mail_send | 发送邮件 | ❌ | ✅ |
| lark_base_data_query | Base 数据查询 | ❌ | ✅ |
| lark_base_base_get | 获取 Base | ❌ | ✅ |
| lark_base_record_batch_create | 批量创建记录 | ❌ | ✅ |
| lark_drive_download | 下载文件 | ❌ | ✅ |
| lark_drive_upload | 上传文件 | ❌ | ✅ |
| lark_invoke (meta) | 调用发现的工具 | ❌ | ✅ |

### 正常工作的工具 (13 个，无需修复)

| 工具 | 功能 |
|------|------|
| lark_calendar_agenda | 日程概览 |
| lark_calendar_freebusy | 查忙闲 |
| lark_calendar_create | 创建日程 |
| lark_calendar_room_find | 找会议室 |
| lark_contact_get_user | 获取用户信息 |
| lark_contact_search_user | 搜索用户 |
| lark_im_chat_list | 群列表 |
| lark_im_chat_search | 搜索群 |
| lark_im_chat_messages_list | 聊天记录 |
| lark_im_messages_search | 搜索消息 |
| lark_task_get_my_tasks | 我的任务 |
| lark_task_create | 创建任务 |
| lark_task_complete | 完成任务 |
| lark_base_record_search | 搜索记录 |
| lark_discover (meta) | 发现工具 |

### 需要额外权限 (3 个)

运行 `lark-cli auth login --scope "search:message search:docs:read"` 授权后可用：

- lark_im_messages_search — 需要 `search:message`
- lark_docs_search — 需要 `search:docs:read`
- lark_drive_search — 需要 `search:docs:read`

## 使用

### 从本地源码运行

```bash
cd /path/to/this/folder
npm install
npm run build
```

Amazon Quick Desktop 配置：

| 字段 | 值 |
|------|------|
| Connection type | Local |
| Name | Lark CLI MCP Wrapper (Fixed) |
| Command | node |
| Arguments | /path/to/dist/index.js |
| Timeout | 300 |

### 前置条件

```bash
npm install -g @larksuite/cli
lark-cli auth login --recommend
```

## 项目结构

```
src/
├── index.ts              # MCP server 入口
├── tools.ts              # 工具执行器 (已修复)
├── meta-tools.ts         # discover/invoke meta tools
├── catalog.ts            # 工具目录搜索
├── tier1.json            # 28 个高频工具名称
└── generated-tools.json  # 全部工具定义 (从 lark-cli 生成)
```

## 重新生成工具定义

lark-cli 升级后重新生成：

```bash
npm run generate-tools && npm run build
```

## License

MIT
