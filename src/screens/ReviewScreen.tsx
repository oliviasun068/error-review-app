/**
 * 复习页 - 错题复习流程
 *
 * 流程：展示题目 → 用户作答 → 核对答案 → 标记掌握程度
 * 艾宾浩斯曲线自动计算下次复习时间
 */

import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native'
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'

type TabParamList = {
  Home: undefined
}

type Nav = BottomTabNavigationProp<TabParamList>
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../utils/theme'
import { Card } from '../components/Card'
import {
  ErrorProblem,
  getPendingReviewErrors,
  getErrorById,
  updateErrorProblem,
  addReviewRecord,
  getReviewRecords,
  ReviewRecord,
} from '../services/database'
import { calculateNextReview, calculateMastery, getReviewPlanDescription } from '../services/ebbinghaus'

type ReviewPhase = 'question' | 'answer' | 'result' | 'done'

export default function ReviewScreen() {
  const navigation = useNavigation<Nav>()
  const route = useRoute<any>()
  const specificErrorId = route.params?.errorId

  const [errors, setErrors] = useState<ErrorProblem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [phase, setPhase] = useState<ReviewPhase>('question')
  const [userAnswer, setUserAnswer] = useState('')
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState<ReviewRecord[]>([])

  const currentError = errors[currentIndex]
  const totalCount = errors.length

  useFocusEffect(
    useCallback(() => {
      async function init() {
        setLoading(true)
        if (specificErrorId) {
          const error = await getErrorById(specificErrorId)
          if (error) {
            setErrors([error])
            const recs = await getReviewRecords(specificErrorId)
            setRecords(recs)
          }
        } else {
          const pending = await getPendingReviewErrors(10)
          setErrors(pending)
        }
        setLoading(false)
      }
      init()
    }, [specificErrorId])
  )

  function handleShowAnswer() {
    setPhase('answer')
  }

  function handleMarkResult(correct: boolean) {
    setIsCorrect(correct)
    setPhase('result')
  }

  async function handleConfirmResult() {
    if (!currentError || isCorrect === null) return

    const now = new Date().toISOString()
    const totalCorrect = records.filter(r => r.isCorrect).length + (isCorrect ? 1 : 0)
    const totalAttempts = records.length + 1
    const newMastery = calculateMastery(
      currentError.mastery,
      isCorrect,
      totalCorrect,
      totalAttempts,
    )
    const nextReviewAt = calculateNextReview(
      currentError.reviewCount,
      isCorrect,
    )
    const newReviewCount = currentError.reviewCount + 1
    const newStatus = newMastery === '熟练' ? '已掌握' : '待复习'

    // 保存复习记录
    await addReviewRecord(
      currentError.errorId,
      isCorrect,
      userAnswer.trim(),
      currentError.mastery,
      newMastery,
    )

    // 更新错题状态
    await updateErrorProblem(currentError.errorId, {
      reviewStatus: newStatus as any,
      nextReviewAt,
      reviewCount: newReviewCount,
      mastery: newMastery as any,
    })

    // 下一题
    if (currentIndex < totalCount - 1) {
      setCurrentIndex(currentIndex + 1)
      setPhase('question')
      setUserAnswer('')
      setIsCorrect(null)
    } else {
      setPhase('done')
    }
  }

  function handleFinish() {
    navigation.navigate('Home')
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    )
  }

  if (totalCount === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>🎉</Text>
        <Text style={styles.emptyTitle}>暂无待复习错题</Text>
        <Text style={styles.emptyDesc}>今天没有需要复习的错题，继续保持！</Text>
        <TouchableOpacity style={styles.backBtn} onPress={handleFinish}>
          <Text style={styles.backBtnText}>回首页</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (phase === 'done') {
    return (
      <View style={styles.center}>
        <Text style={styles.doneIcon}>🎊</Text>
        <Text style={styles.doneTitle}>本次复习完成！</Text>
        <Text style={styles.doneDesc}>共完成 {totalCount} 道错题复习</Text>
        <Card style={styles.doneStats}>
          <Text style={styles.doneStatText}>
            复习进度：{Math.round((records.length / Math.max(currentError?.reviewCount ?? 1, 1)) * 100)}%
          </Text>
        </Card>
        <TouchableOpacity style={styles.backBtn} onPress={handleFinish}>
          <Text style={styles.backBtnText}>回首页</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const planDesc = currentError ? getReviewPlanDescription(currentError) : ''

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* 进度 */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((currentIndex + 1) / totalCount) * 100}%` }]} />
      </View>
      <Text style={styles.progressText}>
        {currentIndex + 1} / {totalCount} · {planDesc}
      </Text>

      {/* 题目 */}
      <Card style={styles.questionCard}>
        <Text style={styles.cardLabel}>📝 题目</Text>
        <Text style={styles.questionText}>
          {currentError?.questionText || '（无题目内容）'}
        </Text>

        {currentError?.imagePath && (
          <Image
            source={{ uri: currentError.imagePath }}
            style={styles.questionImage}
            resizeMode="contain"
          />
        )}
      </Card>

      {phase === 'question' && (
        <Card style={styles.metaCard}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>模块</Text>
            <Text style={styles.metaValue}>{currentError?.module || '未分类'}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>复习次数</Text>
            <Text style={styles.metaValue}>{currentError?.reviewCount} 次</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>掌握程度</Text>
            <Text style={styles.metaValue}>{currentError?.mastery}</Text>
          </View>
        </Card>
      )}

      {/* 作答区 */}
      {phase === 'question' && (
        <TouchableOpacity style={styles.answerBtn} onPress={handleShowAnswer}>
          <Text style={styles.answerBtnText}>✍️ 查看答案</Text>
        </TouchableOpacity>
      )}

      {phase === 'answer' && (
        <Card style={styles.answerCard}>
          <Text style={styles.cardLabel}>💡 正确答案</Text>
          <Text style={styles.solutionText}>
            {currentError?.correctSolution || '（未录入正确答案）'}
          </Text>

          {currentError?.errorAnalysis && (
            <>
              <View style={styles.divider} />
              <Text style={styles.cardLabel}>🔍 错误分析</Text>
              <Text style={styles.solutionText}>{currentError.errorAnalysis}</Text>
            </>
          )}

          <View style={styles.resultButtons}>
            <TouchableOpacity
              style={[styles.resultBtn, styles.wrongBtn]}
              onPress={() => handleMarkResult(false)}
            >
              <Text style={styles.resultBtnText}>❌ 答错了</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.resultBtn, styles.correctBtn]}
              onPress={() => handleMarkResult(true)}
            >
              <Text style={styles.resultBtnText}>✅ 答对了</Text>
            </TouchableOpacity>
          </View>
        </Card>
      )}

      {/* 结果确认 */}
      {phase === 'result' && (
        <Card style={styles.resultCard}>
          <Text style={styles.resultTitle}>
            {isCorrect ? '🎉 答对了！' : '💪 继续加油！'}
          </Text>

          {isCorrect ? (
            <Text style={styles.resultDesc}>
              下一次复习将安排在 {calculateNextReviewDescription(currentError!)}
            </Text>
          ) : (
            <Text style={styles.resultDesc}>
              下次复习会缩短间隔，帮助你巩固记忆
            </Text>
          )}

          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmResult}>
            <Text style={styles.confirmBtnText}>继续下一题</Text>
          </TouchableOpacity>
        </Card>
      )}
    </ScrollView>
  )
}

function calculateNextReviewDescription(error: ErrorProblem): string {
  const nextDate = new Date()
  nextDate.setDate(nextDate.getDate() + 1) // 默认明天
  const diff = Math.ceil((nextDate.getTime() - Date.now()) / 86400000)
  if (diff === 0) return '明天'
  if (diff === 1) return '后天'
  return `${diff} 天后`
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgSecondary,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl + 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bg,
    padding: Spacing.xxl,
  },
  // 进度
  progressBar: {
    height: 4,
    backgroundColor: Colors.bgTertiary,
    borderRadius: 2,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginBottom: Spacing.lg,
  },
  // 题目
  questionCard: {
    marginBottom: Spacing.md,
  },
  cardLabel: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  questionText: {
    fontSize: FontSize.md,
    color: Colors.text,
    lineHeight: 24,
  },
  questionImage: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.md,
  },
  // 元信息
  metaCard: {
    marginBottom: Spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  metaLabel: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
  },
  metaValue: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontWeight: '600',
  },
  // 答题按钮
  answerBtn: {
    backgroundColor: Colors.buttonPrimary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  answerBtnText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.buttonPrimaryText,
  },
  // 答案
  answerCard: {
    marginBottom: Spacing.md,
  },
  solutionText: {
    fontSize: FontSize.md,
    color: Colors.text,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: Spacing.md,
  },
  resultButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  resultBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  wrongBtn: {
    backgroundColor: Colors.error + '15',
  },
  correctBtn: {
    backgroundColor: Colors.success + '15',
  },
  resultBtnText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
  },
  // 结果
  resultCard: {
    marginBottom: Spacing.md,
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  resultTitle: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  resultDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },
  confirmBtn: {
    backgroundColor: Colors.buttonPrimary,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  confirmBtnText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.buttonPrimaryText,
  },
  // 空状态
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  emptyDesc: {
    fontSize: FontSize.md,
    color: Colors.textTertiary,
    marginBottom: Spacing.xxl,
    textAlign: 'center',
  },
  // 完成
  doneIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  doneTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  doneDesc: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxl,
  },
  doneStats: {
    width: '100%',
    marginBottom: Spacing.xxl,
  },
  doneStatText: {
    fontSize: FontSize.md,
    color: Colors.text,
    textAlign: 'center',
  },
  backBtn: {
    backgroundColor: Colors.buttonPrimary,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  backBtnText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.buttonPrimaryText,
  },
})
