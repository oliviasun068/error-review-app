/**
 * 本地通知服务
 * 每日21:00推送复习提醒
 */

import Constants from 'expo-constants'
import { Platform } from 'react-native'

let notificationsModule: any | null = null
let notificationHandlerConfigured = false

function isExpoGoAndroid() {
  return Platform.OS === 'android' && Constants.executionEnvironment === 'storeClient'
}

async function getNotifications() {
  if (isExpoGoAndroid()) {
    return null
  }

  if (notificationsModule) {
    return notificationsModule
  }

  try {
    notificationsModule = await import('expo-notifications')
  } catch (error) {
    console.warn('Notifications are unavailable in this runtime:', error)
    return null
  }

  if (!notificationHandlerConfigured) {
    notificationsModule.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldShowLockScreen: true,
      }),
    })
    notificationHandlerConfigured = true
  }

  return notificationsModule
}

/**
 * 请求通知权限
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const Notifications = await getNotifications()
  if (!Notifications) {
    return false
  }

  const { status } = await Notifications.requestPermissionsAsync()
  return status === 'granted'
}

/**
 * 获取已授权状态
 */
export async function getNotificationPermission(): Promise<boolean> {
  const Notifications = await getNotifications()
  if (!Notifications) {
    return false
  }

  const { status } = await Notifications.getPermissionsAsync()
  return status === 'granted'
}

/**
 * 取消所有已安排的预定通知
 */
export async function cancelAllScheduledNotifications(): Promise<void> {
  const Notifications = await getNotifications()
  if (!Notifications) {
    return
  }

  await Notifications.cancelAllScheduledNotificationsAsync()
}

/**
 * 设置每日21:00复习提醒
 */
export async function scheduleDailyReviewNotification(pendingCount: number): Promise<void> {
  const Notifications = await getNotifications()
  if (!Notifications) {
    return
  }

  await cancelAllScheduledNotifications()

  // 当天的21:00
  const now = new Date()
  const scheduledDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    21, 0, 0
  )

  // 如果当前时间已过21:00，安排到明天
  if (now.getTime() > scheduledDate.getTime()) {
    scheduledDate.setDate(scheduledDate.getDate() + 1)
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '📚 错题复习提醒',
      body: pendingCount > 0
        ? `你今天有 ${pendingCount} 道错题待复习，点击查看详情`
        : '你今天没有待复习的错题，继续保持！',
      data: { screen: 'Review' },
      badge: pendingCount,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 21,
      minute: 0,
    },
  })
}

/**
 * 发送即时提醒
 */
export async function sendImmediateNotification(
  title: string,
  body: string,
  data?: Record<string, any>,
): Promise<void> {
  const Notifications = await getNotifications()
  if (!Notifications) {
    return
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data ?? {},
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 1,
    },
  })
}

/**
 * 处理通知点击 - 返回要导航到的页面
 */
export function getNotificationScreen(data: any): string | null {
  return data?.screen ?? null
}
