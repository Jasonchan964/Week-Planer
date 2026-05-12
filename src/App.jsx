import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowDownWideNarrow,
  BookOpen,
  Briefcase,
  Gamepad2,
  HeartPulse,
  Home,
  Rocket,
  Trash2,
  Users,
  Wallet,
} from 'lucide-react'

const STORAGE_KEY = 'life-week-planner-weeks-v2'
const LEGACY_STORAGE_KEY = 'life-dimensions-week-planner'

const WEEKDAY_LABELS = [
  '星期日',
  '星期一',
  '星期二',
  '星期三',
  '星期四',
  '星期五',
  '星期六',
]

/** @typedef {{ id: string, text: string, completed: boolean, priority: 'high' | 'medium' | 'low' }} Task */

const DIMENSIONS = [
  {
    title: '学习成长',
    Icon: BookOpen,
    border: 'border-blue-200/90',
    iconColor: 'text-blue-400',
    hoverShadow: 'hover:shadow-blue-100',
  },
  {
    title: '工作事业',
    Icon: Briefcase,
    border: 'border-indigo-200/90',
    iconColor: 'text-indigo-400',
    hoverShadow: 'hover:shadow-indigo-100',
  },
  {
    title: '财务理财',
    Icon: Wallet,
    border: 'border-emerald-200/90',
    iconColor: 'text-emerald-400',
    hoverShadow: 'hover:shadow-emerald-100',
  },
  {
    title: '身体健康',
    Icon: HeartPulse,
    border: 'border-rose-200/90',
    iconColor: 'text-rose-400',
    hoverShadow: 'hover:shadow-rose-100',
  },
  {
    title: '休闲娱乐',
    Icon: Gamepad2,
    border: 'border-amber-200/90',
    iconColor: 'text-amber-400',
    hoverShadow: 'hover:shadow-amber-100',
  },
  {
    title: '家庭生活',
    Icon: Home,
    border: 'border-orange-200/90',
    iconColor: 'text-orange-400',
    hoverShadow: 'hover:shadow-orange-100',
  },
  {
    title: '体验突破',
    Icon: Rocket,
    border: 'border-purple-200/90',
    iconColor: 'text-purple-400',
    hoverShadow: 'hover:shadow-purple-100',
  },
  {
    title: '人际社群',
    Icon: Users,
    border: 'border-teal-200/90',
    iconColor: 'text-teal-400',
    hoverShadow: 'hover:shadow-teal-100',
  },
]

const DIMENSION_TITLES = DIMENSIONS.map((d) => d.title)

const LEGACY_ID_TO_TITLE = {
  growth: '学习成长',
  career: '工作事业',
  finance: '财务理财',
  health: '身体健康',
  leisure: '休闲娱乐',
  family: '家庭生活',
  breakthrough: '体验突破',
  social: '人际社群',
}

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 }

/** 红黄绿：高红、中黄、低绿 */
const PRIORITY_DOT = {
  high: 'bg-red-500',
  medium: 'bg-amber-400',
  low: 'bg-emerald-500',
}

const PRIORITY_RING = {
  high: 'ring-red-200',
  medium: 'ring-amber-100',
  low: 'ring-emerald-100',
}

const PRIORITY_LABEL = {
  high: '高',
  medium: '中',
  low: '低',
}

const PAW_BG_LAYOUT = [
  { t: 5, l: 3, rot: -22, s: 0.9, op: 0.09 },
  { t: 12, r: 6, rot: 35, s: 1.1, op: 0.06 },
  { t: 28, l: 1, rot: 12, s: 0.75, op: 0.08 },
  { t: 42, r: 2, rot: -28, s: 1, op: 0.07 },
  { t: 62, l: 8, rot: 18, s: 0.85, op: 0.05 },
  { t: 78, r: 10, rot: -15, s: 1.15, op: 0.1 },
  { t: 88, l: 18, rot: 40, s: 0.7, op: 0.06 },
  { t: 18, r: 22, rot: -8, s: 0.95, op: 0.08 },
  { t: 52, r: 4, rot: 22, s: 0.8, op: 0.07 },
  { t: 72, l: 28, rot: -35, s: 1.05, op: 0.05 },
  { t: 8, l: 42, rot: 8, s: 0.65, op: 0.1 },
  { t: 35, l: 36, rot: -18, s: 0.9, op: 0.06 },
  { t: 92, r: 30, rot: 28, s: 0.75, op: 0.08 },
  { t: 48, l: 12, rot: 5, s: 1, op: 0.07 },
]

function PawMiniSvg({ className }) {
  return (
    <svg
      viewBox="0 0 24 28"
      className={className}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <ellipse cx="12" cy="20" rx="7" ry="5.5" opacity="0.92" />
      <circle cx="6" cy="9" r="2.4" opacity="0.88" />
      <circle cx="12" cy="6" r="2.4" opacity="0.88" />
      <circle cx="18" cy="9" r="2.4" opacity="0.88" />
      <circle cx="9" cy="12" r="2.1" opacity="0.85" />
      <circle cx="15" cy="12" r="2.1" opacity="0.85" />
    </svg>
  )
}

function CatPawBackdrop() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      {PAW_BG_LAYOUT.map((p, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            top: `${p.t}%`,
            left: p.l !== undefined ? `${p.l}%` : undefined,
            right: p.r !== undefined ? `${p.r}%` : undefined,
            opacity: p.op,
            transform: `rotate(${p.rot}deg) scale(${p.s})`,
          }}
        >
          <img
            src="/paw-print-silhouette.png"
            alt=""
            width={40}
            height={40}
            draggable={false}
            className="h-10 w-10 select-none object-contain sm:h-11 sm:w-11"
          />
        </div>
      ))}
    </div>
  )
}

function toLocalDateOnly(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/** 自然周：周一为起点 */
function startOfWeekMonday(d) {
  const x = toLocalDateOnly(d)
  const day = x.getDay()
  const diff = day === 0 ? -6 : 1 - day
  x.setDate(x.getDate() + diff)
  return x
}

function endOfWeekSunday(monday) {
  const s = new Date(monday)
  s.setDate(s.getDate() + 6)
  return s
}

function formatChineseDate(d) {
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

function getWeekRangeKey(date = new Date()) {
  const mon = startOfWeekMonday(date)
  const sun = endOfWeekSunday(mon)
  return `${formatChineseDate(mon)} - ${formatChineseDate(sun)}`
}

function getWeekStartMs(date = new Date()) {
  return startOfWeekMonday(date).getTime()
}

function parseWeekKeyStartMs(weekKey) {
  const m = String(weekKey).match(/^(\d+)年(\d+)月(\d+)日/)
  if (!m) return 0
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getTime()
}

function formatTodayLine(date) {
  const cn = formatChineseDate(date)
  const wd = WEEKDAY_LABELS[date.getDay()]
  return `今天是 ${cn} ${wd}`
}

function emptyTasksMap() {
  return Object.fromEntries(DIMENSION_TITLES.map((t) => [t, []]))
}

function createEmptyWeekPayload(date = new Date()) {
  return {
    tasks: emptyTasksMap(),
    summary: '',
    weekStart: getWeekStartMs(date),
  }
}

function normalizeTask(raw) {
  if (!raw || typeof raw !== 'object') return null
  const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id : null
  const text = typeof raw.text === 'string' ? raw.text : String(raw.text ?? '')
  if (!id) return null
  const completed = Boolean(raw.completed)
  let priority = raw.priority
  if (priority !== 'high' && priority !== 'medium' && priority !== 'low') {
    priority = 'medium'
  }
  return { id, text, completed, priority }
}

function sanitizeWeekRecord(raw, weekKey) {
  const tasks = emptyTasksMap()
  const src = raw && typeof raw === 'object' && raw.tasks && typeof raw.tasks === 'object' ? raw.tasks : {}
  for (const title of DIMENSION_TITLES) {
    if (Array.isArray(src[title])) {
      tasks[title] = src[title].map(normalizeTask).filter(Boolean)
    }
  }
  const summary = typeof raw?.summary === 'string' ? raw.summary : ''
  let weekStart =
    typeof raw?.weekStart === 'number' && Number.isFinite(raw.weekStart)
      ? raw.weekStart
      : parseWeekKeyStartMs(weekKey)
  return { tasks, summary, weekStart }
}

function sanitizeWeeksMap(weeks) {
  const next = {}
  if (!weeks || typeof weeks !== 'object') return next
  for (const key of Object.keys(weeks)) {
    next[key] = sanitizeWeekRecord(weeks[key], key)
  }
  return next
}

function sortTasksForSection(tasks) {
  const list = [...tasks]
  list.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1
    const pa = PRIORITY_ORDER[a.priority] ?? PRIORITY_ORDER.medium
    const pb = PRIORITY_ORDER[b.priority] ?? PRIORITY_ORDER.medium
    return pa - pb
  })
  return list
}

function formatProgress(completed, total) {
  if (total === 0) return '0.00'
  return ((completed / total) * 100).toFixed(2)
}

function nextPriority(p) {
  const c = p === 'high' || p === 'medium' || p === 'low' ? p : 'medium'
  if (c === 'high') return 'medium'
  if (c === 'medium') return 'low'
  return 'high'
}

function safePriority(p) {
  return p === 'high' || p === 'medium' || p === 'low' ? p : 'medium'
}

function loadFromDisk() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      if (data?.formatVersion === 2 && data.weeks && typeof data.weeks === 'object') {
        return sanitizeWeeksMap(data.weeks)
      }
    }
  } catch {
    /* ignore */
  }
  return null
}

function migrateLegacyStore() {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!data || typeof data !== 'object') return null
    const key = getWeekRangeKey(new Date())
    const tasks = emptyTasksMap()
    const sections = data.sections && typeof data.sections === 'object' ? data.sections : {}
    for (const [legacyId, arr] of Object.entries(sections)) {
      const title = LEGACY_ID_TO_TITLE[legacyId]
      if (title && Array.isArray(arr)) {
        tasks[title] = arr.map(normalizeTask).filter(Boolean)
      }
    }
    const summary = typeof data.weeklyReview === 'string' ? data.weeklyReview : ''
    return {
      [key]: {
        tasks,
        summary,
        weekStart: getWeekStartMs(new Date()),
      },
    }
  } catch {
    return null
  }
}

function persistStore(weeks) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ formatVersion: 2, weeks }),
    )
  } catch {
    /* quota */
  }
}

function cloneWeeks(weeks) {
  return JSON.parse(JSON.stringify(weeks))
}

let cachedBoot

function computeBootState() {
  if (cachedBoot) return cachedBoot
  let weeks = loadFromDisk()
  if (!weeks || Object.keys(weeks).length === 0) {
    weeks = migrateLegacyStore() ?? {}
  }
  weeks = sanitizeWeeksMap(weeks)
  const now = new Date()
  const currentKey = getWeekRangeKey(now)
  if (!weeks[currentKey]) {
    weeks = { ...weeks, [currentKey]: createEmptyWeekPayload(now) }
  }
  cachedBoot = {
    weeks: cloneWeeks(weeks),
    selectedWeekKey: currentKey,
  }
  return cachedBoot
}

const btnSquish = 'transition-all duration-200 active:scale-95'

export default function App() {
  const [weeks, setWeeks] = useState(() => cloneWeeks(computeBootState().weeks))
  const [selectedWeekKey, setSelectedWeekKey] = useState(
    () => computeBootState().selectedWeekKey,
  )
  const [now, setNow] = useState(() => new Date())
  const [drafts, setDrafts] = useState(() =>
    Object.fromEntries(DIMENSION_TITLES.map((t) => [t, ''])),
  )
  const [addPriority, setAddPriority] = useState(() =>
    Object.fromEntries(DIMENSION_TITLES.map((t) => [t, 'medium'])),
  )
  const [removingIds, setRemovingIds] = useState(() => new Set())
  /** 完成任务时爪印动画 tick，按 taskId 记录 */
  const [pawAnim, setPawAnim] = useState({})

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const currentWeekKey = getWeekRangeKey(now)

  useEffect(() => {
    const id = window.setTimeout(() => {
      setWeeks((prev) => {
        if (prev[currentWeekKey]) return prev
        return {
          ...prev,
          [currentWeekKey]: createEmptyWeekPayload(new Date()),
        }
      })
    }, 0)
    return () => window.clearTimeout(id)
  }, [currentWeekKey])

  useEffect(() => {
    if (!selectedWeekKey || weeks[selectedWeekKey]) return
    const id = window.setTimeout(() => {
      setSelectedWeekKey(currentWeekKey)
    }, 0)
    return () => window.clearTimeout(id)
  }, [weeks, selectedWeekKey, currentWeekKey])

  useEffect(() => {
    const t = window.setTimeout(() => persistStore(weeks), 380)
    return () => window.clearTimeout(t)
  }, [weeks])

  const effectiveWeekKey = weeks[selectedWeekKey] ? selectedWeekKey : currentWeekKey
  const isReadOnly = effectiveWeekKey !== currentWeekKey

  const weekData = weeks[effectiveWeekKey] ?? createEmptyWeekPayload(now)
  const tasksMap = weekData.tasks

  const sortedWeekKeys = useMemo(() => {
    return Object.keys(weeks).sort((a, b) => {
      const ta = weeks[a]?.weekStart ?? parseWeekKeyStartMs(a)
      const tb = weeks[b]?.weekStart ?? parseWeekKeyStartMs(b)
      return tb - ta
    })
  }, [weeks])

  const globalStats = useMemo(() => {
    let total = 0
    let done = 0
    for (const title of DIMENSION_TITLES) {
      const list = tasksMap[title] ?? []
      total += list.length
      done += list.filter((t) => t.completed).length
    }
    return {
      total,
      done,
      pct: formatProgress(done, total),
    }
  }, [tasksMap])

  const sectionStats = useMemo(() => {
    const map = {}
    for (const title of DIMENSION_TITLES) {
      const list = tasksMap[title] ?? []
      const total = list.length
      const done = list.filter((t) => t.completed).length
      map[title] = { total, done, pct: formatProgress(done, total) }
    }
    return map
  }, [tasksMap])

  const updateWeekData = useCallback((updater) => {
    if (isReadOnly) return
    setWeeks((prev) => {
      const cur = prev[effectiveWeekKey]
      if (!cur) return prev
      const nextRecord = updater(cur)
      return { ...prev, [effectiveWeekKey]: nextRecord }
    })
  }, [effectiveWeekKey, isReadOnly])

  const addTask = useCallback(
    (title) => {
      if (isReadOnly) return
      const text = drafts[title]?.trim()
      if (!text) return
      const priority = addPriority[title] ?? 'medium'
      const task = {
        id:
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `t-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        text,
        completed: false,
        priority,
      }
      updateWeekData((w) => ({
        ...w,
        tasks: {
          ...w.tasks,
          [title]: [...(w.tasks[title] ?? []), task],
        },
      }))
      setDrafts((d) => ({ ...d, [title]: '' }))
    },
    [addPriority, drafts, isReadOnly, updateWeekData],
  )

  const toggleTask = useCallback(
    (title, taskId) => {
      if (isReadOnly) return
      updateWeekData((w) => ({
        ...w,
        tasks: {
          ...w.tasks,
          [title]: (w.tasks[title] ?? []).map((t) =>
            t.id === taskId ? { ...t, completed: !t.completed } : t,
          ),
        },
      }))
    },
    [isReadOnly, updateWeekData],
  )

  const flashPawOnComplete = useCallback((task) => {
    if (task.completed) return
    setPawAnim((m) => ({ ...m, [task.id]: (m[task.id] ?? 0) + 1 }))
    window.setTimeout(() => {
      setPawAnim((m) => {
        const next = { ...m }
        delete next[task.id]
        return next
      })
    }, 780)
  }, [])

  const handleTaskCheck = useCallback(
    (title, task) => {
      if (isReadOnly) return
      flashPawOnComplete(task)
      toggleTask(title, task.id)
    },
    [flashPawOnComplete, isReadOnly, toggleTask],
  )

  const deleteTask = useCallback(
    (title, taskId) => {
      if (isReadOnly) return
      setRemovingIds((s) => new Set(s).add(taskId))
      window.setTimeout(() => {
        updateWeekData((w) => ({
          ...w,
          tasks: {
            ...w.tasks,
            [title]: (w.tasks[title] ?? []).filter((t) => t.id !== taskId),
          },
        }))
        setRemovingIds((s) => {
          const n = new Set(s)
          n.delete(taskId)
          return n
        })
      }, 220)
    },
    [isReadOnly, updateWeekData],
  )

  const cycleTaskPriority = useCallback(
    (title, taskId) => {
      if (isReadOnly) return
      updateWeekData((w) => ({
        ...w,
        tasks: {
          ...w.tasks,
          [title]: (w.tasks[title] ?? []).map((t) =>
            t.id === taskId ? { ...t, priority: nextPriority(t.priority) } : t,
          ),
        },
      }))
    },
    [isReadOnly, updateWeekData],
  )

  const sortSection = useCallback(
    (title) => {
      if (isReadOnly) return
      updateWeekData((w) => ({
        ...w,
        tasks: {
          ...w.tasks,
          [title]: sortTasksForSection(w.tasks[title] ?? []),
        },
      }))
    },
    [isReadOnly, updateWeekData],
  )

  const setSummary = useCallback(
    (value) => {
      if (isReadOnly) return
      updateWeekData((w) => ({ ...w, summary: value }))
    },
    [isReadOnly, updateWeekData],
  )

  const cardBase =
    'flex flex-col rounded-3xl border bg-white/95 p-6 shadow-sm backdrop-blur-[2px] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.995]'

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#FFFDF9] text-gray-900 antialiased">
      <CatPawBackdrop />
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="relative mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="text-center sm:text-left">
              <p className="text-sm font-medium tabular-nums text-stone-500">
                {formatTodayLine(now)}
              </p>
              <p className="mt-1 text-xs text-stone-400">
                本期自然周（周一至周日）：{currentWeekKey}
              </p>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-stone-800 sm:text-3xl">
                八大生命维度 · 周计划
                <span className="ml-2 inline-block text-lg">🐾</span>
              </h1>
              {isReadOnly ? (
                <p className="mt-2 text-sm text-stone-500">
                  正在查看：<span className="font-medium text-stone-700">{effectiveWeekKey}</span>
                </p>
              ) : null}
            </div>

            <div className="flex flex-col items-stretch gap-2 sm:min-w-[280px] sm:items-end">
              <label className="text-xs font-medium text-stone-400 sm:text-right">历史周次</label>
              <select
                value={effectiveWeekKey}
                onChange={(e) => setSelectedWeekKey(e.target.value)}
                className={`w-full rounded-2xl border border-stone-200/90 bg-white/90 px-3 py-2.5 text-sm text-stone-800 shadow-sm outline-none transition-all hover:border-amber-200 focus:border-amber-300 focus:ring-2 focus:ring-amber-100 sm:max-w-xs sm:text-right ${btnSquish}`}
              >
                {sortedWeekKeys.map((key) => (
                  <option key={key} value={key}>
                    {key}
                    {key === currentWeekKey ? '（本周）' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isReadOnly ? (
            <div className="mt-4 rounded-2xl border border-amber-200/90 bg-amber-50/95 px-4 py-3 text-center text-sm text-amber-900">
              历史记录仅供查看
            </div>
          ) : null}

          <div className="mx-auto mt-6 flex max-w-2xl flex-col items-center gap-4 sm:flex-row sm:items-center">
            <div className="relative shrink-0">
              <div
                className="flex items-center justify-center rounded-2xl bg-[#FFFDF9] p-1.5 shadow-sm ring-1 ring-stone-100/70"
                style={{ isolation: 'isolate' }}
              >
                {/* 白底插画：multiply + 与页面同底色容器，视觉上抠除白底 */}
                <img
                  src="/section-kitty-watermark.png"
                  alt="小猫"
                  width={96}
                  height={96}
                  draggable={false}
                  className="h-20 w-20 object-contain mix-blend-multiply contrast-[1.04] sm:h-24 sm:w-24"
                />
              </div>
            </div>
            <div className="w-full min-w-0 flex-1 rounded-3xl border border-stone-100/90 bg-white/90 p-6 shadow-sm backdrop-blur-sm transition-all hover:shadow-md">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-stone-700">
                  {isReadOnly ? '该周总进度' : '一周总进度'}
                </span>
                <span className="tabular-nums text-stone-500">{globalStats.pct}%</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-stone-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-400 via-blue-400 to-cyan-300 transition-[width] duration-500 ease-out"
                  style={{
                    width: `${globalStats.total === 0 ? 0 : (globalStats.done / globalStats.total) * 100}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-stone-400">
                {globalStats.done} / {globalStats.total} 项已完成 · 和小猫一起打卡喵
              </p>
            </div>
          </div>
        </header>

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {DIMENSIONS.map(({ title, Icon, border, iconColor, hoverShadow }) => {
            const stats = sectionStats[title]
            const tasks = tasksMap[title] ?? []
            const widthPct = stats.total === 0 ? 0 : (stats.done / stats.total) * 100
            const cardClass = [cardBase, border, hoverShadow].join(' ')

            return (
              <section key={title} className={cardClass}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFFDF9]/90 ${iconColor} ring-1 ring-stone-200/60 transition-all hover:scale-105 active:scale-95`}
                    >
                      <Icon className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <div>
                      <h2 className="text-base font-semibold text-stone-800">{title}</h2>
                      <p className="text-xs text-stone-400">
                        {stats.done}/{stats.total} 完成
                      </p>
                    </div>
                  </div>
                  {!isReadOnly ? (
                    <button
                      type="button"
                      title="一键排序：未完成按优先级，已完成置底"
                      onClick={() => sortSection(title)}
                      className={`rounded-xl p-2 text-stone-400 transition-all hover:bg-stone-50 hover:text-stone-700 ${btnSquish}`}
                    >
                      <ArrowDownWideNarrow className="h-4 w-4" />
                    </button>
                  ) : (
                    <span className="w-9" aria-hidden />
                  )}
                </div>

                <div className="mt-4">
                  <div className="mb-1 flex justify-end">
                    <span className="text-xs tabular-nums text-stone-400">{stats.pct}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-400 via-blue-400 to-cyan-300 transition-[width] duration-500 ease-out"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>

                {tasks.length === 0 ? (
                  <div className="mt-6 flex flex-col items-center justify-center py-3 text-center">
                    <p className="text-xs leading-relaxed text-stone-400">
                      主人还没给我布置任务喵~
                    </p>
                  </div>
                ) : (
                  <ul className="mt-5 flex flex-1 flex-col gap-2">
                    {tasks.map((task) => {
                      const isRemoving = removingIds.has(task.id)
                      return (
                        <li
                          key={task.id}
                          className={[
                            'group relative flex items-start gap-2 rounded-2xl border border-transparent bg-[#FFFDF9]/80 px-3 py-2.5 transition-all duration-200 ease-out',
                            isRemoving
                              ? 'pointer-events-none scale-95 opacity-0'
                              : 'opacity-100',
                            task.completed ? 'opacity-60' : '',
                          ].join(' ')}
                        >
                          <input
                            type="checkbox"
                            checked={task.completed}
                            disabled={isReadOnly}
                            onChange={() => handleTaskCheck(title, task)}
                            className={`mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded-md border-stone-300 accent-amber-500 transition-all duration-200 focus:ring-2 focus:ring-amber-200 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 ${btnSquish}`}
                            aria-label={task.completed ? '标记未完成' : '标记完成'}
                          />
                          <div className="relative min-w-0 flex-1">
                            {pawAnim[task.id] !== undefined ? (
                              <span
                                key={pawAnim[task.id]}
                                className="pointer-events-none absolute -top-1 left-1/2 z-10 -translate-x-1/2 text-amber-600/90 animate-paw-flash"
                              >
                                <PawMiniSvg className="h-7 w-7" />
                              </span>
                            ) : null}
                            <p
                              className={[
                                'relative z-0 text-sm leading-snug text-stone-800 transition-colors duration-200',
                                task.completed ? 'line-through decoration-stone-300' : '',
                              ].join(' ')}
                            >
                              {task.text}
                            </p>
                            <div className="mt-1.5 flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                disabled={isReadOnly}
                                onClick={() => cycleTaskPriority(title, task.id)}
                                className={`inline-flex items-center gap-1.5 rounded-full py-0.5 pl-0.5 pr-2 text-[11px] text-stone-500 transition-all hover:bg-white disabled:pointer-events-none disabled:opacity-50 ${btnSquish}`}
                                title="点击切换优先级"
                              >
                                <span
                                  className={[
                                    'inline-block h-2.5 w-2.5 rounded-full ring-2 ring-offset-1 ring-offset-[#FFFDF9]',
                                    PRIORITY_DOT[safePriority(task.priority)],
                                    PRIORITY_RING[safePriority(task.priority)],
                                  ].join(' ')}
                                />
                                <span className="text-stone-400">
                                  {PRIORITY_LABEL[safePriority(task.priority)]}
                                </span>
                              </button>
                            </div>
                          </div>
                          {!isReadOnly ? (
                            <button
                              type="button"
                              onClick={() => deleteTask(title, task.id)}
                              className={`shrink-0 rounded-lg p-1.5 text-stone-300 opacity-0 transition-all duration-200 hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100 ${btnSquish}`}
                              aria-label="删除任务"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          ) : null}
                        </li>
                      )
                    })}
                  </ul>
                )}

                {!isReadOnly ? (
                  <div className="mt-4 space-y-2 border-t border-stone-100 pt-4">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-stone-400">
                      新任务 · 优先级
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {['high', 'medium', 'low'].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() =>
                            setAddPriority((prev) => ({ ...prev, [title]: p }))
                          }
                          className={[
                            'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] transition-all',
                            addPriority[title] === p
                              ? 'bg-stone-800 text-white shadow-sm'
                              : 'bg-stone-100 text-stone-500 hover:bg-stone-200',
                            btnSquish,
                          ].join(' ')}
                        >
                          <span
                            className={['h-2 w-2 rounded-full', PRIORITY_DOT[p]].join(' ')}
                          />
                          {PRIORITY_LABEL[p]}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-stretch gap-2">
                      <input
                        value={drafts[title]}
                        onChange={(e) =>
                          setDrafts((d) => ({ ...d, [title]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addTask(title)
                          }
                        }}
                        placeholder="输入任务，回车添加"
                        className="min-w-0 flex-1 rounded-2xl border border-stone-200/90 bg-white/70 px-4 py-2.5 text-sm text-stone-800 outline-none transition-all placeholder:text-stone-400 focus:border-amber-300 focus:bg-white focus:ring-2 focus:ring-amber-100"
                      />
                      <button
                        type="button"
                        onClick={() => addTask(title)}
                        className={`min-h-[44px] min-w-[72px] shrink-0 rounded-full border border-stone-200/90 bg-stone-100 px-5 py-2.5 text-sm font-medium text-black shadow-sm transition-all hover:bg-stone-200/80 ${btnSquish}`}
                      >
                        添加
                      </button>
                    </div>
                  </div>
                ) : null}
              </section>
            )
          })}
        </div>

        <section className="mt-12 rounded-3xl border border-stone-100/90 bg-white/90 p-6 shadow-sm backdrop-blur-sm transition-all hover:shadow-md sm:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-stone-800">一周复盘</h2>
              <p className="text-sm text-stone-500">
                {isReadOnly
                  ? '以下为该周已保存的复盘内容。'
                  : '记录本周感受与下周调整，内容会自动保存到本地。'}
              </p>
            </div>
            {!isReadOnly ? (
              <span className="text-xs text-stone-400">已开启本地自动保存</span>
            ) : null}
          </div>
          <textarea
            value={weekData.summary}
            readOnly={isReadOnly}
            onChange={(e) => setSummary(e.target.value)}
            rows={6}
            className="mt-4 w-full resize-y rounded-2xl border border-stone-200/90 bg-[#FFFDF9]/50 px-4 py-3 text-sm leading-relaxed text-stone-800 outline-none transition-all placeholder:text-stone-400 focus:border-amber-300 focus:bg-white focus:ring-2 focus:ring-amber-100 read-only:cursor-default read-only:bg-stone-50 read-only:text-stone-700"
            placeholder={
              isReadOnly ? '' : '本周做得好的地方、需要改进的节奏、想对自己说的话……'
            }
          />
        </section>
      </div>
    </div>
  )
}
