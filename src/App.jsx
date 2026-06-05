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
  title: 'new task',
  description: 'fill in description',
  type: 'feature',
  status: 'todo',
  assignee: TEAM[0],
  dueDate: '',
  contextTool: '',
};

const INITIAL_ANCHORS = [
  { id: 'presentation',  label: 'Presentation',  url: '' },
  { id: 'demo',          label: 'Demo',          url: '' },
  { id: 'report',        label: 'Report',        url: '' },
  { id: 'documentation', label: 'Documentation', url: '' },
];

function getDueBg(dueDate, status) {
  if (status === 'done') return 'bg-dueneutral/40';
  if (!dueDate) return 'bg-surfacecard';
  const diffHours = (new Date(dueDate) - new Date()) / 36e5;
  if (diffHours < 0)  return 'bg-dueoverdue/60';
  if (diffHours < 24) return 'bg-duewarning/60';
  return 'bg-duesafe/40';
}

function getInitials(name) {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function InitialsBadge({ name, size = 'sm' }) {
  const sizeClass = size === 'lg'
    ? 'w-8 h-8 text-sm'
    : 'w-6 h-6 text-xs';
  return (
    <span className={`${sizeClass} rounded-full bg-brandaccent text-textprimary font-semibold flex items-center justify-center shrink-0`}>
      {getInitials(name)}
    </span>
  );
}

function Toast({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-textprimary text-surfacepage text-sm px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in">
      {message}
    </div>
  );
}

function formatLastUpdated(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  if (dateString.length === 10) {
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
  
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function TaskModal({ task, onSave, onDelete, onClose, onHandoff }) {
  const isNew = !task.id;
  const [form, setForm] = useState({
    title:       task.title       ?? '',
    description: task.description ?? '',
    type:        task.type        ?? 'feature',
    status:      task.status      ?? 'todo',
    assignee:    task.assignee    ?? TEAM[0],
    dueDate:     task.dueDate     ?? '',
    contextTool: task.contextTool ?? '',
  });
  const [copied, setCopied] = useState(false);

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function handleCopyContext() {
    const textToCopy = `**${form.title}**\n${form.description}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
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
      contextTool: form.contextTool || null,
      contextUpdatedAt: form.contextTool !== (task.contextTool ?? '') ? new Date().toISOString() : task.contextUpdatedAt,
      updatedAt: new Date().toISOString(),
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
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-textmuted">Context</label>
              <button
                type="button"
                onClick={handleCopyContext}
                className="text-xs bg-brandprimary text-textprimary px-2.5 py-0.5 rounded-md hover:shadow-sm transition-shadow font-medium"
              >
                {copied ? 'copied ✓' : 'Copy Context'}
              </button>
            </div>
            <textarea
              rows={3}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="More details..."
              className="w-full rounded-lg bg-brandprimary px-3 py-2 text-sm text-textprimary placeholder-textmuted focus:outline-none focus:ring-2 focus:ring-brandaccent resize-none"
            />
            {!isNew && (
              <div className="mt-1 text-right">
                <span className="text-[10px] text-textmuted select-none">
                  Last updated: {formatLastUpdated(task.updatedAt || task.createdDate)}
                </span>
              </div>
            )}
          </div>

          {/* Type + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-textmuted mb-1">Type</label>
              <div className="flex gap-2">
                {[
                  { value: 'feature', icon: '✦', label: 'Feature' },
                  { value: 'bug',     icon: '⚠', label: 'Bug' },
                ].map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => set('type', t.value)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-shadow ${
                      form.type === t.value
                        ? t.value === 'feature'
                          ? 'bg-feature/20 text-feature shadow-md'
                          : 'bg-bug/20 text-bug shadow-md'
                        : 'bg-brandprimary text-textmuted hover:shadow-sm'
                    }`}
                  >
                    <span>{t.icon}</span>{t.label}
                  </button>
                ))}
              </div>
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
              <label className="block text-xs font-medium text-textmuted mb-1">Due date</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={e => set('dueDate', e.target.value)}
                className="w-full rounded-lg bg-brandprimary px-3 py-2 text-sm text-textprimary focus:outline-none focus:ring-2 focus:ring-brandaccent"
              />
            </div>
          </div>

          {/* M7 task-owner: Hand off */}
          <div>
            <label className="block text-xs font-medium text-textmuted mb-2">
              {isNew ? 'Assign to' : 'Owner'}
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {TEAM.map(name => (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    if (!isNew && name !== form.assignee) onHandoff(name);
                    set('assignee', name);
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-shadow ${
                    form.assignee === name
                      ? 'bg-textprimary text-surfacepage shadow-md'
                      : 'bg-brandprimary text-textprimary hover:shadow-sm'
                  }`}
                >
                  <InitialsBadge name={name} />
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* AI Tool */}
          <div>
            <label className="block text-xs font-medium text-textmuted mb-1">AI Tool</label>
            <select
              value={form.contextTool}
              onChange={e => set('contextTool', e.target.value)}
              className="w-full rounded-lg bg-brandprimary px-3 py-2 text-sm text-textprimary focus:outline-none focus:ring-2 focus:ring-brandaccent"
            >
              <option value="">None / Select AI Tool</option>
              <option value="Claude">Claude</option>
              <option value="ChatGPT">ChatGPT</option>
              <option value="Cursor">Cursor</option>
              <option value="Lovable">Lovable</option>
              <option value="Replit">Replit</option>
              <option value="Other">Other</option>
            </select>
          </div>
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

  function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', task.id);
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={() => onClick(task)}
      className={`${getDueBg(task.dueDate, task.status)} rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-grab select-none`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-sm font-light text-textprimary leading-snug">{task.title}</span>
        <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${
          isFeature ? 'bg-feature/20 text-feature' : 'bg-bug/20 text-bug'
        }`}>
          <span>{isFeature ? '✦' : '⚠'}</span>
          {task.type}
        </span>
      </div>

      {task.description && (
        <p className="text-xs text-textmuted mb-3 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-textmuted">{task.dueDate ?? 'No due date'}</span>
        <div className="flex items-center gap-1.5">
          <InitialsBadge name={task.assignee} />
          <span className="text-xs text-textmuted font-medium">{task.assignee}</span>
        </div>
      </div>
    </div>
  );
}

function Column({ stage, tasks, onCardClick, onDragDrop }) {
  const [isOver, setIsOver] = useState(false);

  function handleDragOver(e) {
    e.preventDefault();
  }

  function handleDragEnter(e) {
    e.preventDefault();
    setIsOver(true);
  }

  function handleDragLeave() {
    setIsOver(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsOver(false);
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      onDragDrop(taskId, stage.id);
    }
  }

  return (
    <div
      className="flex flex-col flex-1 min-w-0"
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-base font-normal text-textmuted">
          {stage.label}
        </h2>
        <span className="text-xs bg-brandprimary text-textprimary rounded-full w-5 h-5 flex items-center justify-center font-medium">
          {tasks.length}
        </span>
      </div>

      <div className={`flex flex-col gap-2 flex-1 rounded-xl p-2 min-h-32 transition-colors duration-200 ${
        isOver ? 'bg-brandprimary/70' : 'bg-brandprimary/40'
      }`}>
        {tasks.length === 0 ? (
          <div className="flex-1 flex items-center justify-center rounded-lg py-8 bg-brandprimary/30">
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
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(null);

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

  function handleDragDrop(taskId, targetStageId) {
    setTasks(prev =>
      prev.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            status: targetStageId,
            updatedAt: new Date().toISOString(),
          };
        }
        return t;
      })
    );
  }

  function handleDelete(id) {
    setTasks(prev => prev.filter(t => t.id !== id));
    setEditing(null);
  }

  function handleHandoff(name) {
    setToast(`Handed off to ${name}.`);
  }

  const [anchors, setAnchors] = useLocalStorage('vibetracker.anchors', INITIAL_ANCHORS);

  function handleAnchorChange(id, url) {
    setAnchors(prev => prev.map(a => a.id === id ? { ...a, url } : a));
  }

  return (
    <div className="min-h-screen bg-surfacepage p-6">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-normal font-heading text-textprimary">Vibecoding Project Tracker</h1>
          <p className="text-sm text-textmuted">Ibiza Disco</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 bg-textprimary text-surfacepage text-sm font-medium px-4 py-2 rounded-lg hover:shadow-md transition-shadow"
        >
          + add Task
        </button>
      </header>

      {/* Anchor Board */}
      <section className="mb-8">
        <div className="grid grid-cols-4 gap-4">
          {anchors.map(anchor => {
            const hasLink = anchor.url && anchor.url.trim() !== '';
            return (
              <div
                key={anchor.id}
                className="bg-brandprimary/40 rounded-xl p-3.5 flex flex-col gap-2.5 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-textmuted select-none">{anchor.label}</span>
                  <div
                    className={`w-3 h-3 rounded-full border transition-all duration-300 ${
                      hasLink
                        ? 'bg-feature border-feature shadow-[0_0_6px_rgba(1,101,9,0.5)]'
                        : 'border-textmuted/60 bg-transparent'
                    }`}
                    title={hasLink ? 'Completed' : 'Pending link'}
                  />
                </div>
                <div className="relative flex items-center">
                  <input
                    type="url"
                    value={anchor.url || ''}
                    onChange={e => handleAnchorChange(anchor.id, e.target.value)}
                    placeholder="Enter URL..."
                    className="w-full rounded-lg bg-surfacepage px-3 py-1.5 pr-8 text-xs text-textprimary placeholder-textmuted/50 border-0 focus:outline-none focus:ring-2 focus:ring-brandaccent transition-all"
                  />
                  {hasLink && (
                    <a
                      href={anchor.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute right-2.5 text-textmuted hover:text-textprimary transition-colors text-xs flex items-center"
                      title={`Open ${anchor.label} link`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <main className="grid grid-cols-4 gap-4">
        {STAGES.map(stage => (
          <Column
            key={stage.id}
            stage={stage}
            tasks={tasks.filter(t => t.status === stage.id)}
            onCardClick={setEditing}
            onDragDrop={handleDragDrop}
          />
        ))}
      </main>

      {editing !== null && (
        <TaskModal
          task={editing}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setEditing(null)}
          onHandoff={handleHandoff}
        />
      )}

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

      {/* Legend for task colors */}
      <div className="fixed bottom-6 right-6 z-40 bg-surfacecard/95 backdrop-blur-sm p-3.5 rounded-xl shadow-lg border border-brandprimary/40 flex flex-col gap-2 text-xs font-sans text-textprimary w-48">
        <h3 className="font-semibold text-textmuted text-[10px] uppercase tracking-wider mb-1 select-none">Task Urgency</h3>
        <div className="flex items-center gap-2.5">
          <div className="w-3.5 h-3.5 rounded bg-duesafe/40 border border-textmuted/10 shrink-0" />
          <span className="text-[11px] text-textprimary">More than 2 days out</span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-3.5 h-3.5 rounded bg-duewarning/60 border border-textmuted/10 shrink-0" />
          <span className="text-[11px] text-textprimary">Less than 24 hours</span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-3.5 h-3.5 rounded bg-dueoverdue/60 border border-textmuted/10 shrink-0" />
          <span className="text-[11px] text-textprimary">Past due (Overdue)</span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-3.5 h-3.5 rounded bg-dueneutral/40 border border-textmuted/10 shrink-0" />
          <span className="text-[11px] text-textprimary">Done / Completed</span>
        </div>
      </div>
    </div>
  );
}
