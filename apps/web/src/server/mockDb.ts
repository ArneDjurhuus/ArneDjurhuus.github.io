// Simple in-memory mock database for dev/demo
// This resets when the dev server restarts

export type Space = { id: string; name: string; slug: string; plan: 'free' | 'pro' };
export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type Task = {
  id: string;
  spaceId: string;
  title: string;
  status: TaskStatus;
  assigneeId?: string | null;
  dueAt?: string | null; // ISO string
};
export type EventLog = { id: string; spaceId: string; type: string; payload: any; createdAt: string };

let idCounter = 2;
export const spaces: Space[] = [
  { id: '1', name: 'Demo Space', slug: 'demo', plan: 'free' },
];

export const tasks: Task[] = [
  { id: 't1', spaceId: '1', title: 'Welcome to SquadSpace', status: 'todo' },
  { id: 't2', spaceId: '1', title: 'Create your first note', status: 'in_progress' },
  { id: 't3', spaceId: '1', title: 'Drag tasks between columns', status: 'done' },
];

export const events: EventLog[] = [];

export function nextId(prefix = 'id') {
  idCounter += 1;
  return `${prefix}${idCounter}`;
}

export function logEvent(spaceId: string, type: string, payload: any) {
  events.push({ id: nextId('e'), spaceId, type, payload, createdAt: new Date().toISOString() });
}
