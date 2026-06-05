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

function TaskCard({ task, onClick }) {
  const isFeature = task.type === 'feature';

  return (
    <div
      onClick={() => onClick(task)}
      className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-sm font-medium text-slate-900 leading-snug">{task.title}</span>
        <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
          isFeature ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
        }`}>
          {task.type}
        </span>
      </div>

      {task.description && (
        <p className="text-xs text-slate-500 mb-3 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">{task.dueDate ?? 'No due date'}</span>
        <span className="text-xs bg-slate-100 text-slate-600 rounded-full px-2 py-0.5 font-medium">
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
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {stage.label}
        </h2>
        <span className="text-xs bg-slate-200 text-slate-600 rounded-full w-5 h-5 flex items-center justify-center font-medium">
          {tasks.length}
        </span>
      </div>

      <div className="flex flex-col gap-2 flex-1 rounded-xl bg-slate-50 p-2 min-h-32">
        {tasks.length === 0 ? (
          <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg py-8">
            <span className="text-xs text-slate-400">Nothing here yet</span>
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
  // TODO M5 crud-modal: replace the second element with setTasks and wire up the modal
  const [tasks] = useLocalStorage('vibetracker.tasks', SEED_TASKS);

  // TODO M5 crud-modal: const [editing, setEditing] = useState(null);

  // TODO M11 anchors: const [anchors, setAnchors] = useLocalStorage('vibetracker.anchors', [...]);

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <header className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vibecoding Project Tracker</h1>
          <p className="text-sm text-slate-500">Ibiza Disco</p>
        </div>
        {/* TODO M5 crud-modal: add "+" button here */}
      </header>

      {/* TODO M11 anchors: render Anchor Board (Presentation / Demo / Report / Documentation) */}

      <main className="grid grid-cols-4 gap-4">
        {STAGES.map(stage => (
          <Column
            key={stage.id}
            stage={stage}
            tasks={tasks.filter(t => t.status === stage.id)}
            onCardClick={(task) => console.log('clicked', task)} // TODO M5: open modal
          />
        ))}
      </main>
    </div>
  );
}
