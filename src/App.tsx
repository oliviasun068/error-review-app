/**
 * App 根组件 - 页面路由与底部导航
 *
 * Tab 结构：
 *   首页 🏠  |  错题集 📖  |  录入 ➕  |  报告 📊  |  我的 👤
 */

import React, { useEffect, useState } from 'react'
import { StatusBar } from 'expo-status-bar'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { Colors, FontSize } from './utils/theme'

// 页面
import HomeScreen from './screens/HomeScreen'
import ErrorListScreen from './screens/ErrorListScreen'
import AddErrorScreen from './screens/AddErrorScreen'
import ReportScreen from './screens/ReportScreen'
import ProfileScreen from './screens/ProfileScreen'

// 服务
import { initDatabase } from './services/database'
import { requestNotificationPermission } from './services/notifications'

// Tab 图标
function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={{
      fontSize: 22,
      opacity: focused ? 1 : 0.5,
    }}>
      {label}
    </Text>
  )
}

const Tab = createBottomTabNavigator()

export default function App() {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      try {
        await initDatabase()
        await requestNotificationPermission()
        setReady(true)
      } catch (e: any) {
        console.error('Init failed:', e)
        setError(e?.message ?? '初始化失败')
      }
    }
    init()
  }, [])

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>初始化失败: {error}</Text>
      </View>
    )
  }

  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    )
  }

  return (
    <>
      <StatusBar style="light" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: Colors.primary,
              elevation: 0,
              shadowOpacity: 0,
            },
            headerTintColor: Colors.textInverse,
            headerTitleStyle: {
              fontWeight: '700',
              fontSize: FontSize.lg,
            },
            tabBarStyle: {
              backgroundColor: Colors.navBg,
              borderTopColor: 'transparent',
              height: 85,
              paddingBottom: 25,
              paddingTop: 8,
            },
            tabBarActiveTintColor: Colors.navTextActive,
            tabBarInactiveTintColor: Colors.navText,
            tabBarLabelStyle: {
              fontSize: FontSize.xs,
              fontWeight: '600',
            },
          }}
        >
          <Tab.Screen
            name="Home"
            component={HomeScreen}
            options={{
              title: '首页',
              headerTitle: '📚 错题策展人',
              tabBarIcon: ({ focused }) => <TabIcon label="🏠" focused={focused} />,
            }}
          />
          <Tab.Screen
            name="ErrorList"
            component={ErrorListScreen}
            options={{
              title: '错题集',
              headerTitle: '📖 错题集',
              tabBarIcon: ({ focused }) => <TabIcon label="📖" focused={focused} />,
            }}
          />
          <Tab.Screen
            name="AddError"
            component={AddErrorScreen}
            options={{
              title: '录入',
              headerTitle: '📸 录入错题',
              tabBarIcon: ({ focused }) => <TabIcon label="➕" focused={focused} />,
            }}
          />
          <Tab.Screen
            name="Report"
            component={ReportScreen}
            options={{
              title: '报告',
              headerTitle: '📊 学习报告',
              tabBarIcon: ({ focused }) => <TabIcon label="📊" focused={focused} />,
            }}
          />
          <Tab.Screen
            name="Profile"
            component={ProfileScreen}
            options={{
              title: '我的',
              headerTitle: '👤 我的',
              tabBarIcon: ({ focused }) => <TabIcon label="👤" focused={focused} />,
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </>
  )
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bg,
  },
  loadingText: {
    marginTop: 12,
    color: Colors.textSecondary,
    fontSize: FontSize.md,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSize.md,
  },
})
