# 一闪 Moment

“一闪 Moment”是一个液态玻璃风格的互动提交页面。操作人员可以配置图片、背景、文本栏和选项栏；参与者可以上传图片、选择预设图片、选择选项并填写文字；提交后，操作人员可以在 `/admin` 查看和导出记录。

## 功能

- 动态液态玻璃背景
- 粉色梅花飘落背景
- 蓝紫流光、暖金夕阳、深海气泡三种备用背景
- 图片拖拽/点击上传
- 预设图片选择
- 可配置文本栏
- 单选和多选选项栏
- 提交校验与成功反馈
- 提交记录查看、关键词筛选、详情展开
- 提交记录 CSV 导出
- 可视化页面配置
- 桌面端和移动端响应式布局

## 本地运行

要求：Node.js 20 或更高版本。

```bash
npm install
npm start
```

打开：

- 参与者页面：`http://localhost:3000`
- 提交记录：`http://localhost:3000/admin`
- 页面配置：`http://localhost:3000/admin/edit`

## 测试

```bash
npm test
```

测试覆盖数据存储、提交校验、上传 API、提交 API、CSV 导出和页面结构。

## 页面配置

访问 `http://localhost:3000/admin/edit`，可以修改：

- 页面标题和说明
- 默认背景
- 是否强制选择图片
- 预设图片名称、地址和顺序
- 文本栏标题、占位文字、最大字数、是否必填
- 选项栏标题、单选/多选、选项内容、是否必填
- 字段和图片的上移、下移、删除

保存后，参与者页面会立即使用新配置。

## 提交数据

演示版使用本地 JSON 文件：

- `data/config.json`：页面配置
- `data/submissions.json`：提交记录
- `uploads/`：参与者和操作人员上传的图片

演示版适合本地体验和小规模测试。Railway 的免费/临时文件系统可能在重新部署或实例重启后重置上传文件和运行数据；正式生产环境建议后续迁移至 PostgreSQL 和云对象存储。

## 部署到 Railway

### 1. 推送到 GitHub

在项目目录执行：

```bash
git init
git add .
git commit -m "feat: add yishan moment"
git branch -M main
git remote add origin https://github.com/你的用户名/你的仓库名.git
git push -u origin main
```

如果你使用本项目已有 Git 历史，可直接推送当前分支：

```bash
git push -u origin codex/yishan-moment
```

### 2. 创建 Railway 项目

1. 打开 [Railway](https://railway.app/)。
2. 点击 **New Project**。
3. 选择 **Deploy from GitHub repo**。
4. 授权并选择本仓库。
5. Railway 会自动识别 Node.js 项目。

### 3. 启动配置

项目已包含：

- `package.json` 中的 `npm start`
- `Procfile` 中的 `web: npm start`
- `railway.json` 中的启动命令和健康检查

Railway 默认提供 `PORT` 环境变量，服务会自动监听：

```js
const port = Number(process.env.PORT) || 3000;
```

无需手动添加端口设置。

### 4. 可选环境变量

| 变量 | 作用 | 默认值 |
| --- | --- | --- |
| `PORT` | 服务端口 | `3000` |
| `YISHAN_DATA_DIR` | JSON 数据目录 | 项目内 `data/` |
| `YISHAN_UPLOADS_DIR` | 上传图片目录 | 项目内 `uploads/` |

部署完成后：

- 参与者页面：Railway 提供的根域名
- 管理页面：`https://你的域名/admin`
- 配置页面：`https://你的域名/admin/edit`

## 目录结构

```text
.
├── data/
│   ├── config.json
│   └── submissions.json
├── public/
│   ├── admin-edit.html
│   ├── admin-edit.js
│   ├── admin.css
│   ├── admin.html
│   ├── admin.js
│   ├── app.js
│   ├── backgrounds.js
│   ├── index.html
│   ├── presets/
│   └── styles.css
├── lib/
│   ├── store.js
│   └── validate.js
├── tests/
├── uploads/
├── server.js
├── package.json
├── Procfile
└── railway.json
```

## 后续升级建议

- 接入 Railway PostgreSQL，持久化配置和提交记录。
- 接入 S3/R2/Cloudinary，持久化上传图片。
- 增加管理员认证，保护 `/admin` 与 `/admin/edit`。
- 增加提交通知、批量删除、标签统计和高级筛选。
