export type TextbookVersion = '人教B版' | '人教A版' | '北师大版' | '苏教版' | '湘教版'

export type ChapterNode = {
  title: string
  knowledgePoints: string[]
}

export type ModuleNode = {
  module: string
  chapters: ChapterNode[]
}

export const TEXTBOOK_VERSIONS: TextbookVersion[] = [
  '人教B版',
  '人教A版',
  '北师大版',
  '苏教版',
  '湘教版',
]

const SHARED_MODULES = [
  '必修第一册',
  '必修第二册',
  '选择性必修第一册',
  '选择性必修第二册',
  '选择性必修第三册',
]

const baseSystem: ModuleNode[] = [
  {
    module: '必修第一册',
    chapters: [
      { title: '集合与常用逻辑用语', knowledgePoints: ['集合', '交集', '并集', '补集', '充分条件', '必要条件'] },
      { title: '等式与不等式', knowledgePoints: ['一元二次不等式', '基本不等式', '不等式性质'] },
      { title: '函数', knowledgePoints: ['函数概念', '定义域', '值域', '单调性', '奇偶性', '幂函数'] },
      { title: '指数函数、对数函数与幂函数', knowledgePoints: ['指数运算', '对数运算', '指数函数', '对数函数'] },
      { title: '三角函数', knowledgePoints: ['任意角', '弧度制', '诱导公式', '正弦函数', '余弦函数', '正切函数'] },
    ],
  },
  {
    module: '必修第二册',
    chapters: [
      { title: '平面向量', knowledgePoints: ['向量线性运算', '数量积', '向量夹角', '平面向量应用'] },
      { title: '复数', knowledgePoints: ['复数概念', '复数四则运算', '复平面'] },
      { title: '立体几何初步', knowledgePoints: ['空间点线面', '平行关系', '垂直关系', '空间几何体'] },
      { title: '统计', knowledgePoints: ['抽样', '频率分布', '平均数', '方差', '百分位数'] },
      { title: '概率', knowledgePoints: ['随机事件', '古典概型', '互斥事件', '相互独立事件'] },
    ],
  },
  {
    module: '选择性必修第一册',
    chapters: [
      { title: '空间向量与立体几何', knowledgePoints: ['空间向量', '法向量', '空间角', '距离'] },
      { title: '直线和圆的方程', knowledgePoints: ['直线方程', '圆的方程', '直线与圆位置关系'] },
      { title: '圆锥曲线', knowledgePoints: ['椭圆', '双曲线', '抛物线', '离心率', '焦点弦'] },
      { title: '数列', knowledgePoints: ['等差数列', '等比数列', '通项公式', '前n项和'] },
    ],
  },
  {
    module: '选择性必修第二册',
    chapters: [
      { title: '导数及其应用', knowledgePoints: ['导数概念', '导数运算', '切线', '单调性', '极值', '最值'] },
      { title: '计数原理', knowledgePoints: ['分类加法', '分步乘法', '排列', '组合', '二项式定理'] },
    ],
  },
  {
    module: '选择性必修第三册',
    chapters: [
      { title: '随机变量及其分布', knowledgePoints: ['条件概率', '离散型随机变量', '二项分布', '超几何分布', '正态分布'] },
      { title: '成对数据的统计分析', knowledgePoints: ['相关关系', '线性回归', '独立性检验'] },
    ],
  },
]

const systems: Record<TextbookVersion, ModuleNode[]> = {
  '人教B版': baseSystem,
  '人教A版': baseSystem.map(item => ({
    ...item,
    chapters: item.chapters.map(chapter => ({
      ...chapter,
      title: chapter.title
        .replace('等式与不等式', '一元二次函数、方程和不等式')
        .replace('函数', '函数概念与性质')
        .replace('立体几何初步', '立体几何初步与空间几何体'),
    })),
  })),
  '北师大版': baseSystem.map(item => ({
    ...item,
    chapters: item.chapters.map(chapter => ({
      ...chapter,
      title: chapter.title
        .replace('集合与常用逻辑用语', '预备知识与集合')
        .replace('概率', '概率与统计初步')
        .replace('导数及其应用', '变化率与导数'),
    })),
  })),
  '苏教版': baseSystem.map(item => ({
    ...item,
    chapters: item.chapters.map(chapter => ({
      ...chapter,
      title: chapter.title
        .replace('三角函数', '三角函数与三角恒等变换')
        .replace('平面向量', '向量及其应用')
        .replace('数列', '数列与数学归纳法'),
    })),
  })),
  '湘教版': baseSystem.map(item => ({
    ...item,
    chapters: item.chapters.map(chapter => ({
      ...chapter,
      title: chapter.title
        .replace('函数', '函数及其性质')
        .replace('圆锥曲线', '圆锥曲线方程')
        .replace('成对数据的统计分析', '统计案例'),
    })),
  })),
}

export function getKnowledgeSystem(version: string): ModuleNode[] {
  return systems[(version as TextbookVersion) || '人教B版'] ?? systems['人教B版']
}

export function getModules(version: string): string[] {
  return getKnowledgeSystem(version).map(item => item.module)
}

export function getChapters(version: string, module: string): ChapterNode[] {
  return getKnowledgeSystem(version).find(item => item.module === module)?.chapters ?? []
}

export function getAllKnowledgePoints(version: string, module?: string, chapter?: string): string[] {
  const modules = module
    ? getKnowledgeSystem(version).filter(item => item.module === module)
    : getKnowledgeSystem(version)
  const points = modules.flatMap(item => item.chapters)
    .filter(item => !chapter || item.title === chapter)
    .flatMap(item => item.knowledgePoints)
  return Array.from(new Set(points))
}

export function normalizeModule(module: string): string {
  return SHARED_MODULES.includes(module) ? module : ''
}
