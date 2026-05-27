/**
 * 首页 - 学习仪表盘
 *
 * 参考 UI：顶部天蓝渐变导航、白色背景、卡片布局、统计概览
 */

import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'

type TabParamList = {
  AddError: undefined
  Report: undefined
  ErrorList: undefined
  Home: undefined
  Profile: undefined
}

type Nav = BottomTabNavigationProp<TabParamList>
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../utils/theme'
import { getStudyStats, getPendingReviewErrors, StudyStats, ErrorProblem } from '../services/database'
import { Card } from '../components/Card'
import { ErrorCard } from '../components/ErrorCard'

export default function HomeScreen() {
  const navigation = useNavigation<Nav>()
  const [stats, setStats] = useState<StudyStats>({
    totalErrors: 0,
    pendingReview: 0,
    mastered: 0,
    weakAreas: [],
    todayReviewCount: 0,
    streakDays: 0,
  })
  const [pendingErrors, setPendingErrors] = useState<ErrorProblem[]>([])
  const [refreshing, setRefreshing] = useState(false)

  async function loadData() {
    const [s, errors] = await Promise.all([
      getStudyStats(),
      getPendingReviewErrors(3),
    ])
    setStats(s)
    setPendingErrors(errors)
  }

  useFocusEffect(
    useCallback(() => {
      loadData()
    }, [])
  )

  async function onRefresh() {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  // 掌握率
  const masteryRate = stats.totalErrors > 0
    ? Math.round((stats.mastered / stats.totalErrors) * 100)
    : 0

  function handleErrorPress(error: ErrorProblem) {
    navigation.navigate('ErrorList')
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
      }
    >
      {/* 统计概览 */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalErrors}</Text>
          <Text style={styles.statLabel}>累计错题</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: Colors.warning }]}>{stats.pendingReview}</Text>
          <Text style={styles.statLabel}>待复习</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: Colors.success }]}>{stats.mastered}</Text>
          <Text style={styles.statLabel}>已掌握</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: Colors.primary }]}>{masteryRate}%</Text>
          <Text style={styles.statLabel}>掌握率</Text>
        </View>
      </View>

      {/* 学习进度条 */}
      <Card style={styles.progressCard}>
        <Text style={styles.sectionTitle}>今日学习</Text>
        <View style={styles.progressRow}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${Math.min(stats.todayReviewCount * 20, 100)}%` }]} />
          </View>
          <Text style={styles.progressText}>{stats.todayReviewCount} 题</Text>
        </View>
        <View style={styles.progressMeta}>
          <Text style={styles.progressMetaText}>连续学习 {stats.streakDays} 天</Text>
          <Text style={styles.progressMetaText}>今日已复习 {stats.todayReviewCount} 题</Text>
        </View>
      </Card>

      {/* 快速入口 */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('AddError')}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIcon, { backgroundColor: Colors.primary + '20' }]}>
            <Text style={styles.actionIconText}>📸</Text>
          </View>
          <Text style={styles.actionLabel}>录入错题</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('ErrorList')}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIcon, { backgroundColor: Colors.warning + '20' }]}>
            <Text style={styles.actionIconText}>🔄</Text>
          </View>
          <Text style={styles.actionLabel}>开始复习</Text>
          {stats.pendingReview > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{stats.pendingReview}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('Profile')}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIcon, { backgroundColor: Colors.success + '20' }]}>
            <Text style={styles.actionIconText}>⚙️</Text>
          </View>
          <Text style={styles.actionLabel}>设置</Text>
        </TouchableOpacity>
      </View>

      {/* 薄弱模块 */}
      {stats.weakAreas.length > 0 && (
        <Card style={styles.weakCard}>
          <Text style={styles.sectionTitle}>薄弱模块</Text>
          <View style={styles.weakList}>
            {stats.weakAreas.slice(0, 3).map((area, i) => (
              <View key={i} style={styles.weakRow}>
                <Text style={styles.weakName}>{area.module}</Text>
                <View style={styles.weakBarBg}>
                  <View style={[styles.weakBarFill, { width: `${Math.min((area.count / stats.totalErrors) * 100, 100)}%` }]} />
                </View>
                <Text style={styles.weakCount}>{area.count}题</Text>
              </View>
            ))}
          </View>
        </Card>
      )}

      {/* 待复习错题 */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>待复习错题</Text>
        {pendingErrors.length > 0 && (
          <TouchableOpacity onPress={() => navigation.navigate('ErrorList')}>
            <Text style={styles.seeAll}>查看全部 →</Text>
          </TouchableOpacity>
        )}
      </View>

      {pendingErrors.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>🎉</Text>
          <Text style={styles.emptyText}>暂无待复习的错题</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('AddError')}
          >
            <Text style={styles.addBtnText}>录入新错题</Text>
          </TouchableOpacity>
        </Card>
      ) : (
        pendingErrors.map(error => (
          <ErrorCard
            key={error.errorId}
            error={error}
            onPress={handleErrorPress}
          />
        ))
      )}
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
  // 统计网格
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadow.card,
  },
  statValue: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.text,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  // 进度条
  progressCard: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.bgTertiary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.primary,
    width: 40,
    textAlign: 'right',
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressMetaText: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  // 快速入口
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    position: 'relative',
    ...Shadow.card,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  actionIconText: {
    fontSize: 22,
  },
  actionLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textInverse,
  },
  // 薄弱模块
  weakCard: {
    marginBottom: Spacing.lg,
  },
  weakList: {
    gap: Spacing.md,
  },
  weakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  weakName: {
    fontSize: FontSize.sm,
    color: Colors.text,
    width: 100,
  },
  weakBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.bgTertiary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  weakBarFill: {
    height: '100%',
    backgroundColor: Colors.error,
    borderRadius: 3,
  },
  weakCount: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    width: 30,
    textAlign: 'right',
  },
  // 列表标题
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  seeAll: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  // 空状态
  emptyCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textTertiary,
    marginBottom: Spacing.lg,
  },
  addBtn: {
    backgroundColor: Colors.buttonPrimary,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  addBtnText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.buttonPrimaryText,
  },
})
