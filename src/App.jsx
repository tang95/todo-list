import { useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'todo-list-mvp'
const FILTERS = {
  all: '全部',
  active: '未完成',
  completed: '已完成',
}
const PRIORITIES = {
  high: {
    label: '高优先级',
    order: 0,
  },
  medium: {
    label: '中优先级',
    order: 1,
  },
  low: {
    label: '低优先级',
    order: 2,
  },
}
const PRIORITY_OPTIONS = Object.entries(PRIORITIES)
const DEFAULT_PRIORITY = 'medium'

const QUICK_TIPS = [
  '优先写下最重要的 1-3 件事。',
  '任务标题尽量短，方便快速浏览。',
  '完成后及时清理，让列表保持轻盈。',
]

const normalizePriority = (priority) => (PRIORITIES[priority] ? priority : DEFAULT_PRIORITY)

const createTodo = (title, priority) => ({
  id: crypto.randomUUID(),
  title: title.trim(),
  priority: normalizePriority(priority),
  completed: false,
  createdAt: new Date().toISOString(),
})

const sortTodos = (items) =>
  [...items].sort((first, second) => {
    const priorityDelta = PRIORITIES[first.priority].order - PRIORITIES[second.priority].order
    if (priorityDelta !== 0) return priorityDelta

    return new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
  })

const loadTodos = () => {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)
    return Array.isArray(parsed)
      ? sortTodos(
          parsed.map((todo) => ({
            ...todo,
            priority: normalizePriority(todo.priority),
          })),
        )
      : []
  } catch {
    return []
  }
}

function App() {
  const [todos, setTodos] = useState(() => loadTodos())
  const [draft, setDraft] = useState('')
  const [draftPriority, setDraftPriority] = useState(DEFAULT_PRIORITY)
  const [filter, setFilter] = useState('all')
  const [editingId, setEditingId] = useState(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [editingPriority, setEditingPriority] = useState(DEFAULT_PRIORITY)

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
  const prioritySummary = PRIORITY_OPTIONS.map(([value, config]) => ({
    value,
    label: config.label,
    count: todos.filter((todo) => todo.priority === value && !todo.completed).length,
  }))

  const handleSubmit = (event) => {
    event.preventDefault()
    const title = draft.trim()
    if (!title) return

    setTodos((current) => sortTodos([createTodo(title, draftPriority), ...current]))
    setDraft('')
    setDraftPriority(DEFAULT_PRIORITY)
  }

  const toggleTodo = (id) => {
    setTodos((current) =>
      sortTodos(
        current.map((todo) =>
          todo.id === id ? { ...todo, completed: !todo.completed } : todo,
        ),
      ),
    )
  }

  const deleteTodo = (id) => {
    setTodos((current) => current.filter((todo) => todo.id !== id))

    if (editingId === id) {
      setEditingId(null)
      setEditingTitle('')
      setEditingPriority(DEFAULT_PRIORITY)
    }
  }

  const startEditing = (todo) => {
    setEditingId(todo.id)
    setEditingTitle(todo.title)
    setEditingPriority(todo.priority)
  }

  const resetEditing = () => {
    setEditingId(null)
    setEditingTitle('')
    setEditingPriority(DEFAULT_PRIORITY)
  }

  const saveEdit = (id) => {
    const title = editingTitle.trim()
    if (!title) return

    setTodos((current) =>
      sortTodos(
        current.map((todo) => (todo.id === id ? { ...todo, title, priority: editingPriority } : todo)),
      ),
    )
    resetEditing()
  }

  const clearCompleted = () => {
    setTodos((current) => current.filter((todo) => !todo.completed))
  }

  return (
    <main className="app-shell">
      <section className="app-container">
        <header className="page-header">
          <div>
            <span className="eyebrow">Simple Todo List</span>
            <h1>更简单的待办列表</h1>
            <p>去掉一块块 card，改成更轻的清单视图，方便快速添加、查看和整理任务。</p>
          </div>
          <button
            type="button"
            onClick={clearCompleted}
            disabled={completedCount === 0}
            className="ghost-button"
          >
            清理已完成
          </button>
        </header>

        <section className="summary-strip" aria-label="任务概览">
          <div className="summary-item">
            <span>全部</span>
            <strong>{todos.length}</strong>
          </div>
          <div className="summary-item">
            <span>待完成</span>
            <strong>{remainingCount}</strong>
          </div>
          <div className="summary-item">
            <span>已完成</span>
            <strong>{completedCount}</strong>
          </div>
          <div className="summary-item summary-progress">
            <span>完成率</span>
            <strong>{completionRate}%</strong>
            <div className="progress-track" aria-hidden="true">
              <div className="progress-value" style={{ width: `${completionRate}%` }} />
            </div>
          </div>
        </section>

        <form className="composer" onSubmit={handleSubmit}>
          <input
            id="todo-input"
            className="text-input"
            placeholder="例如：整理本周工作计划"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <label className="priority-field" htmlFor="todo-priority">
            <span>优先级</span>
            <select
              id="todo-priority"
              className="select-input"
              value={draftPriority}
              onChange={(event) => setDraftPriority(event.target.value)}
            >
              {PRIORITY_OPTIONS.map(([value, config]) => (
                <option key={value} value={value}>
                  {config.label}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="primary-button">
            添加任务
          </button>
        </form>

        <section className="sub-toolbar">
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

          <div className="sub-toolbar-meta">
            <span>默认按优先级排序</span>
            <ul className="priority-summary-list">
              {prioritySummary.map((item) => (
                <li key={item.value} className={`priority-badge priority-${item.value}`}>
                  {item.label} {item.count}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="todo-list" aria-live="polite">
          {visibleTodos.length > 0 ? (
            visibleTodos.map((todo) => {
              const isEditing = editingId === todo.id
              const priorityConfig = PRIORITIES[todo.priority]

              return (
                <article key={todo.id} className={`todo-row ${todo.completed ? 'is-complete' : ''}`}>
                  <button
                    type="button"
                    onClick={() => toggleTodo(todo.id)}
                    className={`check-button ${todo.completed ? 'checked' : ''}`}
                    aria-label={todo.completed ? '标记为未完成' : '标记为已完成'}
                  >
                    <span className="check-dot" />
                  </button>

                  <div className="todo-main">
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
                        <div className="editor-actions">
                          <label className="priority-field priority-field-inline" htmlFor={`priority-${todo.id}`}>
                            <span>优先级</span>
                            <select
                              id={`priority-${todo.id}`}
                              className="select-input"
                              value={editingPriority}
                              onChange={(event) => setEditingPriority(event.target.value)}
                            >
                              {PRIORITY_OPTIONS.map(([value, config]) => (
                                <option key={value} value={value}>
                                  {config.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          <div className="action-row">
                            <button type="button" onClick={() => saveEdit(todo.id)} className="primary-button small">
                              保存
                            </button>
                            <button type="button" onClick={resetEditing} className="ghost-button small">
                              取消
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="todo-line">
                          <h2>{todo.title}</h2>
                          <span className={`priority-badge priority-${todo.priority}`}>{priorityConfig.label}</span>
                          <span className="status-text">{todo.completed ? '已完成' : '进行中'}</span>
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
              <h2>当前列表很清爽</h2>
              <p>添加一条待办，或者切换筛选查看其他状态的任务。</p>
            </div>
          )}
        </section>

        <footer className="page-footer">
          <p className="tips-title">简单使用建议</p>
          <ul className="tips-list">
            {QUICK_TIPS.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </footer>
      </section>
    </main>
  )
}

export default App
