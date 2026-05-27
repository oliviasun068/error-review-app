import cors from 'cors'
import express from 'express'

const app = express()
const PORT = process.env.PORT || 10000
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash'

const MODULES = [
  '必修第一册',
  '必修第二册',
  '选择性必修第一册',
  '选择性必修第二册',
  '选择性必修第三册',
]

const ERROR_TYPES = [
  '概念不清',
  '计算错误',
  '思路偏差',
  '审题失误',
  '表达不规范',
  '知识盲区',
]

app.use(cors())
app.use(express.json({ limit: '25mb' }))

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.post('/api/analyze-error', async (req, res) => {
  try {
    const result = await analyzeProblem(req.body)
    res.json({ result })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error?.message || 'AI 分析失败' })
  }
})

function buildPrompt(questionText) {
  return `请分析下面这道高中数学错题，并只返回 JSON，不要输出 Markdown。

要求：
1. questionText 保留完整题目文本。数学公式尽量保留原符号，必要时使用 LaTeX。
2. module 必须从这些值里选一个：${MODULES.join('、')}。
3. errorTypes 只能从这些值里选：${ERROR_TYPES.join('、')}。
4. difficulty 是 1 到 5 的整数。
5. 不确定的字段用空字符串或空数组，不要编造。

返回 JSON 格式：
{
  "questionText": "完整题目文本",
  "module": "选择性必修第二册",
  "chapter": "4.1 导数",
  "knowledgePoints": ["导数", "切线"],
  "difficulty": 3,
  "errorTypes": ["审题失误"],
  "errorAnalysis": "",
  "correctSolution": ""
}

题目文本：
${questionText}`
}

function parseJsonContent(content) {
  const trimmed = content.trim()
  const withoutFence = trimmed
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim()

  return JSON.parse(withoutFence)
}

async function analyzeProblem(payload) {
  if (!process.env.DEEPSEEK_API_KEY) {
    throw new Error('服务端缺少 DEEPSEEK_API_KEY')
  }

  if (!payload?.questionText?.trim()) {
    if (payload?.imageBase64) {
      throw new Error('DeepSeek 官方 API 当前按文本接口接入，请先 OCR 出题目文字，或改用支持图片输入的视觉模型。')
    }
    throw new Error('请提供 questionText')
  }

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [
        {
          role: 'system',
          content: '你是高中数学错题整理助手，擅长把题目文本结构化为 JSON。',
        },
        {
          role: 'user',
          content: buildPrompt(payload.questionText),
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    }),
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('DeepSeek 返回为空')
  }

  return parseJsonContent(content)
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`AI backend listening on ${PORT}`)
})
