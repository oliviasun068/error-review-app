/**
 * 设计系统 - Radix UI Colors
 *
 * 主色：Sky（天蓝）| 中性色：Slate | 功能色：Green / Red / Amber
 * https://www.radix-ui.com/colors
 */

export const Colors = {
  // ── 主色 Sky ──
  primary:        '#7ce2fe', // sky9  - 主按钮/强调
  primaryDark:    '#00749e', // sky11 - 深色强调/标题
  primaryDeep:    '#1d3e56', // sky12 - 最深
  primaryLight:   '#bee7f5', // sky5  - 浅色填充
  primaryBg:      '#f9feff', // sky1  - 最浅背景
  primaryHover:   '#74daf8', // sky10 - hover 状态

  // ── 中性色 Slate ──
  slate1:  '#fcfcfd',
  slate2:  '#f9f9fb',
  slate3:  '#f0f0f3',
  slate4:  '#e8e8ec',
  slate5:  '#e0e1e6',
  slate6:  '#d9d9e0',
  slate7:  '#cdced6',
  slate8:  '#b9bbc6',
  slate9:  '#8b8d98',
  slate10: '#80838d',
  slate11: '#60646c',
  slate12: '#1c2024',

  // ── 语义映射 ──
  // 背景
  bg:           '#ffffff',
  bgSecondary:  '#f9f9fb', // slate2
  bgTertiary:   '#f0f0f3', // slate3

  // 文字
  text:           '#1c2024', // slate12 - 主文字
  textSecondary:  '#60646c', // slate11 - 次要文字
  textTertiary:   '#8b8d98', // slate9  - 辅助文字
  textInverse:    '#ffffff',

  // 导航 & 按钮 - 深色
  navBg:            '#1c2024', // slate12
  navText:          '#8b8d98', // slate9
  navTextActive:    '#ffffff',
  buttonPrimary:    '#1c2024', // slate12
  buttonPrimaryText:'#ffffff',

  // 功能色
  success:    '#30a46c', // green9
  successBg:  '#fbfefc', // green1
  warning:    '#ffc53d', // amber9
  warningBg:  '#fefdfb', // amber1
  error:      '#e5484d', // red9
  errorBg:    '#fffcfc', // red1
  info:       '#7ce2fe', // sky9
  infoBg:     '#f9feff', // sky1

  // 边框 & 分隔线
  border:     '#e0e1e6', // slate5
  divider:    '#f0f0f3', // slate3

  // 卡片
  cardBg:     '#ffffff',
  cardBorder: '#e0e1e6', // slate5

  // 标签
  tagBg:   '#f9feff', // sky1
  tagText: '#00749e', // sky11
  tagHot:  '#e5484d', // red9
  tagNew:  '#30a46c', // green9
}

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
}

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  title: 28,
}

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  round: 999,
}

export const Shadow = {
  card: {
    shadowColor: '#1c2024',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  modal: {
    shadowColor: '#1c2024',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 8,
  },
}
