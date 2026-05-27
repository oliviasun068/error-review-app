/**
 * 录入错题页 - 拍照/文字录入
 *
 * 支持：拍照识别、文字手动输入、AI辅助分析
 */

import React, { useState } from 'react'
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
  Platform,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
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
import { Card } from '../components/Card'
import {
  addErrorProblem,
  MODULES,
  ERROR_TYPES,
  DIFFICULTY_LABELS,
} from '../services/database'
import { analyzeProblemImage, analyzeProblemTextWithAI, AnalysisResult } from '../services/aiAnalysis'
import * as ImagePicker from 'expo-image-picker'

export default function AddErrorScreen() {
  const navigation = useNavigation<Nav>()

  const [imageUri, setImageUri] = useState<string | null>(null)
  const [questionText, setQuestionText] = useState('')
  const [module, setModule] = useState('')
  const [chapter, setChapter] = useState('')
  const [difficulty, setDifficulty] = useState(1)
  const [errorTypes, setErrorTypes] = useState<string[]>([])
  const [errorAnalysis, setErrorAnalysis] = useState('')
  const [correctSolution, setCorrectSolution] = useState('')
  const [knowledgePoints, setKnowledgePoints] = useState<string[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showModulePicker, setShowModulePicker] = useState(false)
  const [showDifficultyPicker, setShowDifficultyPicker] = useState(false)

  function applyAnalysisResult(result: AnalysisResult) {
    if (result.questionText.trim()) setQuestionText(result.questionText)
    if (result.module) setModule(result.module)
    if (result.chapter) setChapter(result.chapter)
    if (result.knowledgePoints.length > 0) setKnowledgePoints(result.knowledgePoints)
    if (result.difficulty > 0) setDifficulty(result.difficulty)
    if (result.errorTypes.length > 0) setErrorTypes(result.errorTypes)
    if (result.errorAnalysis) setErrorAnalysis(result.errorAnalysis)
    if (result.correctSolution) setCorrectSolution(result.correctSolution)
  }

  async function analyzeUploadedImage(uri: string) {
    setIsAnalyzing(true)
    try {
      const result = await analyzeProblemImage(uri)
      applyAnalysisResult(result)
      Alert.alert('识别完成', 'AI 已把题目内容填入文本框，你可以继续检查和修改。')
    } catch (e: any) {
      Alert.alert('AI识别失败', e?.message ?? '请检查接口配置或稍后重试')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // 选择图片
  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('权限提示', '需要访问相册权限')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri
      setImageUri(uri)
      await analyzeUploadedImage(uri)
    }
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('权限提示', '需要相机权限')
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri
      setImageUri(uri)
      await analyzeUploadedImage(uri)
    }
  }

  // AI分析
  async function runAnalysis() {
    if (!questionText.trim() && !imageUri) {
      Alert.alert('提示', '请先输入题目内容或拍照')
      return
    }

    setIsAnalyzing(true)
    try {
      const result = imageUri && !questionText.trim()
        ? await analyzeProblemImage(imageUri)
        : await analyzeProblemTextWithAI(questionText)
      applyAnalysisResult(result)
      Alert.alert('分析完成', result.module ? `识别到模块：${result.module}` : 'AI分析已完成')
    } catch (e: any) {
      Alert.alert('分析失败', e?.message ?? '请稍后重试')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // 切换错误类型
  function toggleErrorType(type: string) {
    setErrorTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  // 提交
  async function handleSubmit() {
    if (!questionText.trim() && !imageUri) {
      Alert.alert('提示', '请先输入题目内容或上传图片')
      return
    }

    setIsSubmitting(true)
    try {
      await addErrorProblem({
        imagePath: imageUri,
        questionText: questionText.trim(),
        module,
        chapter,
        knowledgePoints: JSON.stringify(knowledgePoints),
        difficulty,
        errorTypes: JSON.stringify(errorTypes),
        errorAnalysis: errorAnalysis.trim(),
        correctSolution: correctSolution.trim(),
      })

      Alert.alert('录入成功', '错题已保存到数据库', [
        { text: '继续录入', onPress: resetForm },
        { text: '回首页', onPress: () => navigation.navigate('Home') },
      ])
    } catch (e: any) {
      Alert.alert('录入失败', e?.message ?? '请稍后重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  function resetForm() {
    setImageUri(null)
    setQuestionText('')
    setModule('')
    setChapter('')
    setDifficulty(1)
    setErrorTypes([])
    setErrorAnalysis('')
    setCorrectSolution('')
    setKnowledgePoints([])
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* 图片上传 */}
      <Card style={styles.imageCard}>
        <TouchableOpacity style={styles.imageUpload} onPress={pickImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderIcon}>📸</Text>
              <Text style={styles.imagePlaceholderText}>点击选择题目图片</Text>
            </View>
          )}
        </TouchableOpacity>
        <View style={styles.imageActions}>
          <TouchableOpacity style={styles.imageBtn} onPress={takePhoto} disabled={isAnalyzing}>
            <Text style={styles.imageBtnText}>📷 拍照</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.imageBtn} onPress={pickImage} disabled={isAnalyzing}>
            <Text style={styles.imageBtnText}>🖼 相册</Text>
          </TouchableOpacity>
          {imageUri && (
            <TouchableOpacity style={styles.imageBtn} onPress={() => setImageUri(null)}>
              <Text style={[styles.imageBtnText, { color: Colors.error }]}>✕ 移除</Text>
            </TouchableOpacity>
          )}
        </View>
      </Card>

      {/* 题目内容 */}
      <Card style={styles.inputCard}>
        <Text style={styles.label}>题目内容 *</Text>
        <TextInput
          style={styles.textArea}
          multiline
          placeholder="输入题目内容，或拍照后让AI识别"
          placeholderTextColor={Colors.textTertiary}
          value={questionText}
          onChangeText={setQuestionText}
        />
        <TouchableOpacity
          style={[styles.aiBtn, isAnalyzing && styles.aiBtnDisabled]}
          onPress={runAnalysis}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <View style={styles.aiLoadingRow}>
              <ActivityIndicator size="small" color={Colors.textInverse} />
              <Text style={styles.aiBtnText}>AI识别中...</Text>
            </View>
          ) : (
            <Text style={styles.aiBtnText}>🤖 AI 识别并分析</Text>
          )}
        </TouchableOpacity>
      </Card>

      {/* 基本信息 */}
      <Card style={styles.inputCard}>
        <Text style={styles.label}>所属模块</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
          {MODULES.map(m => (
            <TouchableOpacity
              key={m}
              style={[styles.pickerTag, module === m && styles.pickerTagActive]}
              onPress={() => {
                setModule(m === module ? '' : m)
                setChapter('')
              }}
            >
              <Text style={[styles.pickerTagText, module === m && styles.pickerTagTextActive]}>
                {m.replace('选择性必修', '选必')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Card>

      {/* 难度 */}
      <Card style={styles.inputCard}>
        <Text style={styles.label}>难度等级</Text>
        <View style={styles.difficultyRow}>
          {DIFFICULTY_LABELS.map((label, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.difficultyTag, difficulty === i + 1 && styles.difficultyTagActive]}
              onPress={() => setDifficulty(i + 1)}
            >
              <Text style={[styles.difficultyText, difficulty === i + 1 && styles.difficultyTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* 错误类型 */}
      <Card style={styles.inputCard}>
        <Text style={styles.label}>错误类型（可多选）</Text>
        <View style={styles.typeGrid}>
          {ERROR_TYPES.map(type => (
            <TouchableOpacity
              key={type}
              style={[styles.typeTag, errorTypes.includes(type) && styles.typeTagActive]}
              onPress={() => toggleErrorType(type)}
            >
              <Text style={[styles.typeText, errorTypes.includes(type) && styles.typeTextActive]}>
                {errorTypes.includes(type) ? '✓ ' : ''}{type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* 错误分析 */}
      <Card style={styles.inputCard}>
        <Text style={styles.label}>错误分析</Text>
        <TextInput
          style={styles.textArea}
          multiline
          placeholder="为什么会错？思路哪里出了问题？"
          placeholderTextColor={Colors.textTertiary}
          value={errorAnalysis}
          onChangeText={setErrorAnalysis}
        />
      </Card>

      {/* 正确解法 */}
      <Card style={styles.inputCard}>
        <Text style={styles.label}>正确解法</Text>
        <TextInput
          style={styles.textArea}
          multiline
          placeholder="写出正确的解答过程"
          placeholderTextColor={Colors.textTertiary}
          value={correctSolution}
          onChangeText={setCorrectSolution}
        />
      </Card>

      {/* 提交按钮 */}
      <TouchableOpacity
        style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color={Colors.textInverse} />
        ) : (
          <Text style={styles.submitBtnText}>✅ 保存错题</Text>
        )}
      </TouchableOpacity>
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
  // 图片
  imageCard: {
    marginBottom: Spacing.lg,
  },
  imageUpload: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.md,
  },
  imagePlaceholder: {
    height: 150,
    backgroundColor: Colors.bgTertiary,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  imagePlaceholderIcon: {
    fontSize: 36,
    marginBottom: Spacing.sm,
  },
  imagePlaceholderText: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
  },
  imageActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  imageBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.bgTertiary,
    alignItems: 'center',
  },
  imageBtnText: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontWeight: '600',
  },
  // 输入
  inputCard: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  textArea: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  aiBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  aiBtnDisabled: {
    opacity: 0.6,
  },
  aiBtnText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textInverse,
  },
  aiLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  // 模块选择器
  pickerRow: {
    flexDirection: 'row',
  },
  pickerTag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.bgTertiary,
    marginRight: Spacing.sm,
  },
  pickerTagActive: {
    backgroundColor: Colors.primary,
  },
  pickerTagText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  pickerTagTextActive: {
    color: Colors.textInverse,
    fontWeight: '600',
  },
  // 难度
  difficultyRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  difficultyTag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.bgTertiary,
  },
  difficultyTagActive: {
    backgroundColor: Colors.primary,
  },
  difficultyText: {
    fontSize: FontSize.sm,
  },
  difficultyTextActive: {
    color: Colors.textInverse,
  },
  // 错误类型
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  typeTag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.bgTertiary,
  },
  typeTagActive: {
    backgroundColor: Colors.primary,
  },
  typeText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  typeTextActive: {
    color: Colors.textInverse,
    fontWeight: '600',
  },
  // 提交
  submitBtn: {
    backgroundColor: Colors.buttonPrimary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.buttonPrimaryText,
  },
})
