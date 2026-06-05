import { useState, useEffect } from 'react';

export const STAGES = [
  { id: 'todo',        label: 'To Do' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'review',      label: 'Review' },
  { id: 'done',        label: 'Done' },
];

// Update B and C once teammates fill in PRD §8
export const TEAM = ['Edgard', 'Teammate B', 'Teammate C'];

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw != null ? JSON.parse(raw) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }, [key, value]);

  return [value, setValue];
}

const SEED_TASKS = [
  {
    id: 'seed-1',
    title: 'Set up Kanban board layout',
    description: 'Build the four-column board with Tailwind CSS.',
    type: 'feature',
    status: 'done',
    assignee: 'Edgard',
    dueDate: '2026-06-05',
    createdDate: '2026-06-05',
    context: '',
    contextTool: null,
    contextUpdatedAt: null,
  },
  {
    id: 'seed-2',
    title: 'Add task modal (CRUD)',
    description: 'Modal for creating and editing tasks with all fields.',
    type: 'feature',
    status: 'in-progress',
    assignee: 'Edgard',
    dueDate: '2026-06-06',
    createdDate: '2026-06-05',
    context: '',
    contextTool: null,
    contextUpdatedAt: null,
  },
  {
    id: 'seed-3',
    title: 'Fix header alignment bug',
    description: 'Header overlaps content on smaller screens.',
    type: 'bug',
    status: 'todo',
    assignee: 'Teammate B',
    dueDate: '2026-06-08',
    createdDate: '2026-06-05',
    context: '',
    contextTool: null,
    contextUpdatedAt: null,
  },
  {
    id: 'seed-4',
    title: 'Design color palette',
    description: 'Pick brand colors and fill in DESIGN.md.',
    type: 'feature',
    status: 'review',
    assignee: 'Teammate B',
    dueDate: '2026-06-05',
    createdDate: '2026-06-05',
    context: '',
    contextTool: null,
    contextUpdatedAt: null,
  },
];

const EMPTY_FORM = {
  title: '',
  description: '',
  type: 'feature',
  status: 'todo',
  assignee: TEAM[0],
  dueDate: '',
};

function TaskModal({ task, onSave, onDelete, onClose }) {
  const isNew = !task.id;
  const [form, setForm] = useState({
    title:       task.title       ?? '',
    description: task.description ?? '',
    type:        task.type        ?? 'feature',
    status:      task.status      ?? 'todo',
    assignee:    task.assignee    ?? TEAM[0],
    dueDate:     task.dueDate     ?? '',
  });

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function handleSave() {
    if (!form.title.trim()) return;
    onSave({
      ...task,
      ...form,
      title: form.title.trim(),
      id: task.id ?? String(Date.now()),
      createdDate: task.createdDate ?? new Date().toISOString().slice(0, 10),
      dueDate: form.dueDate || null,
      context: task.context ?? '',
      contextTool: task.contextTool ?? null,
      contextUpdatedAt: task.contextUpdatedAt ?? null,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-textprimary/50 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surfacepage rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="text-base font-semibold font-heading text-textprimary">
            {isNew ? 'New task' : 'Edit task'}
          </h2>
          <button
            onClick={onClose}
            className="text-textmuted hover:text-textprimary text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="px-5 py-2 flex flex-col gap-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-textmuted mb-1">Title *</label>
            <input
              autoFocus
              type="text"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="What needs to be done?"
              className="w-full rounded-lg bg-brandprimary px-3 py-2 text-sm text-textprimary placeholder-textmuted focus:outline-none focus:ring-2 focus:ring-brandaccent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-textmuted mb-1">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="More details..."
              className="w-full rounded-lg bg-brandprimary px-3 py-2 text-sm text-textprimary placeholder-textmuted focus:outline-none focus:ring-2 focus:ring-brandaccent resize-none"
            />
          </div>

          {/* Type + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-textmuted mb-1">Type</label>
              <select
                value={form.type}
                onChange={e => set('type', e.target.value)}
                className="w-full rounded-lg bg-brandprimary px-3 py-2 text-sm text-textprimary focus:outline-none focus:ring-2 focus:ring-brandaccent"
              >
                <option value="feature">Feature</option>
                <option value="bug">Bug</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-textmuted mb-1">Status</label>
              <select
                value={form.status}
                onChange={e => set('status', e.target.value)}
                className="w-full rounded-lg bg-brandprimary px-3 py-2 text-sm text-textprimary focus:outline-none focus:ring-2 focus:ring-brandaccent"
              >
                {STAGES.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Assignee + Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-textmuted mb-1">Assignee</label>
              <select
                value={form.assignee}
                onChange={e => set('assignee', e.target.value)}
                className="w-full rounded-lg bg-brandprimary px-3 py-2 text-sm text-textprimary focus:outline-none focus:ring-2 focus:ring-brandaccent"
              >
                {TEAM.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-textmuted mb-1">Due date</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={e => set('dueDate', e.target.value)}
                className="w-full rounded-lg bg-brandprimary px-3 py-2 text-sm text-textprimary focus:outline-none focus:ring-2 focus:ring-brandaccent"
              />
            </div>
          </div>

          {/* TODO M9 task-context: add Context textarea + AI tool dropdown here */}
        </div>

        <div className="flex items-center justify-between px-5 py-4 mt-2">
          {!isNew ? (
            <button
              onClick={() => {
                if (window.confirm("Are you sure? Deleting can't be undone.")) onDelete(task.id);
              }}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Delete task
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg bg-brandprimary text-textprimary hover:shadow-md transition-shadow"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!form.title.trim()}
              className="px-4 py-2 text-sm rounded-lg bg-textprimary text-surfacepage font-medium hover:shadow-md transition-shadow disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isNew ? '+ add Task' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskCard({ task, onClick }) {
  const isFeature = task.type === 'feature';

  return (
    <div
      onClick={() => onClick(task)}
      className="bg-surfacecard rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-sm font-light text-textprimary leading-snug">{task.title}</span>
        {/* TODO M6 tag-style: replace these colors with type-feature / type-bug tokens */}
        <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
          isFeature ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
        }`}>
          {task.type}
        </span>
      </div>

      {task.description && (
        <p className="text-xs text-textmuted mb-3 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-textmuted">{task.dueDate ?? 'No due date'}</span>
        <span className="text-xs bg-brandprimary text-textprimary rounded-full px-2 py-0.5 font-medium">
          {task.assignee}
        </span>
      </div>
    </div>
  );
}

function Column({ stage, tasks, onCardClick }) {
  return (
    <div className="flex flex-col flex-1 min-w-0">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-textmuted">
          {stage.label}
        </h2>
        <span className="text-xs bg-brandprimary text-textprimary rounded-full w-5 h-5 flex items-center justify-center font-medium">
          {tasks.length}
        </span>
      </div>

      <div className="flex flex-col gap-2 flex-1 rounded-xl bg-brandprimary/40 p-2 min-h-32">
        {tasks.length === 0 ? (
          <div className="flex-1 flex items-center justify-center rounded-lg py-8">
            <span className="text-xs text-textmuted">-</span>
          </div>
        ) : (
          tasks.map(task => (
            <TaskCard key={task.id} task={task} onClick={onCardClick} />
          ))
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [tasks, setTasks] = useLocalStorage('vibetracker.tasks', SEED_TASKS);
  const [editing, setEditing] = useState(null); // null = closed, {} = new task, task object = edit

  function openNew() {
    setEditing({ ...EMPTY_FORM });
  }

  function handleSave(task) {
    setTasks(prev =>
      prev.some(t => t.id === task.id)
        ? prev.map(t => t.id === task.id ? task : t)
        : [...prev, task]
    );
    setEditing(null);
  }

  function handleDelete(id) {
    setTasks(prev => prev.filter(t => t.id !== id));
    setEditing(null);
  }

  // TODO M11 anchors: const [anchors, setAnchors] = useLocalStorage('vibetracker.anchors', [...]);

  return (
    <div className="min-h-screen bg-surfacepage p-6">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading text-textprimary">Vibecoding Project Tracker</h1>
          <p className="text-sm text-textmuted">Ibiza Disco</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 bg-textprimary text-surfacepage text-sm font-medium px-4 py-2 rounded-lg hover:shadow-md transition-shadow"
        >
          + add Task
        </button>
      </header>

      {/* TODO M11 anchors: render Anchor Board (Presentation / Demo / Report / Documentation) */}

      <main className="grid grid-cols-4 gap-4">
        {STAGES.map(stage => (
          <Column
            key={stage.id}
            stage={stage}
            tasks={tasks.filter(t => t.status === stage.id)}
            onCardClick={setEditing}
          />
        ))}
      </main>

      {editing !== null && (
        <TaskModal
          task={editing}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
