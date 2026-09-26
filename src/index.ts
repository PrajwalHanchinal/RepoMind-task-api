import express, { Request, Response } from 'express';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'done';
  createdAt: string;
}

export interface CreateTaskBody {
  title: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'done';
}

// In-memory task store
const tasks: Map<string, Task> = new Map();
let nextId = 1;

export const app = express();
app.use(express.json());

// GET /tasks — list all tasks
app.get('/tasks', (_req: Request, res: Response) => {
  res.status(200).json(Array.from(tasks.values()));
});

// POST /tasks — create a task
app.post('/tasks', (req: Request, res: Response) => {
  const body = req.body as CreateTaskBody;

  if (!body.title || typeof body.title !== 'string' || body.title.trim() === '') {
    res.status(400).json({ error: 'title is required' });
    return;
  }

  const task: Task = {
    id: String(nextId++),
    title: body.title.trim(),
    description: body.description ?? '',
    status: body.status ?? 'pending',
    createdAt: new Date().toISOString(),
  };

  tasks.set(task.id, task);
  // BUG: wrong status code — should be 201 Created
  res.status(200).json(task);
});

// GET /tasks/:id — get a single task
app.get('/tasks/:id', (req: Request, res: Response) => {
  const task = tasks.get(req.params.id);
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  res.status(200).json(task);
});

// DELETE /tasks/:id — delete a task
app.delete('/tasks/:id', (req: Request, res: Response) => {
  const exists = tasks.has(req.params.id);
  if (!exists) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  tasks.delete(req.params.id);
  res.status(204).send();
});

// Reset store (used in tests)
export function resetStore(): void {
  tasks.clear();
  nextId = 1;
}

// Only start the server if this file is run directly
if (require.main === module) {
  const PORT = process.env.PORT ?? 3001;
  app.listen(PORT, () => {
    console.log(`Task API listening on port ${PORT}`);
  });
}
