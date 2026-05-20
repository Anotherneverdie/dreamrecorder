# 中式梦核记录器 · 今日部署上线指引

## 部署前自检（在 Mac 本地）

```bash
cd ~/Documents/dream-collector-lab
npm run build
npm run dev -- -H 127.0.0.1
```

浏览器打开 http://127.0.0.1:3000 ，完整走一遍流程并确认能生成 2 张图。

---

## 推荐方案：Zeabur 或 Railway（支持文件存储）

问卷数据保存在 `data/submissions.json`，生成的图片在 `public/generated/`。

**Vercel 免费版** 每次请求后磁盘会清空，**不适合**本项目的 JSON 文件存储。

### 方案 A：Zeabur（国内访问较快）

1. 注册 https://zeabur.com
2. 新建项目 → 导入 GitHub 仓库（需先把代码推到 GitHub）
3. 选择 **Next.js** 模板部署
4. 在「变量」中添加环境变量：

```
OPENAI_API_KEY=你的密钥
OPENAI_BASE_URL=https://api.siliconflow.cn/v1
IMAGE_MODEL=Kwai-Kolors/Kolors
IMAGE_SIZE=768x512
```

5. 部署完成后获得公网链接，发给用户填写
6. 研究员后台：`你的域名/admin`

### 方案 B：Railway（持久磁盘）

1. 注册 https://railway.app
2. New Project → Deploy from GitHub repo
3. 添加 Volume 挂载到 `/app/data` 和 `/app/public/generated`（按 Railway 文档配置）
4. 配置同上环境变量
5. 生成域名

### 方案 C：自己的云服务器（最稳妥）

适合今天就要给很多人用、且要长期保存数据。

```bash
# 在服务器上
git clone 你的仓库地址
cd dream-collector-lab
npm install
# 创建 .env.local 并填入 API 配置
npm run build
npm install -g pm2
pm2 start npm --name dreamrecorder -- start
pm2 save
```

用 Nginx 反代到 3000 端口，绑定域名 + HTTPS（可用宝塔面板简化）。

---

## 第一步：把代码推到 GitHub

在 Mac 终端：

```bash
cd ~/Documents/dream-collector-lab
git init   # 若还没有
git add .
git commit -m "中式梦核记录器 dreamrecorder 上线版"
```

在 github.com 新建仓库 `dreamrecorder`，然后：

```bash
git remote add origin https://github.com/你的用户名/dreamrecorder.git
git branch -M main
git push -u origin main
```

**注意：** `.env.local` 已在 `.gitignore` 中，不会上传密钥。

---

## 第二步：部署平台配置环境变量

| 变量名 | 值 |
|--------|-----|
| `OPENAI_API_KEY` | SiliconFlow 密钥 |
| `OPENAI_BASE_URL` | `https://api.siliconflow.cn/v1` |
| `IMAGE_MODEL` | `Kwai-Kolors/Kolors` |
| `IMAGE_SIZE` | `768x512` |

切勿勾选「公开」暴露密钥。

---

## 第三步：发给用户的链接

- 用户填写：`https://你的域名/`
- 你导出数据：`https://你的域名/admin` → 导出 JSON / CSV

建议定期导出备份；SiliconFlow 账户保持余额充足（约 ¥0.01/张 × 2）。

---

## 上线后每日运维

1. 打开 `/admin` 导出当日数据
2. 查看 SiliconFlow 余额
3. 若生成失败，检查错误是否为余额不足或模型停用

---

## 快速应急

| 问题 | 处理 |
|------|------|
| 余额不足 | SiliconFlow 充值 |
| 模型停用 | 改 `IMAGE_MODEL` 为 `Tongyi-MAI/Z-Image-Turbo` |
| 暂时无法生图 | `.env` 加 `IMAGE_DEMO_MODE=true` 使用占位图 |

---

## 联系用户的话术（可直接复制）

> 欢迎体验「中式梦核记录器 dreamrecorder」：填入你记忆中的关键词，AI 将为你生成 2 张独一无二的中式梦核照片，可保存分享。约 5–8 分钟。
