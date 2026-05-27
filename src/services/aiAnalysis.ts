/**
 * AI 题目识别服务
 *
 * App 端只调用自己的后端接口，API Key 不应放在手机包里。
 */

import Constants from 'expo-constants'
import * as FileSystem from 'expo-file-system'

export interface AnalysisResult {
  questionText: string
  module: string
  chapter: string
  knowledgePoints: string[]
  difficulty: number
  errorTypes: string[]
  errorAnalysis: string
  correctSolution: string
}

type AnalyzePayload = {
  questionText?: string
  imageBase64?: string
  imageMimeType?: string
}

function getAiApiUrl(): string {
  const url = Constants.expoConfig?.extra?.aiApiUrl
  return typeof url === 'string' ? url.trim() : ''
}

function normalizeAnalysisResult(raw: any, fallbackText = ''): AnalysisResult {
  const result = raw?.result ?? raw
  return {
    questionText: String(result?.questionText ?? result?.text ?? fallbackText ?? ''),
    module: String(result?.module ?? ''),
    chapter: String(result?.chapter ?? ''),
    knowledgePoints: Array.isArray(result?.knowledgePoints) ? result.knowledgePoints.map(String) : [],
    difficulty: Number(result?.difficulty ?? 1),
    errorTypes: Array.isArray(result?.errorTypes) ? result.errorTypes.map(String) : [],
    errorAnalysis: String(result?.errorAnalysis ?? ''),
    correctSolution: String(result?.correctSolution ?? ''),
  }
}

async function requestAiAnalysis(payload: AnalyzePayload): Promise<AnalysisResult> {
  const apiUrl = getAiApiUrl()
  if (!apiUrl) {
    throw new Error('尚未配置 AI 接口地址。请在 app.json 的 expo.extra.aiApiUrl 中填写你的后端接口。')
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `AI 接口请求失败：${response.status}`)
  }

  return normalizeAnalysisResult(await response.json(), payload.questionText)
}

function inferImageMimeType(imagePath: string): string {
  const lower = imagePath.toLowerCase()
  if (lower.includes('.png')) return 'image/png'
  if (lower.includes('.webp')) return 'image/webp'
  return 'image/jpeg'
}

// 常见数学关键词到模块的映射（简易规则）
const MODULE_KEYWORDS: Record<string, string[]> = {
  '必修第一册': ['集合', '常用逻辑用语', '不等式', '函数', '指数', '对数', '幂函数', '三角函数'],
  '必修第二册': ['平面向量', '复数', '立体几何', '统计', '概率'],
  '选择性必修第一册': ['空间向量', '直线', '圆', '圆锥曲线', '椭圆', '双曲线', '抛物线', '数列'],
  '选择性必修第二册': ['导数', '函数', '极值', '最值', '单调性', '计数原理', '排列', '组合', '二项式'],
  '选择性必修第三册': ['随机变量', '分布', '正态分布', '统计案例', '回归分析', '独立性检验'],
}

const CHAPTER_KEYWORDS: Record<string, Record<string, string[]>> = {
  '必修第一册': {
    '1.1 集合': ['集合', '交集', '并集', '补集', '子集'],
    '1.2 常用逻辑用语': ['命题', '充分条件', '必要条件', '全称量词', '存在量词'],
    '1.3 不等式': ['不等式', '均值不等式', '二次不等式', '分式不等式'],
    '1.4 函数概念与性质': ['函数', '定义域', '值域', '单调性', '奇偶性', '周期性'],
    '1.5 指数函数与对数函数': ['指数', '对数', '指数函数', '对数函数'],
    '1.6 三角函数': ['三角函数', '正弦', '余弦', '正切', '诱导公式'],
  },
  '必修第二册': {
    '2.1 平面向量': ['向量', '平面向量', '共线', '垂直', '数量积'],
    '2.2 复数': ['复数', '虚数', '实部', '虚部', '共轭'],
    '2.3 立体几何': ['立体几何', '空间', '平行', '垂直', '体积', '表面积'],
    '2.4 统计': ['统计', '抽样', '频率', '直方图', '平均数', '方差'],
    '2.5 概率': ['概率', '古典概型', '互斥', '独立'],
  },
  '选择性必修第一册': {
    '3.1 空间向量': ['空间向量', '法向量', '方向向量', '空间角'],
    '3.2 直线与圆': ['直线方程', '圆的方程', '直线与圆', '位置关系'],
    '3.3 圆锥曲线': ['椭圆', '双曲线', '抛物线', '离心率', '焦点', '准线'],
    '3.4 数列': ['数列', '等差数列', '等比数列', '通项', '求和'],
  },
  '选择性必修第二册': {
    '4.1 导数': ['导数', '导函数', '切线', '极值', '最值', '单调区间'],
    '4.2 计数原理': ['加法原理', '乘法原理', '排列', '组合', '二项式定理'],
  },
  '选择性必修第三册': {
    '5.1 随机变量': ['随机变量', '分布列', '期望', '方差'],
    '5.2 统计案例': ['回归分析', '独立性检验', '相关系数'],
  },
}

/**
 * 从文本中推测所属模块
 */
function guessModule(text: string): string {
  for (const [module, keywords] of Object.entries(MODULE_KEYWORDS)) {
    for (const kw of keywords) {
      if (text.includes(kw)) return module
    }
  }
  return '必修第一册' // 默认
}

/**
 * 从文本中推测所属章节
 */
function guessChapter(text: string, module: string): string {
  const chapters = CHAPTER_KEYWORDS[module] ?? {}
  for (const [chapter, keywords] of Object.entries(chapters)) {
    for (const kw of keywords) {
      if (text.includes(kw)) return chapter
    }
  }
  return ''
}

/**
 * 从文本中推测知识点
 */
function guessKnowledgePoints(text: string): string[] {
  const points: string[] = []
  const allKeywords = new Set<string>()

  for (const chapters of Object.values(CHAPTER_KEYWORDS)) {
    for (const keywords of Object.values(chapters)) {
      for (const kw of keywords) {
        if (text.includes(kw)) allKeywords.add(kw)
      }
    }
  }

  return Array.from(allKeywords).slice(0, 5)
}

/**
 * 从文本中推测难度等级
 */
function guessDifficulty(text: string): number {
  const words = text.length
  const hasComplexSymbols = /[∑∏∫√π∞∈∀∃∂∇]/.test(text)
  const hasMultipleSteps = (text.match(/步骤|解:|解答|证明/g) ?? []).length > 0

  if (words > 200 && hasComplexSymbols) return 5
  if (words > 100 || hasComplexSymbols) return 4
  if (words > 60 || hasMultipleSteps) return 3
  if (words > 30) return 2
  return 1
}

/**
 * 分析题目文本
 * 初期使用规则分析，后续可接入AI大模型
 */
export function analyzeProblemText(text: string): AnalysisResult {
  const module = guessModule(text)
  const chapter = guessChapter(text, module)
  const knowledgePoints = guessKnowledgePoints(text)
  const difficulty = guessDifficulty(text)

  return {
    questionText: text,
    module,
    chapter,
    knowledgePoints,
    difficulty,
    errorTypes: [],
    errorAnalysis: '',
    correctSolution: '',
  }
}

/**
 * 用 AI 分析文本题目；未配置接口时退回本地规则分析
 */
export async function analyzeProblemTextWithAI(text: string): Promise<AnalysisResult> {
  const apiUrl = getAiApiUrl()
  if (!apiUrl) {
    return analyzeProblemText(text)
  }

  return requestAiAnalysis({ questionText: text })
}

/**
 * 分析图片中的题目
 * 先用AI多模态API，fallback到OCR+规则
 */
export async function analyzeProblemImage(imagePath: string): Promise<AnalysisResult> {
  const imageBase64 = await FileSystem.readAsStringAsync(imagePath, {
    encoding: 'base64',
  })

  return requestAiAnalysis({
    imageBase64,
    imageMimeType: inferImageMimeType(imagePath),
  })
}
