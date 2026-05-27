/**
 * 共享UI组件 - 错题卡片
 */

import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native'
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../utils/theme'
import { ErrorProblem, DIFFICULTY_LABELS } from '../services/database'
import { getReviewPlanDescription, getNextReviewDescription } from '../services/ebbinghaus'

interface ErrorCardProps {
  error: ErrorProblem
  onPress: (error: ErrorProblem) => void
  compact?: boolean
}

export function ErrorCard({ error, onPress, compact = false }: ErrorCardProps) {
  const planDesc = getReviewPlanDescription(error)
  const reviewDesc = getNextReviewDescription(error)

  // 掌握程度色
  const masteryColors: Record<string, string> = {
    '熟练': Colors.success,
    '良好': Colors.primary,
    '一般': Colors.warning,
    '薄弱': Colors.error,
    '未评估': Colors.textTertiary,
  }

  return (
    <TouchableOpacity
      style={[styles.container, compact && styles.compact]}
      onPress={() => onPress(error)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.errorId}>{error.errorId}</Text>
        <View style={styles.statusRow}>
          <View style={[styles.masteryBadge, { backgroundColor: (masteryColors[error.mastery] ?? Colors.textTertiary) + '20' }]}>
            <Text style={[styles.masteryText, { color: masteryColors[error.mastery] ?? Colors.textTertiary }]}>
              {error.mastery}
            </Text>
          </View>
          {error.reviewCount > 0 && (
            <Text style={styles.reviewCount}>已复习 {error.reviewCount} 次</Text>
          )}
        </View>
      </View>

      <Text style={styles.questionText} numberOfLines={compact ? 2 : 4}>
        {error.questionText || '（等待录入题目内容）'}
      </Text>

      {error.imagePath && (
        <Image
          source={{ uri: error.imagePath }}
          style={styles.previewImage}
          resizeMode="contain"
        />
      )}

      <View style={styles.footer}>
        <View style={styles.tags}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{DIFFICULTY_LABELS[error.difficulty - 1]}</Text>
          </View>
          {error.module && (
            <View style={styles.tag}>
              <Text style={styles.tagText} numberOfLines={1}>{error.module.replace('选择性必修', '选必')}</Text>
            </View>
          )}
        </View>

        <View style={styles.reviewInfo}>
          <View style={[styles.statusDot, {
            backgroundColor: reviewDesc === '逾期' ? Colors.error : Colors.primary
          }]} />
          <Text style={[styles.reviewDesc, {
            color: reviewDesc === '逾期' ? Colors.error : Colors.textSecondary
          }]}>
            {planDesc} · {reviewDesc}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  compact: {
    padding: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  errorId: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontFamily: undefined,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  masteryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  masteryText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  reviewCount: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  questionText: {
    fontSize: FontSize.md,
    color: Colors.text,
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  previewImage: {
    width: '100%',
    height: 120,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tags: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  tag: {
    backgroundColor: Colors.tagBg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  tagText: {
    fontSize: FontSize.xs,
    color: Colors.tagText,
  },
  reviewInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  reviewDesc: {
    fontSize: FontSize.xs,
  },
})
