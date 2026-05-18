import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import {
  ArrowDownWideNarrow,
  BookOpen,
  Briefcase,
  Gamepad2,
  HeartPulse,
  Home,
  Loader2,
  Rocket,
  Trash2,
  Users,
  Wallet,
  X,
} from 'lucide-react'

// ─── Supabase ───────────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://bymywnsdmfdvrgxdbpkq.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5bXl3bnNkbWZkdnJneGRicGtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNjk1NDYsImV4cCI6MjA5NDY0NTU0Nn0.nWKCB8NKr68qbjJ7fNrbigjHFaC2RpfreUC4vqBdx54'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const STORAGE_KEY = 'life-week-planner-weeks-v2'
const LEGACY_STORAGE_KEY = 'life-dimensions-week-planner'
const SUMMARY_SYNC_DEBOUNCE_MS = 1000

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

const btnSquish = 'transition-all duration-200 active:scale-95 hover:scale-[1.02]'

// ─── Helpers ────────────────────────────────────────────────────────────────

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

function emailPrefix(email) {
  if (!email) return '喵友'
  const at = email.indexOf('@')
  return at > 0 ? email.slice(0, at) : email
}

function toLocalDateOnly(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

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
  const src =
    raw && typeof raw === 'object' && raw.tasks && typeof raw.tasks === 'object'
      ? raw.tasks
      : {}
  for (const title of DIMENSION_TITLES) {
    if (Array.isArray(src[title])) {
      tasks[title] = src[title].map(normalizeTask).filter(Boolean)
    }
  }
  const summary = typeof raw?.summary === 'string' ? raw.summary : ''
  const weekStart =
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

function weekRecordToCloudData(weekRecord) {
  return {
    tasks: weekRecord.tasks,
    summary: weekRecord.summary,
    weekStart: weekRecord.weekStart,
  }
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

// ─── Supabase data layer ────────────────────────────────────────────────────

async function fetchWeekFromCloud(userId, weekKey) {
  const { data, error } = await supabase
    .from('user_plans')
    .select('data')
    .eq('user_id', userId)
    .eq('week_range', weekKey)
    .maybeSingle()
  if (error) throw error
  if (!data?.data) return null
  return sanitizeWeekRecord(data.data, weekKey)
}

async function fetchAllWeeksFromCloud(userId) {
  const { data, error } = await supabase
    .from('user_plans')
    .select('week_range, data')
    .eq('user_id', userId)
  if (error) throw error
  const map = {}
  for (const row of data ?? []) {
    if (row.week_range && row.data) {
      map[row.week_range] = sanitizeWeekRecord(row.data, row.week_range)
    }
  }
  return map
}

async function upsertWeekToCloud(userId, weekKey, weekRecord) {
  const { error } = await supabase.from('user_plans').upsert(
    {
      user_id: userId,
      week_range: weekKey,
      data: weekRecordToCloudData(weekRecord),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,week_range' },
  )
  if (error) throw error
}

async function upsertAllWeeksToCloud(userId, weeksMap) {
  const rows = Object.entries(weeksMap).map(([weekKey, record]) => ({
    user_id: userId,
    week_range: weekKey,
    data: weekRecordToCloudData(record),
    updated_at: new Date().toISOString(),
  }))
  if (rows.length === 0) return
  const { error } = await supabase.from('user_plans').upsert(rows, {
    onConflict: 'user_id,week_range',
  })
  if (error) throw error
}

function mergeLocalAndCloud(localWeeks, cloudWeeks) {
  const merged = { ...sanitizeWeeksMap(cloudWeeks) }
  for (const [key, record] of Object.entries(sanitizeWeeksMap(localWeeks))) {
    merged[key] = record
  }
  return merged
}

// ─── Auth Modal ─────────────────────────────────────────────────────────────

function AuthModal({
  open,
  mode,
  email,
  password,
  error,
  busy,
  onClose,
  onModeChange,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-stone-900/30 backdrop-blur-sm"
        onClick={onClose}
        aria-label="关闭"
      />
      <div
        className="relative w-full max-w-md rounded-3xl border border-rose-100/90 bg-[#FFFBFC] p-6 shadow-xl shadow-rose-100/50 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className={`absolute right-4 top-4 rounded-full p-1.5 text-stone-400 hover:bg-rose-50 hover:text-stone-600 ${btnSquish}`}
          aria-label="关闭"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6 text-center">
          <span className="text-3xl" aria-hidden>
            🐾
          </span>
          <h2
            id="auth-modal-title"
            className="mt-2 text-xl font-semibold text-stone-800"
          >
            {mode === 'login' ? '欢迎回来喵' : '加入猫咪周计划'}
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            {mode === 'login'
              ? '登录后，周计划将同步到云端'
              : '注册账号，多端同步你的成长记录'}
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit()
          }}
          className="space-y-4"
        >
          <div>
            <label className="mb-1.5 block text-xs font-medium text-stone-500">
              邮箱
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-2xl border border-stone-200/90 bg-white px-4 py-3 text-sm text-stone-800 outline-none transition-all focus:border-amber-300 focus:ring-2 focus:ring-amber-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-stone-500">
              密码
            </label>
            <input
              type="password"
              required
              minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="至少 6 位"
              className="w-full rounded-2xl border border-stone-200/90 bg-white px-4 py-3 text-sm text-stone-800 outline-none transition-all focus:border-amber-300 focus:ring-2 focus:ring-amber-100"
            />
          </div>

          {error ? (
            <p className="rounded-2xl bg-rose-50 px-3 py-2 text-center text-sm text-rose-600">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className={`flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-amber-200/60 disabled:opacity-60 ${btnSquish}`}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {mode === 'login' ? '登录' : '注册'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-stone-500">
          {mode === 'login' ? '还没有账号？' : '已有账号？'}
          <button
            type="button"
            onClick={() => onModeChange(mode === 'login' ? 'signup' : 'login')}
            className={`ml-1 font-medium text-amber-600 hover:text-amber-700 ${btnSquish}`}
          >
            {mode === 'login' ? '去注册' : '去登录'}
          </button>
        </p>
      </div>
    </div>
  )
}

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
  const [pawAnim, setPawAnim] = useState({})

  const [authUser, setAuthUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authBusy, setAuthBusy] = useState(false)
  const [cloudSyncing, setCloudSyncing] = useState(false)
  const [weekLoading, setWeekLoading] = useState(false)

  const authUserRef = useRef(null)
  const weeksRef = useRef(weeks)
  const loginMergeDoneRef = useRef(false)

  useEffect(() => {
    authUserRef.current = authUser
  }, [authUser])

  useEffect(() => {
    weeksRef.current = weeks
  }, [weeks])

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      setAuthUser(session?.user ?? null)
      setAuthReady(true)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null)
      if (!session?.user) {
        loginMergeDoneRef.current = false
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const performLoginMerge = useCallback(async (user) => {
    setCloudSyncing(true)
    try {
      const localWeeks = weeksRef.current
      const cloudWeeks = await fetchAllWeeksFromCloud(user.id)
      const merged = mergeLocalAndCloud(localWeeks, cloudWeeks)
      const nowDate = new Date()
      const currentKey = getWeekRangeKey(nowDate)
      if (!merged[currentKey]) {
        merged[currentKey] = createEmptyWeekPayload(nowDate)
      }
      const final = sanitizeWeeksMap(merged)
      setWeeks(cloneWeeks(final))
      persistStore(final)
      await upsertAllWeeksToCloud(user.id, final)
    } catch (err) {
      console.error('登录同步失败', err)
    } finally {
      setCloudSyncing(false)
    }
  }, [])

  useEffect(() => {
    if (!authReady || !authUser || loginMergeDoneRef.current) return
    loginMergeDoneRef.current = true
    performLoginMerge(authUser)
  }, [authReady, authUser, performLoginMerge])

  const syncWeekToCloud = useCallback(async (weekKey, weekRecord) => {
    const user = authUserRef.current
    if (!user || !weekRecord) return
    try {
      await upsertWeekToCloud(user.id, weekKey, weekRecord)
    } catch (err) {
      console.error('云端同步失败', err)
    }
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

  const updateWeekData = useCallback(
    (updater, { cloudSync = true } = {}) => {
      if (isReadOnly) return
      setWeeks((prev) => {
        const cur = prev[effectiveWeekKey]
        if (!cur) return prev
        const nextRecord = updater(cur)
        const next = { ...prev, [effectiveWeekKey]: nextRecord }
        if (cloudSync && authUserRef.current) {
          upsertWeekToCloud(authUserRef.current.id, effectiveWeekKey, nextRecord).catch(
            console.error,
          )
        }
        return next
      })
    },
    [effectiveWeekKey, isReadOnly],
  )

  useEffect(() => {
    if (!authUser || isReadOnly) return
    const t = window.setTimeout(() => {
      const record = weeksRef.current[effectiveWeekKey]
      if (record) syncWeekToCloud(effectiveWeekKey, record)
    }, SUMMARY_SYNC_DEBOUNCE_MS)
    return () => window.clearTimeout(t)
  }, [weekData.summary, authUser, effectiveWeekKey, isReadOnly, syncWeekToCloud])

  const handleWeekSelect = useCallback(
    async (weekKey) => {
      setSelectedWeekKey(weekKey)
      const user = authUserRef.current
      if (!user) return
      setWeekLoading(true)
      try {
        const remote = await fetchWeekFromCloud(user.id, weekKey)
        if (remote) {
          setWeeks((prev) => ({ ...prev, [weekKey]: remote }))
        }
      } catch (err) {
        console.error('拉取周数据失败', err)
      } finally {
        setWeekLoading(false)
      }
    },
    [],
  )

  const handleAuthSubmit = useCallback(async () => {
    setAuthError('')
    setAuthBusy(true)
    try {
      if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email: authEmail.trim(),
          password: authPassword,
        })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail.trim(),
          password: authPassword,
        })
        if (error) throw error
      }
      setAuthModalOpen(false)
      setAuthPassword('')
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        loginMergeDoneRef.current = true
        await performLoginMerge(user)
      }
    } catch (err) {
      setAuthError(err?.message ?? '认证失败，请稍后再试')
    } finally {
      setAuthBusy(false)
    }
  }, [authEmail, authMode, authPassword, performLoginMerge])

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut()
    loginMergeDoneRef.current = false
  }, [])

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
      updateWeekData((w) => ({ ...w, summary: value }), { cloudSync: false })
    },
    [isReadOnly, updateWeekData],
  )

  const cardBase =
    'flex flex-col rounded-3xl border bg-white/95 p-6 shadow-sm backdrop-blur-[2px] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.995]'

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#FFF6F9] text-gray-900 antialiased">
      <AuthModal
        open={authModalOpen}
        mode={authMode}
        email={authEmail}
        password={authPassword}
        error={authError}
        busy={authBusy}
        onClose={() => {
          setAuthModalOpen(false)
          setAuthError('')
        }}
        onModeChange={(m) => {
          setAuthMode(m)
          setAuthError('')
        }}
        onEmailChange={setAuthEmail}
        onPasswordChange={setAuthPassword}
        onSubmit={handleAuthSubmit}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="relative mb-8">
          <div className="mb-4 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
            {authReady ? (
              authUser ? (
                <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
                  <span className="rounded-full border border-amber-100/90 bg-white/90 px-4 py-2 text-sm text-stone-700 shadow-sm">
                    🐱{' '}
                    <span className="font-medium text-amber-700">
                      {emailPrefix(authUser.email)}
                    </span>{' '}
                    欢迎回来
                  </span>
                  {cloudSyncing ? (
                    <span className="inline-flex items-center gap-1 text-xs text-stone-400">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      同步中
                    </span>
                  ) : (
                    <span className="text-xs text-emerald-600/90">云端已连接</span>
                  )}
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className={`rounded-full border border-stone-200/90 bg-white/90 px-4 py-2 text-sm text-stone-600 shadow-sm hover:border-rose-200 hover:text-rose-600 ${btnSquish}`}
                  >
                    退出
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(true)}
                  className={`self-end rounded-full border border-amber-200/90 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-2.5 text-sm font-medium text-amber-800 shadow-sm hover:from-amber-100 hover:to-orange-100 ${btnSquish}`}
                >
                  登录同步数据
                </button>
              )
            ) : (
              <span className="self-end text-xs text-stone-400">加载账号…</span>
            )}
          </div>

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
                  正在查看：
                  <span className="font-medium text-stone-700">{effectiveWeekKey}</span>
                  {weekLoading ? (
                    <Loader2 className="ml-1 inline h-3.5 w-3.5 animate-spin text-stone-400" />
                  ) : null}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col items-stretch gap-2 sm:min-w-[280px] sm:items-end">
              <label className="text-xs font-medium text-stone-400 sm:text-right">
                历史周次
              </label>
              <select
                value={effectiveWeekKey}
                onChange={(e) => handleWeekSelect(e.target.value)}
                disabled={weekLoading}
                className={`w-full rounded-2xl border border-stone-200/90 bg-white/90 px-3 py-2.5 text-sm text-stone-800 shadow-sm outline-none transition-all hover:border-amber-200 focus:border-amber-300 focus:ring-2 focus:ring-amber-100 disabled:opacity-60 sm:max-w-xs sm:text-right ${btnSquish}`}
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
                className="flex items-center justify-center rounded-2xl bg-[#FFF6F9] p-1.5 shadow-sm ring-1 ring-stone-100/70"
                style={{ isolation: 'isolate' }}
              >
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
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF6F9]/90 ${iconColor} ring-1 ring-stone-200/60 transition-all hover:scale-105 active:scale-95`}
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
                            'group relative flex items-start gap-2 rounded-2xl border border-transparent bg-[#FFF6F9]/80 px-3 py-2.5 transition-all duration-200 ease-out',
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
                                    'inline-block h-2.5 w-2.5 rounded-full ring-2 ring-offset-1 ring-offset-[#FFF6F9]',
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
                  : authUser
                    ? '记录本周感受，内容会自动保存到本地与云端。'
                    : '记录本周感受与下周调整，内容会自动保存到本地。'}
              </p>
            </div>
            {!isReadOnly ? (
              <span className="text-xs text-stone-400">
                {authUser ? '本地 + 云端自动保存' : '已开启本地自动保存'}
              </span>
            ) : null}
          </div>
          <textarea
            value={weekData.summary}
            readOnly={isReadOnly}
            onChange={(e) => setSummary(e.target.value)}
            rows={6}
            className="mt-4 w-full resize-y rounded-2xl border border-stone-200/90 bg-[#FFF6F9]/50 px-4 py-3 text-sm leading-relaxed text-stone-800 outline-none transition-all placeholder:text-stone-400 focus:border-amber-300 focus:bg-white focus:ring-2 focus:ring-amber-100 read-only:cursor-default read-only:bg-stone-50 read-only:text-stone-700"
            placeholder={
              isReadOnly ? '' : '本周做得好的地方、需要改进的节奏、想对自己说的话……'
            }
          />
        </section>
      </div>
    </div>
  )
}
