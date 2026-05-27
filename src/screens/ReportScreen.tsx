/**
 * 学习报告页 - 掌握情况统计
 *
 * 展示：复习日历、掌握分布、模块分析、知识图谱
 */

import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native'
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../utils/theme'
import { Card } from '../components/Card'
import { getStudyStats, getAllErrors, getReviewRecords, StudyStats, ErrorProblem, MODULES, MASTERY_LEVELS } from '../services/database'

export default function ReportScreen() {
  const [stats, setStats] = useState<StudyStats>({
    totalErrors: 0,
    pendingReview: 0,
    mastered: 0,
    weakAreas: [],
    todayReviewCount: 0,
    streakDays: 0,
  })
  const [allErrors, setAllErrors] = useState<ErrorProblem[]>([])
  const [refreshing, setRefreshing] = useState(false)

  async function loadData() {
    const [s, errors] = await Promise.all([
      getStudyStats(),
      getAllErrors(),
    ])
    setStats(s)
    setAllErrors(errors)
  }

  useEffect(() => { loadData() }, [])

  async function onRefresh() {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  // 掌握度分布
  const masteryDistribution = MASTERY_LEVELS.map(level => ({
    level,
    count: allErrors.filter(e => e.mastery === level).length,
    percentage: allErrors.length > 0
      ? Math.round((allErrors.filter(e => e.mastery === level).length / allErrors.length) * 100)
      : 0,
  }))

  // 模块统计
  const moduleStats = MODULES.map(m => {
    const moduleErrors = allErrors.filter(e => e.module === m)
    const mastered = moduleErrors.filter(e => e.mastery === '熟练').length
    return {
      module: m,
      total: moduleErrors.length,
      mastered,
      rate: moduleErrors.length > 0
        ? Math.round((mastered / moduleErrors.length) * 100)
        : 0,
    }
  }).filter(m => m.total > 0)

  // 最近7天复习记录（模拟）
  const weekDays = ['一', '二', '三', '四', '五', '六', '日']

  // 统计数据
  const masteryRate = stats.totalErrors > 0
    ? Math.round((stats.mastered / stats.totalErrors) * 100)
    : 0
  const reviewRate = stats.totalErrors > 0
    ? Math.round(((stats.totalErrors - stats.pendingReview) / stats.totalErrors) * 100)
    : 0

  // 掌握度颜色
  const masteryColors: Record<string, string> = {
    '熟练': Colors.success,
    '良好': Colors.primary,
    '一般': Colors.warning,
    '薄弱': Colors.error,
    '未评估': Colors.textTertiary,
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
      }
    >
      {/* 总览卡片 */}
      <Card style={styles.overviewCard}>
        <Text style={styles.overviewMain}>{masteryRate}%</Text>
        <Text style={styles.overviewLabel}>总体掌握率</Text>
        <View style={styles.overviewStats}>
          <View style={styles.overviewStat}>
            <Text style={styles.overviewValue}>{stats.totalErrors}</Text>
            <Text style={styles.overviewDesc}>总题数</Text>
          </View>
          <View style={styles.overviewStat}>
            <Text style={styles.overviewValue}>{stats.todayReviewCount}</Text>
            <Text style={styles.overviewDesc}>今日复习</Text>
          </View>
          <View style={styles.overviewStat}>
            <Text style={styles.overviewValue}>{stats.streakDays}</Text>
            <Text style={styles.overviewDesc}>连续天数</Text>
          </View>
        </View>
      </Card>

      {/* 掌握度分布 */}
      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>掌握程度分布</Text>
        {masteryDistribution.map(({ level, count, percentage }) => (
          <View key={level} style={styles.barRow}>
            <Text style={styles.barLabel}>{level}</Text>
            <View style={styles.barBg}>
              <View
                style={[styles.barFill, {
                  width: `${percentage}%`,
                  backgroundColor: masteryColors[level] ?? Colors.textTertiary,
                }]}
              />
            </View>
            <Text style={styles.barCount}>
              {count}
              <Text style={styles.barPercent}> ({percentage}%)</Text>
            </Text>
          </View>
        ))}
      </Card>

      {/* 复习进度条 */}
      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>复习进度</Text>
        <View style={styles.bigBarBg}>
          <View style={[styles.bigBarFill, { width: `${reviewRate}%`, backgroundColor: Colors.primary }]} />
        </View>
        <Text style={styles.bigBarLabel}>
          已复习 {stats.totalErrors - stats.pendingReview} 题 / 共 {stats.totalErrors} 题
        </Text>
      </Card>

      {/* 模块掌握情况 */}
      {moduleStats.length > 0 && (
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>模块掌握情况</Text>
          {moduleStats.map(({ module, total, mastered, rate }) => (
            <View key={module} style={styles.moduleRow}>
              <View style={styles.moduleInfo}>
                <Text style={styles.moduleName} numberOfLines={1}>
                  {module.replace('选择性必修', '选必')}
                </Text>
                <Text style={styles.moduleTotal}>{total}题 · 掌握 {mastered}题</Text>
              </View>
              <View style={styles.moduleRateContainer}>
                <View style={styles.moduleBarBg}>
                  <View style={[styles.moduleBarFill, {
                    width: `${rate}%`,
                    backgroundColor: rate >= 80 ? Colors.success : rate >= 50 ? Colors.primary : Colors.warning,
                  }]} />
                </View>
                <Text style={styles.moduleRateText}>{rate}%</Text>
              </View>
            </View>
          ))}
        </Card>
      )}

      {/* 薄弱模块提醒 */}
      {stats.weakAreas.length > 1 && (
        <Card style={{ ...styles.sectionCard, backgroundColor: Colors.error + '08', borderColor: Colors.error + '30' }}>
          <Text style={[styles.sectionTitle, { color: Colors.error }]}>⚠️ 需要加强的模块</Text>
          {stats.weakAreas.slice(0, 3).map((area, i) => (
            <Text key={i} style={styles.weakItem}>
              {i + 1}. {area.module}（{area.count} 道待复习）
            </Text>
          ))}
        </Card>
      )}

      {/* 错误类型分析 */}
      {allErrors.length > 0 && (
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>错误类型分析</Text>
          {(() => {
            const typeCount: Record<string, number> = {}
            allErrors.forEach(e => {
              try {
                const types = JSON.parse(e.errorTypes)
                types.forEach((t: string) => {
                  typeCount[t] = (typeCount[t] || 0) + 1
                })
              } catch {}
            })

            const sorted = Object.entries(typeCount).sort((a, b) => b[1] - a[1])
            const maxCount = sorted.length > 0 ? sorted[0][1] : 1

            return sorted.length === 0
              ? <Text style={styles.emptyText}>暂无错误类型数据</Text>
              : sorted.map(([type, count]) => (
                  <View key={type} style={styles.barRow}>
                    <Text style={styles.barLabel}>{type}</Text>
                    <View style={styles.barBg}>
                      <View style={[styles.barFill, {
                        width: `${(count / maxCount) * 100}%`,
                        backgroundColor: Colors.primary,
                      }]} />
                    </View>
                    <Text style={styles.barCount}>{count}</Text>
                  </View>
                ))
          })()}
        </Card>
      )}

      {/* 底部统计 */}
      <View style={styles.bottomStats}>
        <Text style={styles.bottomText}>
          总复习次数：{allErrors.reduce((sum, e) => sum + e.reviewCount, 0)}
        </Text>
        <Text style={styles.bottomText}>
          数据更新于 {new Date().toLocaleDateString('zh-CN')}
        </Text>
      </View>
    </ScrollView>
  )
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
  // 总览
  overviewCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    marginBottom: Spacing.md,
  },
  overviewMain: {
    fontSize: 48,
    fontWeight: '800',
    color: Colors.primary,
  },
  overviewLabel: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    marginBottom: Spacing.lg,
  },
  overviewStats: {
    flexDirection: 'row',
    gap: Spacing.xxl,
  },
  overviewStat: {
    alignItems: 'center',
  },
  overviewValue: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.text,
  },
  overviewDesc: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  // 章节卡片
  sectionCard: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  // 条形图
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  barLabel: {
    fontSize: FontSize.sm,
    color: Colors.text,
    width: 60,
  },
  barBg: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.bgTertiary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  barCount: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    width: 60,
    textAlign: 'right',
  },
  barPercent: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  // 大进度条
  bigBarBg: {
    height: 12,
    backgroundColor: Colors.bgTertiary,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  bigBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  bigBarLabel: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  // 模块
  moduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  moduleInfo: {
    flex: 1,
  },
  moduleName: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  moduleTotal: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  moduleRateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    width: 120,
  },
  moduleBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.bgTertiary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  moduleBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  moduleRateText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.text,
    width: 35,
    textAlign: 'right',
  },
  // 薄弱
  weakItem: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
  // 底部
  bottomStats: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  bottomText: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
})
