/**
 * 错题列表页 - 查看所有错题
 *
 * 支持按状态筛选、搜索
 */

import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../utils/theme'

type TabParamList = {
  Home: undefined
  ErrorList: undefined
  AddError: undefined
  Report: undefined
  Profile: undefined
}

type Nav = BottomTabNavigationProp<TabParamList>
import { ErrorProblem, getAllErrors, searchAllErrors, deleteErrorProblem, MODULES } from '../services/database'
import { Card } from '../components/Card'
import { ErrorCard } from '../components/ErrorCard'

type FilterStatus = '全部' | '待复习' | '已掌握'

export default function ErrorListScreen() {
  const navigation = useNavigation<Nav>()
  const [errors, setErrors] = useState<ErrorProblem[]>([])
  const [filter, setFilter] = useState<FilterStatus>('全部')
  const [searchText, setSearchText] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  async function loadErrors() {
    if (searchText.trim()) {
      const results = await searchAllErrors(searchText.trim())
      setErrors(results)
    } else {
      const all = await getAllErrors()
      setErrors(all)
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadErrors()
    }, [searchText])
  )

  async function onRefresh() {
    setRefreshing(true)
    await loadErrors()
    setRefreshing(false)
  }

  // 筛选
  const filteredErrors = errors.filter(e => {
    if (filter === '全部') return true
    return e.reviewStatus === filter
  })

  // 按模块分组
  const groupedByModule = MODULES.map(m => ({
    module: m,
    errors: filteredErrors.filter(e => e.module === m),
  })).filter(g => g.errors.length > 0)

  function handleErrorPress(error: ErrorProblem) {
    // 点进错题详情（后续可展开详情页面）
  }

  function handleLongPress(error: ErrorProblem) {
    setDeleteTarget(error.errorId)
    setShowDeleteModal(true)
  }

  async function confirmDelete() {
    if (deleteTarget) {
      await deleteErrorProblem(deleteTarget)
      await loadErrors()
    }
    setShowDeleteModal(false)
    setDeleteTarget(null)
  }

  const counts = {
    全部: errors.length,
    待复习: errors.filter(e => e.reviewStatus === '待复习').length,
    已掌握: errors.filter(e => e.reviewStatus === '已掌握').length,
  }

  return (
    <View style={styles.container}>
      {/* 搜索框 */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="搜索题目、知识点..."
          placeholderTextColor={Colors.textTertiary}
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={loadErrors}
          returnKeyType="search"
        />
        {searchText ? (
          <TouchableOpacity onPress={() => { setSearchText(''); loadErrors() }}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* 筛选标签 */}
      <View style={styles.filterRow}>
        {(Object.keys(counts) as FilterStatus[]).map(status => (
          <TouchableOpacity
            key={status}
            style={[styles.filterTag, filter === status && styles.filterTagActive]}
            onPress={() => setFilter(status)}
          >
            <Text style={[styles.filterTagText, filter === status && styles.filterTagTextActive]}>
              {status}
            </Text>
            <View style={[styles.filterCount, filter === status && styles.filterCountActive]}>
              <Text style={[styles.filterCountText, filter === status && styles.filterCountTextActive]}>
                {counts[status]}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* 列表 */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {!searchText && groupedByModule.map(group => (
          <View key={group.module}>
            <Text style={styles.moduleHeader}>{group.module}</Text>
            {group.errors.map(error => (
              <TouchableOpacity
                key={error.errorId}
                onLongPress={() => handleLongPress(error)}
                activeOpacity={0.7}
              >
                <ErrorCard error={error} onPress={handleErrorPress} compact />
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {searchText && filteredErrors.map(error => (
          <TouchableOpacity
            key={error.errorId}
            onLongPress={() => handleLongPress(error)}
            activeOpacity={0.7}
          >
            <ErrorCard error={error} onPress={handleErrorPress} compact />
          </TouchableOpacity>
        ))}

        {filteredErrors.length === 0 && (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>
              {searchText ? '📭' : '🎉'}
            </Text>
            <Text style={styles.emptyText}>
              {searchText ? '没有找到匹配的错题' : '还没有错题，快去录入吧'}
            </Text>
          </Card>
        )}
      </ScrollView>

      {/* 删除确认弹窗 */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>确认删除</Text>
            <Text style={styles.modalText}>删除后将无法恢复，确定删除这道错题吗？</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancel]}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.modalCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalConfirm]}
                onPress={confirmDelete}
              >
                <Text style={styles.modalConfirmText}>删除</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgSecondary,
  },
  // 搜索
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  clearBtn: {
    fontSize: 16,
    color: Colors.textTertiary,
    padding: Spacing.xs,
  },
  // 筛选
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  filterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.bgTertiary,
    gap: Spacing.xs,
  },
  filterTagActive: {
    backgroundColor: Colors.primary,
  },
  filterTagText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  filterTagTextActive: {
    color: Colors.textInverse,
  },
  filterCount: {
    backgroundColor: Colors.bg,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  filterCountActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  filterCountText: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontWeight: '600',
  },
  filterCountTextActive: {
    color: Colors.textInverse,
  },
  // 列表
  list: {
    flex: 1,
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl + 40,
  },
  moduleHeader: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
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
  },
  // 弹窗
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  modalContent: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    width: '100%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  modalText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  modalCancel: {
    backgroundColor: Colors.bgTertiary,
  },
  modalCancelText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  modalConfirm: {
    backgroundColor: Colors.error,
  },
  modalConfirmText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textInverse,
  },
})
