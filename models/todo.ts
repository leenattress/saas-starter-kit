import { prisma } from '@/lib/prisma';

interface CreateTodoParams {
  title: string;
  description?: string;
  userId: string;
  teamId: string;
  completed?: boolean;
  parentId?: string;
  hasChildren?: boolean;
}

interface UpdateTodoParams {
  title?: string;
  description?: string;
  completed?: boolean;
  hasChildren?: boolean;
}

interface DeleteTodoParams {
  id: string;
}

export const createTodo = async (params: CreateTodoParams) => {
  const { title, description, userId, teamId, parentId, completed = false, hasChildren = false } = params;

  const todo = await prisma.todo.create({
    data: {
      title,
      description,
      completed,
      user: { connect: { id: userId } },
      teamId,
      parentId: parentId ? parentId : teamId,
      hasChildren
    },
  });

  // If a parent todo exists, update it to indicate it has children
  if (todo && parentId) {
    await prisma.todo.update({
      where: { id: parentId },
      data: { hasChildren: true }
    });
  }
};

export const fetchTodos = async (teamId: string, parentId?: string) => {
  return prisma.todo.findMany({
    where: {
      teamId,
      parentId: parentId || undefined
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
};

export const getTodo = async (id: string) => {
  return prisma.todo.findUnique({
    where: {
      id,
    },
  });
};

export const updateTodo = async (id: string, data: UpdateTodoParams) => {
  return prisma.todo.update({
    where: {
      id
    },
    data,
  });
};

export const deleteTodo = async ({ id }: DeleteTodoParams) => {
  // Get the todo we're deleting to find its parent
  const todo = await prisma.todo.findUnique({
    where: { id }
  });

  // Delete the todo
  await prisma.todo.delete({
    where: { id }
  });

  // If todo had a parent, check if it was the last child
  if (todo?.parentId) {
    const remainingSiblings = await prisma.todo.count({
      where: { parentId: todo.parentId }
    });

    // If no siblings left, update parent hasChildren to false
    if (remainingSiblings === 0) {
      await prisma.todo.update({
        where: { id: todo.parentId },
        data: { hasChildren: false }
      });
    }
  }
};
