import type { NextApiRequest, NextApiResponse } from 'next';
import { createTodo, fetchTodos, getTodo, updateTodo, deleteTodo } from 'models/todo';
import { getSession } from '@/lib/session';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession(req, res);
  if (!session?.user.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Get team ID from query params
  const { teamId, parentId } = req.query;
  if (!teamId || typeof teamId !== 'string') {
    return res.status(400).json({ error: 'Team ID is required' });
  }

  if (parentId && typeof parentId !== 'string') {
    return res.status(400).json({ error: 'Parent ID must be a string' });
  }

  if (req.method === 'GET') {
    // Get all todos for the team
    const todos = await fetchTodos(teamId as string, parentId as string);
    return res.status(200).json(todos);
  }

  if (req.method === 'POST') {
    // Create a new todo
    const { title, description, parentId } = req.body;
    const todo = await createTodo({
      title,
      description,
      userId: session.user.id,
      teamId,
      parentId
    });
    return res.status(201).json(todo);
  }

  if (req.method === 'PUT') {
    // Update todo
    const { id } = req.body;
    const todo = await getTodo(id);
    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    const { completed, title } = req.body;
    const updatedTodo = await updateTodo(id, {
      completed,
      title
    });
    return res.status(200).json(updatedTodo);
  }

  if (req.method === 'DELETE') {
    // Delete todo
    const { id } = req.body;
    await deleteTodo({ id });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
