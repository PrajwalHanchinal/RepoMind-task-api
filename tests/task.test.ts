import request from 'supertest';
import { app, resetStore } from '../src/index';

beforeEach(() => {
  resetStore();
});

describe('GET /tasks', () => {
  it('returns an empty array when no tasks exist', async () => {
    const res = await request(app).get('/tasks');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns all created tasks', async () => {
    await request(app).post('/tasks').send({ title: 'Task A' });
    await request(app).post('/tasks').send({ title: 'Task B' });

    const res = await request(app).get('/tasks');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].title).toBe('Task A');
    expect(res.body[1].title).toBe('Task B');
  });
});

describe('POST /tasks', () => {
  it('creates a task with required title', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ title: 'Fix login bug', description: 'Users cannot log in' });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe('1');
    expect(res.body.title).toBe('Fix login bug');
    expect(res.body.description).toBe('Users cannot log in');
    expect(res.body.status).toBe('pending');
    expect(res.body.createdAt).toBeDefined();
  });

  it('creates a task with a custom status', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ title: 'Already done', status: 'done' });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('done');
  });

  it('returns 400 when title is missing', async () => {
    const res = await request(app).post('/tasks').send({ description: 'no title' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('title is required');
  });

  it('returns 400 when title is an empty string', async () => {
    const res = await request(app).post('/tasks').send({ title: '   ' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('title is required');
  });

  it('assigns incrementing ids across multiple creates', async () => {
    const r1 = await request(app).post('/tasks').send({ title: 'First' });
    const r2 = await request(app).post('/tasks').send({ title: 'Second' });
    expect(r1.body.id).toBe('1');
    expect(r2.body.id).toBe('2');
  });
});

describe('GET /tasks/:id', () => {
  it('returns the correct task by id', async () => {
    await request(app).post('/tasks').send({ title: 'Target task' });

    const res = await request(app).get('/tasks/1');
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Target task');
  });

  it('returns 404 for a non-existent id', async () => {
    const res = await request(app).get('/tasks/999');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Task not found');
  });
});

describe('DELETE /tasks/:id', () => {
  it('deletes an existing task and returns 204', async () => {
    await request(app).post('/tasks').send({ title: 'To delete' });

    const del = await request(app).delete('/tasks/1');
    expect(del.status).toBe(204);

    // Confirm it no longer exists
    const get = await request(app).get('/tasks/1');
    expect(get.status).toBe(404);
  });

  it('returns 404 when deleting a non-existent task', async () => {
    const res = await request(app).delete('/tasks/999');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Task not found');
  });

  it('does not affect other tasks when one is deleted', async () => {
    await request(app).post('/tasks').send({ title: 'Keep me' });
    await request(app).post('/tasks').send({ title: 'Delete me' });

    await request(app).delete('/tasks/2');

    const res = await request(app).get('/tasks');
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe('Keep me');
  });
});
