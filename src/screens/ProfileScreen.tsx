/**
 * "我的" 页面 - 设置/通知/关于
 */

import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../utils/theme'
import { Card } from '../components/Card'
import {
  getSetting,
  setSetting,
  getStudyStats,
  StudyStats,
} from '../services/database'
import {
  requestNotificationPermission,
  scheduleDailyReviewNotification,
  cancelAllScheduledNotifications,
  getNotificationPermission,
} from '../services/notifications'
import { TEXTBOOK_VERSIONS } from '../services/knowledgeSystem'

export default function ProfileScreen() {
  const [dailyReminder, setDailyReminder] = useState(false)
  const [weekendMode, setWeekendMode] = useState(false)
  const [dailyLimit, setDailyLimit] = useState('3')
  const [textbookVersion, setTextbookVersion] = useState('人教B版')
  const [hasPermission, setHasPermission] = useState(false)
  const [stats, setStats] = useState<StudyStats>({ totalErrors: 0, pendingReview: 0, mastered: 0, weakAreas: [], todayReviewCount: 0, streakDays: 0 })

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    const reminder = await getSetting('daily_reminder', 'true')
    const weekend = await getSetting('weekend_mode', 'false')
    const limit = await getSetting('daily_limit', '3')
    const textbook = await getSetting('textbook_version', '人教B版')
    const perm = await getNotificationPermission()
    const s = await getStudyStats()

    setDailyReminder(reminder === 'true')
    setWeekendMode(weekend === 'true')
    setDailyLimit(limit)
    setTextbookVersion(textbook)
    setHasPermission(perm)
    setStats(s)
  }

  async function toggleDailyReminder(value: boolean) {
    setDailyReminder(value)
    await setSetting('daily_reminder', value ? 'true' : 'false')
    if (value) {
      if (!hasPermission) {
        const granted = await requestNotificationPermission()
        setHasPermission(granted)
        if (!granted) {
          Alert.alert('权限拒绝', '请在系统设置中开启通知权限')
          setDailyReminder(false)
          return
        }
      }
      await scheduleDailyReviewNotification(stats.pendingReview)
      Alert.alert('已开启', '每天21:00推送复习提醒')
    } else {
      await cancelAllScheduledNotifications()
    }
  }

  async function toggleWeekendMode(value: boolean) {
    setWeekendMode(value)
    await setSetting('weekend_mode', value ? 'true' : 'false')
  }

  function handleFeedback() {
    Alert.alert(
      '意见反馈',
      '有任何建议或问题，请发送邮件至：\naicurator@feedback.com',
    )
  }

  function handleAbout() {
    Alert.alert(
      '关于',
      `📚 错题策展人 v1.0.0\n\n基于艾宾浩斯遗忘曲线，科学的错题复习管理工具。\n\n数据存储在本地设备，无需联网。`,
    )
  }

  async function handleExport() {
    const total = stats.totalErrors
    const mastered = stats.mastered
    const rate = total > 0 ? Math.round((mastered / total) * 100) : 0
    const text =
`📚 错题策展人 学习报告
━━━━━━━━━━━━━━━━━━
累计错题：${total} 题
已掌握：${mastered} 题
掌握率：${rate}%
待复习：${stats.pendingReview} 题
连续学习：${stats.streakDays} 天
━━━━━━━━━━━━━━━━━━
数据更新：${new Date().toLocaleDateString('zh-CN')}`

    Alert.alert('学习报告', text)
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* 用户卡片 */}
      <Card style={styles.userCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>📚</Text>
        </View>
        <Text style={styles.userName}>错题策展人</Text>
        <Text style={styles.userStats}>
          累计 {stats.totalErrors} 题 · 已掌握 {stats.mastered} 题
        </Text>
      </Card>

      {/* 复习设置 */}
      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>复习设置</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>每日提醒</Text>
            <Text style={styles.settingDesc}>每天21:00推送复习提醒</Text>
          </View>
          <Switch
            value={dailyReminder}
            onValueChange={toggleDailyReminder}
            trackColor={{ false: Colors.bgTertiary, true: Colors.primary + '80' }}
            thumbColor={dailyReminder ? Colors.primary : '#f4f3f4'}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>周末模式</Text>
            <Text style={styles.settingDesc}>周五~周日可推送更多题目</Text>
          </View>
          <Switch
            value={weekendMode}
            onValueChange={toggleWeekendMode}
            trackColor={{ false: Colors.bgTertiary, true: Colors.primary + '80' }}
            thumbColor={weekendMode ? Colors.primary : '#f4f3f4'}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>每日题量</Text>
            <Text style={styles.settingDesc}>每次推送的错题数量</Text>
          </View>
          <View style={styles.limitRow}>
            {['3', '5', '10'].map(n => (
              <TouchableOpacity
                key={n}
                style={[styles.limitTag, dailyLimit === n && styles.limitTagActive]}
                onPress={async () => {
                  setDailyLimit(n)
                  await setSetting('daily_limit', n)
                }}
              >
                <Text style={[styles.limitText, dailyLimit === n && styles.limitTextActive]}>
                  {n}题
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Card>

      {/* 教材设置 */}
      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>教材设置</Text>
        <Text style={styles.settingDesc}>用于AI归类、章节筛选和知识点候选</Text>
        <View style={styles.textbookGrid}>
          {TEXTBOOK_VERSIONS.map(version => (
            <TouchableOpacity
              key={version}
              style={[styles.textbookTag, textbookVersion === version && styles.textbookTagActive]}
              onPress={async () => {
                setTextbookVersion(version)
                await setSetting('textbook_version', version)
              }}
            >
              <Text style={[styles.textbookText, textbookVersion === version && styles.textbookTextActive]}>
                {version}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* 数据管理 */}
      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>数据管理</Text>
        <TouchableOpacity style={styles.menuRow} onPress={handleExport}>
          <Text style={styles.menuIcon}>📊</Text>
          <Text style={styles.menuLabel}>导出学习报告</Text>
          <Text style={styles.menuArrow}>→</Text>
        </TouchableOpacity>
      </Card>

      {/* 其他 */}
      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>其他</Text>
        <TouchableOpacity style={styles.menuRow} onPress={handleFeedback}>
          <Text style={styles.menuIcon}>💬</Text>
          <Text style={styles.menuLabel}>意见反馈</Text>
          <Text style={styles.menuArrow}>→</Text>
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.menuRow} onPress={handleAbout}>
          <Text style={styles.menuIcon}>ℹ️</Text>
          <Text style={styles.menuLabel}>关于</Text>
          <Text style={styles.menuArrow}>→</Text>
        </TouchableOpacity>
      </Card>

      <Text style={styles.version}>v1.0.0</Text>
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
  userCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: {
    fontSize: 32,
  },
  userName: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  userStats: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
  },
  sectionCard: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  // 设置行
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  settingDesc: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
  },
  // 每日题量
  limitRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  limitTag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.bgTertiary,
  },
  limitTagActive: {
    backgroundColor: Colors.primary,
  },
  limitText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  limitTextActive: {
    color: Colors.textInverse,
  },
  textbookGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  textbookTag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.bgTertiary,
  },
  textbookTagActive: {
    backgroundColor: Colors.primary,
  },
  textbookText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  textbookTextActive: {
    color: Colors.textInverse,
  },
  // 菜单
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: Spacing.md,
  },
  menuLabel: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  menuArrow: {
    fontSize: FontSize.md,
    color: Colors.textTertiary,
  },
  version: {
    textAlign: 'center',
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: Spacing.lg,
  },
})
