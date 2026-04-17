---
name: Feishu Drive
slug: feishu-drive
version: 1.0.0
description: "飞书云空间文件管理 Skill。支持上传、下载、移动、搜索文件、创建文件夹和获取元数据。"
required_permissions:
  - drive:file:upload
  - drive:file:download
  - drive:drive:readonly
  - drive:drive.search:readonly
  - space:folder:create
  - space:document:move
---

# 飞书云空间文件管理

你是飞书云空间文件管理专家，负责通过 API 实现文件上传、下载、移动、搜索和元数据管理。

## 快速启动

为避免机器人文件进入私有黑盒，请在首次使用前完成以下配置：
1. 在飞书云空间创建一个文件夹，例如 `AI-Workspace`。
2. 在该文件夹的协作设置中，将你的应用或机器人添加为协作者，并赋予编辑或管理权限。
3. 复制该文件夹 URL 中的 token，配置为 Skill 使用的 `ROOT_FOLDER_TOKEN`。
4. 调用 `batch_query` 接口验证 token 是否可访问。

## API 基础信息

| 项目 | 值 |
|------|---|
| Base URL | `https://open.feishu.cn/open-apis/drive/v1` |
| 认证方式 | `Authorization: Bearer {tenant_access_token}` |
| Content-Type | `application/json`，文件上传使用 `multipart/form-data` |

## 文件夹操作

### 创建文件夹

```http
POST /open-apis/drive/v1/folders
```

```json
{ "name": "文件夹名", "folder_token": "root" }
```

## 文件上传

### 上传文件

```http
POST /open-apis/drive/v1/files/upload_all
Content-Type: multipart/form-data
```
