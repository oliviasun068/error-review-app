/**
 * 共享UI组件 - 卡片
 */

import React from 'react'
import { View, StyleSheet, ViewStyle } from 'react-native'
import { Colors, Spacing, BorderRadius, Shadow } from '../utils/theme'

interface CardProps {
  children: React.ReactNode
  style?: ViewStyle
  noPadding?: boolean
}

export function Card({ children, style, noPadding }: CardProps) {
  return (
    <View style={[styles.card, !noPadding && styles.padding, style]}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadow.card,
  },
  padding: {
    padding: Spacing.lg,
  },
})
