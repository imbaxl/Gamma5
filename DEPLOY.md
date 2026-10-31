# 问芽在线部署方案

推荐使用 Railway 的 Dockerfile 部署，并为 `/app/data` 挂载持久化 Volume。这样网页仍使用现有的本地 JSON 数据结构，服务重新部署后学习记录也不会消失。

## Railway

1. 把项目上传到一个私有 GitHub 仓库。`.gitignore` 已排除本地学习数据，不会把题目截图一并提交。
2. 在 Railway 新建项目，选择 **Deploy from GitHub repo** 并选中该仓库。Railway 会自动识别根目录的 `Dockerfile`。
3. 为服务添加 Volume，挂载路径填写 `/app/data`。
4. 添加环境变量：

   - `HOST=0.0.0.0`
   - `DATA_DIR=/app/data`
   - `AUTH_USER=wenya`
   - `AUTH_PASSWORD=一个足够长的私密密码`

5. 在服务的 Networking 设置中生成 HTTPS 域名。打开该域名后，浏览器会先要求输入上面的用户名和密码。

首次上线前，把本地 `data/days` 中需要保留的 JSON 文件导入 Volume。此后应定期备份 `/app/data/days`。

## 自有服务器上的 Docker

```bash
docker build -t wenya .
docker run -d --name wenya --restart unless-stopped \
  -p 3210:3210 \
  -v /srv/wenya-data:/app/data \
  -e AUTH_USER=wenya \
  -e AUTH_PASSWORD='替换为私密密码' \
  wenya
```

再使用 Caddy、Nginx 或服务器面板把 HTTPS 域名反向代理到 `127.0.0.1:3210`。不要在公网部署时省略访问密码：题目、笔记和截图都属于私人学习数据。
