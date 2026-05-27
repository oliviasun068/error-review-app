/**
 * 数据库服务 - SQLite 替代飞书多维表格
 *
 * 字段结构完全对应飞书错题集0408的15个字段
 */

import * as SQLite from 'expo-sqlite'
import * as FileSystem from 'expo-file-system'

const DB_NAME = 'error_review.db'

// ============ 类型定义 ============

export interface ErrorProblem {
  id: number
  errorId: string // CT-YYYYMMDD-XXX
  imagePath: string | null
  questionText: string
  module: string    // 必修1-2/选必1-3
  chapter: string
  knowledgePoints: string // JSON array
  difficulty: number // 1-5
  errorTypes: string  // JSON array
  errorAnalysis: string
  correctSolution: string
  createdAt: string
  reviewStatus: '待复习' | '已复习' | '已掌握'
  nextReviewAt: string | null
  reviewCount: number
  mastery: '未评估' | '薄弱' | '一般' | '良好' | '熟练'
}

export interface ReviewRecord {
  id: number
  errorId: string
  reviewedAt: string
  isCorrect: boolean
  userAnswer: string
  masteryBefore: string
  masteryAfter: string
}

export interface StudyStats {
  totalErrors: number
  pendingReview: number
  mastered: number
  weakAreas: { module: string; count: number }[]
  todayReviewCount: number
  streakDays: number
}

// ============ 模块常量 ============

export const MODULES = [
  '必修第一册',
  '必修第二册',
  '选择性必修第一册',
  '选择性必修第二册',
  '选择性必修第三册',
]

export const DIFFICULTY_LABELS = ['⭐', '⭐⭐', '⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐⭐⭐']

export const ERROR_TYPES = [
  '概念不清',
  '计算错误',
  '思路偏差',
  '审题失误',
  '表达不规范',
  '知识盲区',
]

export const MASTERY_LEVELS = ['未评估', '薄弱', '一般', '良好', '熟练']

// ============ 数据库操作 ============

let db: SQLite.SQLiteDatabase | null = null

export async function initDatabase(): Promise<void> {
  db = await SQLite.openDatabaseAsync(DB_NAME)

  // 创建错题表
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS error_problems (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      errorId TEXT UNIQUE NOT NULL,
      imagePath TEXT,
      questionText TEXT NOT NULL DEFAULT '',
      module TEXT DEFAULT '',
      chapter TEXT DEFAULT '',
      knowledgePoints TEXT DEFAULT '[]',
      difficulty INTEGER DEFAULT 1,
      errorTypes TEXT DEFAULT '[]',
      errorAnalysis TEXT DEFAULT '',
      correctSolution TEXT DEFAULT '',
      createdAt TEXT NOT NULL,
      reviewStatus TEXT DEFAULT '待复习',
      nextReviewAt TEXT,
      reviewCount INTEGER DEFAULT 0,
      mastery TEXT DEFAULT '未评估'
    )
  `)

  // 创建复习记录表
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS review_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      errorId TEXT NOT NULL,
      reviewedAt TEXT NOT NULL,
      isCorrect INTEGER NOT NULL DEFAULT 0,
      userAnswer TEXT DEFAULT '',
      masteryBefore TEXT DEFAULT '',
      masteryAfter TEXT DEFAULT '',
      FOREIGN KEY (errorId) REFERENCES error_problems(errorId)
    )
  `)

  // 创建设置表
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `)

  // 创建索引
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_error_review_status ON error_problems(reviewStatus);
    CREATE INDEX IF NOT EXISTS idx_error_next_review ON error_problems(nextReviewAt);
    CREATE INDEX IF NOT EXISTS idx_error_module ON error_problems(module);
    CREATE INDEX IF NOT EXISTS idx_review_records_error ON review_records(errorId);
  `)
}

function getDb(): SQLite.SQLiteDatabase {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.')
  return db
}

// ============ 生成错题ID ============

async function generateErrorId(): Promise<string> {
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
  const prefix = `CT-${dateStr}-`

  const result = await getDb().getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM error_problems WHERE errorId LIKE ?`,
    `${prefix}%`
  )
  const count = (result?.count ?? 0) + 1
  return `${prefix}${String(count).padStart(3, '0')}`
}

// ============ CRUD 操作 ============

export async function addErrorProblem(problem: Omit<ErrorProblem, 'id' | 'errorId' | 'createdAt' | 'reviewStatus' | 'nextReviewAt' | 'reviewCount' | 'mastery'>): Promise<string> {
  const errorId = await generateErrorId()
  const now = new Date().toISOString()
  const nextReview = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 1天后第一次复习

  await getDb().runAsync(
    `INSERT INTO error_problems (errorId, imagePath, questionText, module, chapter, knowledgePoints,
      difficulty, errorTypes, errorAnalysis, correctSolution, createdAt, reviewStatus, nextReviewAt, reviewCount, mastery)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '待复习', ?, 0, '未评估')`,
    [
      errorId,
      problem.imagePath ?? null,
      problem.questionText,
      problem.module ?? '',
      problem.chapter ?? '',
      problem.knowledgePoints ?? '[]',
      problem.difficulty ?? 1,
      problem.errorTypes ?? '[]',
      problem.errorAnalysis ?? '',
      problem.correctSolution ?? '',
      now,
      nextReview,
    ]
  )

  return errorId
}

export async function getAllErrors(): Promise<ErrorProblem[]> {
  const rows = await getDb().getAllAsync<ErrorProblem>(
    'SELECT * FROM error_problems ORDER BY createdAt DESC'
  )
  return rows
}

export async function getErrorsByStatus(status: string): Promise<ErrorProblem[]> {
  const rows = await getDb().getAllAsync<ErrorProblem>(
    'SELECT * FROM error_problems WHERE reviewStatus = ? ORDER BY nextReviewAt ASC',
    status
  )
  return rows
}

export async function getPendingReviewErrors(limit: number = 10): Promise<ErrorProblem[]> {
  const now = new Date().toISOString()
  const rows = await getDb().getAllAsync<ErrorProblem>(
    `SELECT * FROM error_problems
     WHERE reviewStatus = '待复习' AND (nextReviewAt IS NULL OR nextReviewAt <= ?)
     ORDER BY nextReviewAt ASC
     LIMIT ?`,
    now,
    limit
  )
  return rows
}

export async function getErrorById(errorId: string): Promise<ErrorProblem | null> {
  const row = await getDb().getFirstAsync<ErrorProblem>(
    'SELECT * FROM error_problems WHERE errorId = ?',
    errorId
  )
  return row ?? null
}

export async function updateErrorProblem(errorId: string, updates: Partial<ErrorProblem>): Promise<void> {
  const fields = Object.keys(updates).filter(k => k !== 'id' && k !== 'errorId')
  if (fields.length === 0) return

  const setClause = fields.map(f => `${f} = ?`).join(', ')
  const values = fields.map(f => (updates as any)[f])

  await getDb().runAsync(
    `UPDATE error_problems SET ${setClause} WHERE errorId = ?`,
    ...values,
    errorId
  )
}

export async function deleteErrorProblem(errorId: string): Promise<void> {
  await getDb().runAsync('DELETE FROM review_records WHERE errorId = ?', errorId)
  await getDb().runAsync('DELETE FROM error_problems WHERE errorId = ?', errorId)
}

export async function searchErrors(keyword: string): Promise<ErrorProblem[]> {
  const like = `%${keyword}%`
  const rows = await getDb().getAllAsync<ErrorProblem>(
    `SELECT * FROM error_problems
     WHERE questionText LIKE ? OR module LIKE ? OR chapter LIKE ? OR knowledgePoints LIKE ?
     ORDER BY createdAt DESC`,
    like, like, like, like
  )
  return rows
}

// ============ 复习记录 ============

export async function addReviewRecord(
  errorId: string,
  isCorrect: boolean,
  userAnswer: string,
  masteryBefore: string,
  masteryAfter: string
): Promise<void> {
  const now = new Date().toISOString()
  await getDb().runAsync(
    `INSERT INTO review_records (errorId, reviewedAt, isCorrect, userAnswer, masteryBefore, masteryAfter)
     VALUES (?, ?, ?, ?, ?, ?)`,
    errorId,
    now,
    isCorrect ? 1 : 0,
    userAnswer,
    masteryBefore,
    masteryAfter
  )
}

export async function getReviewRecords(errorId: string): Promise<ReviewRecord[]> {
  const rows = await getDb().getAllAsync<ReviewRecord>(
    'SELECT * FROM review_records WHERE errorId = ? ORDER BY reviewedAt DESC',
    errorId
  )
  return rows
}

// ============ 统计 ============

export async function getStudyStats(): Promise<StudyStats> {
  // 总数
  const totalResult = await getDb().getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM error_problems'
  )

  // 待复习
  const pendingResult = await getDb().getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM error_problems WHERE reviewStatus = '待复习'"
  )

  // 已掌握
  const masteredResult = await getDb().getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM error_problems WHERE reviewStatus = '已掌握'"
  )

  // 薄弱模块
  const weakResult = await getDb().getAllAsync<{ module: string; count: number }>(
    "SELECT module, COUNT(*) as count FROM error_problems WHERE reviewStatus != '已掌握' GROUP BY module ORDER BY count DESC"
  )

  // 今日复习数
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString()
  const todayResult = await getDb().getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM review_records WHERE reviewedAt >= ?',
    todayStr
  )

  return {
    totalErrors: totalResult?.count ?? 0,
    pendingReview: pendingResult?.count ?? 0,
    mastered: masteredResult?.count ?? 0,
    weakAreas: weakResult ?? [],
    todayReviewCount: todayResult?.count ?? 0,
    streakDays: await calculateStreak(),
  }
}

async function calculateStreak(): Promise<number> {
  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < 365; i++) {
    const day = new Date(today.getTime() - i * 86400000)
    const nextDay = new Date(day.getTime() + 86400000)
    const dayStr = day.toISOString()
    const nextDayStr = nextDay.toISOString()

    const result = await getDb().getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM review_records WHERE reviewedAt >= ? AND reviewedAt < ?',
      dayStr,
      nextDayStr
    )

    if ((result?.count ?? 0) > 0) {
      streak++
    } else if (i > 0) {
      break
    }
  }

  return streak
}

// ============ 设置 ============

export async function setSetting(key: string, value: string): Promise<void> {
  await getDb().runAsync(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    key,
    value
  )
}

export async function getSetting(key: string, defaultValue: string = ''): Promise<string> {
  const result = await getDb().getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    key
  )
  return result?.value ?? defaultValue
}

// ============ 搜索记录 ============

export async function searchAllErrors(keyword: string): Promise<ErrorProblem[]> {
  const like = `%${keyword}%`
  const rows = await getDb().getAllAsync<ErrorProblem>(
    `SELECT * FROM error_problems
     WHERE questionText LIKE ? OR module LIKE ? OR chapter LIKE ? OR knowledgePoints LIKE ? OR errorAnalysis LIKE ?
     ORDER BY createdAt DESC`,
    like, like, like, like, like
  )
  return rows
}
