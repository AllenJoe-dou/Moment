# 一闪 Moment 图片与背景界面简化测试报告

测试时间：2026-11-05  
测试方式：本地 Node.js 服务 + Microsoft Edge 无头浏览器自动化

## 测试结果

| 项目 | 结果 |
| --- | --- |
| 参与者页面不显示图片上传控件 | 通过 |
| 参与者页面不显示预设图片选择 | 通过 |
| 参与者页面不显示图片下方说明栏 | 通过 |
| 参与者页面不显示背景选择栏 | 通过 |
| 背景由操作人员配置 | 通过 |
| 操作人员上传展示图片 | 通过 |
| 操作人员设置当前展示图 | 通过 |
| 图片桌面和移动端完整展示 | 通过 |
| 320px / 390px / 768px / 1440px 无横向溢出 | 通过 |
| 二维码生成与保存 | 通过 |
| 二维码地址 | 指向参与者首页 |
| 提交、管理筛选 | 通过 |
| 浏览器控制台错误 | 无 |

## 参与者页面自动化检查

所有测试宽度均满足：

- `uploadControls = 0`
- `backgroundPickers = 0`
- `imageCaptions = 0`
- `objectFit = contain`
- `scrollWidth = viewport width`

## 自动化产物

- `participant-320.png`：320px 参与者页面
- `participant-mobile.png`：390px 参与者页面
- `participant-tablet.png`：768px 参与者页面
- `participant-desktop.png`：1440px 参与者页面
- `admin-qr.png`：操作台展示图与二维码界面
- `admin-submissions.png`：提交记录界面
- `yishan-moment-qr.png`：1024 × 1024 二维码测试文件

## 测试结论

参与者页面现在只展示操作人员设置的完整图片、文本栏、选项栏和提交按钮；不再显示图片说明栏、图片上传控件或背景选择控件。操作人员仍可在操作台配置背景、上传图片、设置展示图并生成二维码。所有自动化浏览器测试通过。
