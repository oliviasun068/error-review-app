# Render 后端部署说明

这个后端用于给 App 提供 DeepSeek 文本分析接口。API Key 保存在 Render 环境变量里，不会打进安卓 App。

注意：DeepSeek 官方 API 当前按文本 `/chat/completions` 接入。拍照图片如果要自动识别文字，需要先接 OCR 服务，或改用支持图片输入的视觉模型。

## Render 设置

1. 把项目推到 GitHub。
2. 在 Render 新建 `Web Service`，连接这个仓库。
3. `Root Directory` 填：

```text
api-render
```

4. `Build Command` 填：

```bash
npm install
```

5. `Start Command` 填：

```bash
npm start
```

6. 在 `Environment` / `Secrets and variables` 里添加：

```text
DEEPSEEK_API_KEY=你的 DeepSeek API Key
DEEPSEEK_MODEL=deepseek-v4-flash
```

部署完成后，Render 会给你一个地址，例如：

```text
https://error-review-ai.onrender.com
```

App 里要填完整接口地址：

```json
"extra": {
  "aiApiUrl": "https://error-review-ai.onrender.com/api/analyze-error"
}
```

改完 `app.json` 后重新启动 Expo：

```bash
npx expo start --tunnel --clear
```

## 测试接口

```bash
curl -X POST https://error-review-ai.onrender.com/api/analyze-error \
  -H "Content-Type: application/json" \
  -d '{"questionText":"已知函数 f(x)=ln x + sin x，求导函数。"}'
```

健康检查：

```text
https://error-review-ai.onrender.com/health
```
