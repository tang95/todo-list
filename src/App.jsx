import { useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'todo-list-mvp'
const FILTERS = {
  all: '全部',
  active: '未完成',
  completed: '已完成',
}

const QUICK_TIPS = [
  '用一句清晰的话描述任务，避免含糊目标。',
  '优先处理 1-3 个最重要的待办，保持专注。',
  '完成后及时清理列表，让页面始终轻盈。',
]

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
  const completionRate = todos.length === 0 ? 0 : Math.round((completedCount / todos.length) * 100)

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

  const resetEditing = () => {
    setEditingId(null)
    setEditingTitle('')
  }

  const saveEdit = (id) => {
    const title = editingTitle.trim()
    if (!title) return

    setTodos((current) =>
      current.map((todo) => (todo.id === id ? { ...todo, title } : todo)),
    )
    resetEditing()
  }

  const clearCompleted = () => {
    setTodos((current) => current.filter((todo) => !todo.completed))
  }

  return (
    <main className="app-shell">
      <div className="decor decor-left" aria-hidden="true" />
      <div className="decor decor-right" aria-hidden="true" />

      <section className="app-card">
        <header className="hero">
          <div className="hero-copy">
            <span className="eyebrow">Simple Todo List</span>
            <h1>保持简单清爽，把待办整理得更舒服。</h1>
            <p>
              用更柔和的层次、留白和信息分组来管理任务；核心操作依旧直接，页面也更轻盈。
            </p>
          </div>

          <div className="stats-grid" aria-label="任务统计">
            <StatCard label="全部任务" value={todos.length} helper="当前记录" />
            <StatCard label="待完成" value={remainingCount} helper="优先处理" accent="emerald" />
            <StatCard label="已完成" value={completedCount} helper="今天进度" accent="amber" />
          </div>
        </header>

        <div className="content-grid">
          <section className="panel panel-primary">
            <form className="composer" onSubmit={handleSubmit}>
              <div>
                <label className="section-label" htmlFor="todo-input">
                  添加新任务
                </label>
                <p className="section-help">输入一条简洁的待办事项，按回车或点击按钮即可加入列表。</p>
              </div>

              <div className="composer-row">
                <input
                  id="todo-input"
                  className="text-input"
                  placeholder="例如：整理本周工作计划"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                />
                <button type="submit" className="primary-button">
                  添加任务
                </button>
              </div>
            </form>

            <div className="toolbar">
              <div className="filter-group" role="tablist" aria-label="任务筛选">
                {Object.entries(FILTERS).map(([value, label]) => {
                  const active = filter === value
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFilter(value)}
                      className={`filter-chip ${active ? 'active' : ''}`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>

              <span className="toolbar-note">完成率 {completionRate}%</span>
            </div>

            <section className="todo-list" aria-live="polite">
              {visibleTodos.length > 0 ? (
                visibleTodos.map((todo) => {
                  const isEditing = editingId === todo.id

                  return (
                    <article key={todo.id} className={`todo-item ${todo.completed ? 'is-complete' : ''}`}>
                      <button
                        type="button"
                        onClick={() => toggleTodo(todo.id)}
                        className={`check-button ${todo.completed ? 'checked' : ''}`}
                        aria-label={todo.completed ? '标记为未完成' : '标记为已完成'}
                      >
                        <span className="check-dot" />
                      </button>

                      <div className="todo-body">
                        {isEditing ? (
                          <div className="editor-block">
                            <input
                              className="text-input"
                              value={editingTitle}
                              onChange={(event) => setEditingTitle(event.target.value)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter') saveEdit(todo.id)
                                if (event.key === 'Escape') resetEditing()
                              }}
                              autoFocus
                            />
                            <div className="action-row">
                              <button type="button" onClick={() => saveEdit(todo.id)} className="primary-button small">
                                保存
                              </button>
                              <button type="button" onClick={resetEditing} className="ghost-button small">
                                取消
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="todo-heading">
                              <h2>{todo.title}</h2>
                              <span className="status-badge">{todo.completed ? '已完成' : '进行中'}</span>
                            </div>
                            <p className="todo-meta">
                              创建于{' '}
                              {new Date(todo.createdAt).toLocaleString('zh-CN', {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })}
                            </p>
                          </>
                        )}
                      </div>

                      {!isEditing && (
                        <div className="action-row action-row-end">
                          <button type="button" onClick={() => startEditing(todo)} className="ghost-button small">
                            编辑
                          </button>
                          <button type="button" onClick={() => deleteTodo(todo.id)} className="danger-button small">
                            删除
                          </button>
                        </div>
                      )}
                    </article>
                  )
                })
              ) : (
                <div className="empty-state">
                  <div className="empty-icon" aria-hidden="true">
                    ☁️
                  </div>
                  <h2>当前列表很清爽</h2>
                  <p>添加一条待办，或者切换筛选查看其他状态的任务。</p>
                </div>
              )}
            </section>
          </section>

          <aside className="panel panel-secondary">
            <section>
              <p className="section-label">今日进度</p>
              <div className="progress-card">
                <div className="progress-track">
                  <div className="progress-value" style={{ width: `${completionRate}%` }} />
                </div>
                <div className="progress-summary">
                  <strong>{completionRate}%</strong>
                  <span>
                    已完成 {completedCount} / {todos.length} 项
                  </span>
                </div>
              </div>
            </section>

            <section>
              <p className="section-label">使用建议</p>
              <ul className="tips-list">
                {QUICK_TIPS.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </section>

            <section className="summary-card">
              <div>
                <p className="section-label">快速整理</p>
                <p className="section-help">当已完成任务较多时，一键清理可以让页面继续保持整洁。</p>
              </div>
              <button
                type="button"
                onClick={clearCompleted}
                disabled={completedCount === 0}
                className="ghost-button full-width"
              >
                清理已完成任务
              </button>
            </section>
          </aside>
        </div>
      </section>
    </main>
  )
}

function StatCard({ label, value, helper, accent = 'blue' }) {
  return (
    <div className={`stat-card accent-${accent}`}>
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{helper}</span>
    </div>
  )
}

export default App
