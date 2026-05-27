/**
 * 艾宾浩斯遗忘曲线复习服务
 *
 * 复习周期：1天 → 3天 → 7天 → 15天 → 30天
 * 答对：按周期推进
 * 答错：缩短间隔重试
 */

import { ErrorProblem } from './database'

// 标准复习间隔（天）
const REVIEW_INTERVALS = [1, 3, 7, 15, 30]

// 答错后的复习间隔（天）- 更短
const FAIL_INTERVALS = [0, 1, 3, 7, 15]

/**
 * 计算下次复习时间
 * @param reviewCount 已复习次数
 * @param isCorrect 本次是否答对
 * @returns 下次复习时间的 ISO 字符串
 */
export function calculateNextReview(
  reviewCount: number,
  isCorrect: boolean,
): string {
  let intervalDays: number

  if (isCorrect) {
    // 答对：按标准周期推进
    const index = Math.min(reviewCount, REVIEW_INTERVALS.length - 1)
    intervalDays = REVIEW_INTERVALS[index]
  } else {
    // 答错：缩短间隔
    const index = Math.min(reviewCount, FAIL_INTERVALS.length - 1)
    intervalDays = FAIL_INTERVALS[index]
  }

  const nextDate = new Date()
  nextDate.setDate(nextDate.getDate() + intervalDays)
  nextDate.setHours(21, 0, 0, 0) // 统一在21:00复习

  return nextDate.toISOString()
}

/**
 * 根据答对次数更新掌握程度
 */
export function calculateMastery(
  currentMastery: string,
  isCorrect: boolean,
  totalCorrect: number,
  totalAttempts: number,
): string {
  if (!isCorrect) {
    // 答错降级
    switch (currentMastery) {
      case '熟练': return '良好'
      case '良好': return '一般'
      case '一般': return '薄弱'
      case '薄弱': return '薄弱'
      default: return '薄弱'
    }
  }

  // 答对升级
  if (totalCorrect >= 2 || totalAttempts <= 1) return '熟练'
  if (totalCorrect >= 1) return '良好'
  return '一般'
}

/**
 * 获取今天待复习的错题（按优先级排序）
 */
export function getDailyReviewPriority(errors: ErrorProblem[]): ErrorProblem[] {
  const now = new Date()

  return errors
    .filter(e => e.reviewStatus === '待复习')
    .map(e => ({
      ...e,
      // 计算逾期天数（优先级指标）
      overdueDays: e.nextReviewAt
        ? Math.max(0, Math.floor(
            (now.getTime() - new Date(e.nextReviewAt).getTime()) / 86400000
          ))
        : 0,
    }))
    .sort((a, b) => {
      // 逾期越久优先级越高
      if ((a as any).overdueDays !== (b as any).overdueDays) {
        return (b as any).overdueDays - (a as any).overdueDays
      }
      // 复习次数越少优先级越高
      if (a.reviewCount !== b.reviewCount) {
        return a.reviewCount - b.reviewCount
      }
      // 按创建时间排序（越早的越优先）
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })
}

/**
 * 获取复习计划的文字描述
 */
export function getReviewPlanDescription(error: ErrorProblem): string {
  const intervals = REVIEW_INTERVALS
  const currentRound = Math.min(error.reviewCount, intervals.length)
  const totalRounds = intervals.length

  let status = ''
  if (error.reviewCount === 0) {
    status = '首次复习'
  } else if (error.reviewCount >= totalRounds) {
    status = '巩固复习'
  } else {
    status = `第 ${currentRound}/${totalRounds} 轮复习`
  }

  return status
}

/**
 * 获取复习截止时间描述
 */
export function getNextReviewDescription(error: ErrorProblem): string {
  if (!error.nextReviewAt) return '待安排'

  const now = new Date()
  const next = new Date(error.nextReviewAt)
  const diffMs = next.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / 86400000)

  if (diffDays < 0) return `逾期 ${Math.abs(diffDays)} 天`
  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '明天'
  return `${diffDays} 天后`
}
