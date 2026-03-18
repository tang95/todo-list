import { useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'todo-list-mvp'
const FILTERS = {
  all: '全部',
  active: '未完成',
  completed: '已完成',
}

const createTodo = (title) => ({
  id: crypto.randomUUID(),
  title: title.trim(),
  completed: false,
  createdAt: new Date().toISOString(),
})

const loadTodos = () => {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function App() {
  const [todos, setTodos] = useState(() => loadTodos())
  const [draft, setDraft] = useState('')
  const [filter, setFilter] = useState('all')
  const [editingId, setEditingId] = useState(null)
  const [editingTitle, setEditingTitle] = useState('')

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
  }, [todos])

  const visibleTodos = useMemo(() => {
    switch (filter) {
      case 'active':
        return todos.filter((todo) => !todo.completed)
      case 'completed':
        return todos.filter((todo) => todo.completed)
      default:
        return todos
    }
  }, [filter, todos])

  const completedCount = todos.filter((todo) => todo.completed).length
  const remainingCount = todos.length - completedCount

  const handleSubmit = (event) => {
    event.preventDefault()
    const title = draft.trim()
    if (!title) return

    setTodos((current) => [createTodo(title), ...current])
    setDraft('')
  }

  const toggleTodo = (id) => {
    setTodos((current) =>
      current.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo,
      ),
    )
  }

  const deleteTodo = (id) => {
    setTodos((current) => current.filter((todo) => todo.id !== id))

    if (editingId === id) {
      setEditingId(null)
      setEditingTitle('')
    }
  }

  const startEditing = (todo) => {
    setEditingId(todo.id)
    setEditingTitle(todo.title)
  }

  const saveEdit = (id) => {
    const title = editingTitle.trim()
    if (!title) return

    setTodos((current) =>
      current.map((todo) => (todo.id === id ? { ...todo, title } : todo)),
    )
    setEditingId(null)
    setEditingTitle('')
  }

  const clearCompleted = () => {
    setTodos((current) => current.filter((todo) => !todo.completed))
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-slate-950/40 backdrop-blur">
          <div className="border-b border-white/10 bg-gradient-to-r from-cyan-500/20 via-slate-900 to-violet-500/20 px-6 py-8 sm:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <span className="inline-flex w-fit rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-cyan-200">
                  Personal Todo App
                </span>
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                    专注完成每一件重要的小事
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
                    使用 React + Tailwind 构建的个人版 Todo List MVP，支持新增、编辑、完成、删除、筛选和本地持久化。
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:w-auto">
                <StatCard label="总任务" value={todos.length} />
                <StatCard label="待完成" value={remainingCount} accent="violet" />
              </div>
            </div>
          </div>

          <div className="grid gap-6 px-6 py-6 sm:px-8 lg:grid-cols-[1.4fr_0.8fr]">
            <div className="space-y-6">
              <form className="rounded-2xl border border-white/10 bg-slate-900/70 p-4" onSubmit={handleSubmit}>
                <label className="mb-3 block text-sm font-medium text-slate-200" htmlFor="todo-input">
                  添加新任务
                </label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    id="todo-input"
                    className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none ring-0 transition placeholder:text-slate-500 focus:border-cyan-400/60"
                    placeholder="例如：完成 React + Tailwind Todo App MVP"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                  >
                    添加任务
                  </button>
                </div>
              </form>

              <div className="flex flex-wrap gap-2">
                {Object.entries(FILTERS).map(([value, label]) => {
                  const active = filter === value
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFilter(value)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        active
                          ? 'bg-white text-slate-950'
                          : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>

              <section className="space-y-3">
                {visibleTodos.length > 0 ? (
                  visibleTodos.map((todo) => {
                    const isEditing = editingId === todo.id

                    return (
                      <article
                        key={todo.id}
                        className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-lg shadow-slate-950/20"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex min-w-0 flex-1 gap-3">
                            <button
                              type="button"
                              onClick={() => toggleTodo(todo.id)}
                              className={`mt-1 h-5 w-5 shrink-0 rounded-full border transition ${
                                todo.completed
                                  ? 'border-emerald-300 bg-emerald-300'
                                  : 'border-slate-500 bg-transparent hover:border-cyan-300'
                              }`}
                              aria-label={todo.completed ? '标记为未完成' : '标记为已完成'}
                            />

                            <div className="min-w-0 flex-1">
                              {isEditing ? (
                                <div className="space-y-3">
                                  <input
                                    className="w-full rounded-xl border border-cyan-400/30 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-300"
                                    value={editingTitle}
                                    onChange={(event) => setEditingTitle(event.target.value)}
                                    onKeyDown={(event) => {
                                      if (event.key === 'Enter') saveEdit(todo.id)
                                      if (event.key === 'Escape') {
                                        setEditingId(null)
                                        setEditingTitle('')
                                      }
                                    }}
                                    autoFocus
                                  />
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      onClick={() => saveEdit(todo.id)}
                                      className="rounded-full bg-cyan-400 px-3 py-1.5 text-xs font-semibold text-slate-950"
                                    >
                                      保存
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingId(null)
                                        setEditingTitle('')
                                      }}
                                      className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200"
                                    >
                                      取消
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <h2
                                    className={`text-base font-medium sm:text-lg ${
                                      todo.completed ? 'text-slate-500 line-through' : 'text-slate-100'
                                    }`}
                                  >
                                    {todo.title}
                                  </h2>
                                  <p className="mt-2 text-xs text-slate-500">
                                    创建于 {new Date(todo.createdAt).toLocaleString('zh-CN', {
                                      dateStyle: 'medium',
                                      timeStyle: 'short',
                                    })}
                                  </p>
                                </>
                              )}
                            </div>
                          </div>

                          {!isEditing && (
                            <div className="flex gap-2 sm:justify-end">
                              <button
                                type="button"
                                onClick={() => startEditing(todo)}
                                className="rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
                              >
                                编辑
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteTodo(todo.id)}
                                className="rounded-full border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-xs font-semibold text-rose-200 transition hover:bg-rose-400/20"
                              >
                                删除
                              </button>
                            </div>
                          )}
                        </div>
                      </article>
                    )
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/40 px-6 py-12 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-2xl">
                      ✨
                    </div>
                    <h2 className="text-lg font-semibold text-slate-100">当前列表为空</h2>
                    <p className="mt-2 text-sm text-slate-400">
                      先添加一个任务，或者切换筛选查看其他状态的待办事项。
                    </p>
                  </div>
                )}
              </section>
            </div>

            <aside className="space-y-4 rounded-2xl border border-white/10 bg-slate-900/70 p-5">
              <div>
                <p className="text-sm font-medium text-slate-200">进度总览</p>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-400 transition-all"
                    style={{
                      width: todos.length === 0 ? '0%' : `${(completedCount / todos.length) * 100}%`,
                    }}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  已完成 {completedCount} / {todos.length || 0} 项任务
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                <p className="text-sm font-medium text-slate-200">MVP 功能</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-400">
                  <li>• 新增任务并即时保存到 localStorage</li>
                  <li>• 编辑任务标题并支持 Enter / Esc 快捷键</li>
                  <li>• 标记完成、删除任务、清理已完成项</li>
                  <li>• 按全部 / 未完成 / 已完成筛选</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={clearCompleted}
                disabled={completedCount === 0}
                className="inline-flex w-full items-center justify-center rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-100 transition enabled:hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                清理已完成任务
              </button>
            </aside>
          </div>
        </section>
      </div>
    </main>
  )
}

function StatCard({ label, value, accent = 'cyan' }) {
  const accentStyles = {
    cyan: 'from-cyan-400/20 to-cyan-500/5 text-cyan-100',
    violet: 'from-violet-400/20 to-violet-500/5 text-violet-100',
  }

  return (
    <div className={`rounded-2xl border border-white/10 bg-gradient-to-br p-4 ${accentStyles[accent]}`}>
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  )
}

export default App
