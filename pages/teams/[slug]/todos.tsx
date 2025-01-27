import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useState } from 'react';
import toast from 'react-hot-toast';
import type { NextPageWithLayout } from 'types';
import useTeam from 'hooks/useTeam';
import { Loading, Error } from '@/components/shared';
import useSWR from 'swr';
import fetcher from '@/lib/fetcher';
import { SparklesIcon } from '@heroicons/react/24/outline';


interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
  teamId: string;
  parentId?: string;
  hasChildren: boolean;
  children: Todo[];
  isProcessing?: boolean;
}

const TodoPage: NextPageWithLayout = () => {
  const { t } = useTranslation('common');
  const [newTodo, setNewTodo] = useState('');
  const [editingParentId, setEditingParentId] = useState<string | null>(null);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const { isLoading, isError, team } = useTeam();

  const { data: todos = [], mutate: mutateTodos } = useSWR<Todo[]>(
    team?.id ? `/api/todos?teamId=${team.id}&parentId=${team.id}` : null,
    async (url) => {
      const rootTodos = await fetcher(url);

      const fetchChildren = async (todo: Todo): Promise<Todo> => {
        if (team?.id && todo.hasChildren) {
          const children = await fetcher(`/api/todos?teamId=${team.id}&parentId=${todo.id}`);
          const childrenWithTheirChildren = await Promise.all(children.map(fetchChildren));
          return { ...todo, children: childrenWithTheirChildren };
        }
        return { ...todo, children: [] };
      };

      const todosWithChildren = await Promise.all(rootTodos.map(fetchChildren));
      return todosWithChildren;
    }
  );

  if (isLoading) return <Loading />;
  if (isError) return <Error message={isError.message} />;
  if (!team) return <Error message={t('team-not-found')} />;

  const calculateProgress = () => {
    if (!todos.length) return 0;
    const completedTodos = todos.filter(todo => todo.completed).length;
    return Math.round((completedTodos / todos.length) * 100);
  };

  const llmRequest = async (inputString: string, purpose: string) => {
    try {
      const response = await fetch('/api/llm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: inputString,
          purpose: purpose
        })
      });
      const data = await response.json();
      const content = data.choices[0].message.content;
      try {
        const parsed = JSON.parse(content);
        return parsed.response;
      } catch {
        toast.error('Invalid response format from AI');
        return null;
      }
    } catch (error) {
      toast.error('Failed to get response from AI');
      return null;
    }
  };

  const addTodo = async () => {
    if (!newTodo.trim()) return;

    try {
      await fetch('/api/todos?teamId=' + team.id, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTodo,
          teamId: team.id,
          parentId: team.id
        })
      });

      setNewTodo('');
      mutateTodos();
      toast.success(t('todo-added'));
    } catch {
      toast.error(t('error-adding-todo'));
    }
  };

  const addSubtask = async (parentId: string) => {
    if (!newSubtaskText.trim()) return;

    try {
      await fetch('/api/todos?teamId=' + team.id, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newSubtaskText,
          teamId: team.id,
          parentId
        })
      });

      setNewSubtaskText('');
      mutateTodos();
      toast.success(t('todo-added'));
      // Keep the parent ID set and clear the text for the next subtask
      setEditingParentId(parentId);
    } catch {
      toast.error(t('error-adding-todo'));
    }
  };

  const toggleTodo = async (id: string) => {
    try {
      const findTodo = (todos: Todo[], id: string): Todo | undefined => {
        for (const todo of todos) {
          if (todo.id === id) return todo;
          const found = findTodo(todo.children || [], id);
          if (found) return found;
        }
      };

      const todoToUpdate = findTodo(todos, id);
      if (!todoToUpdate) return;

      await fetch('/api/todos?teamId=' + team.id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          completed: !todoToUpdate.completed,
          title: todoToUpdate.title
        })
      });

      mutateTodos();
    } catch {
      toast.error(t('error-updating-todo'));
    }
  };

  const updateTodoTitle = async (id: string, newTitle: string) => {
    try {
      await fetch('/api/todos?teamId=' + team.id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          title: newTitle
        })
      });

      mutateTodos();
      toast.success(t('todo-updated'));
    } catch {
      toast.error(t('error-updating-todo'));
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      await fetch(`/api/todos?teamId=${team.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      // Refresh the parent branch after deletion
      const todo = todos.find(t => t.id === id);
      if (todo?.parentId) {
        await mutateTodos();
      }

      mutateTodos();
      toast.success(t('todo-deleted'));
    } catch {
      toast.error(t('error-deleting-todo'));
    }
  };

  const setTodoProcessing = (todoId: string, processing: boolean) => {
    const updateTodoProcessing = (todos: Todo[]): Todo[] => {
      return todos.map(todo => {
        if (todo.id === todoId) {
          return { ...todo, isProcessing: processing };
        }
        if (todo.children?.length) {
          return { ...todo, children: updateTodoProcessing(todo.children) };
        }
        return todo;
      });
    };

    mutateTodos(prev => updateTodoProcessing(prev || []), false);
  };

  const handleFixSpelling = async (todo: Todo) => {
    try {
      setTodoProcessing(todo.id, true);
      console.log('FIX_SPELLING');
      const response = await llmRequest(todo.title, 'FIX_SPELLING');
      if (response) updateTodoTitle(todo.id, response);
    } finally {
      setTodoProcessing(todo.id, false);
    }
  };

  const handleSimplify = async (todo: Todo) => {
    try {
      setTodoProcessing(todo.id, true);
      console.log('SIMPLIFY');
      const response = await llmRequest(todo.title, 'SIMPLIFY');
      if (response) updateTodoTitle(todo.id, response);
    } finally {
      setTodoProcessing(todo.id, false);
    }
  };

  const handleConvertToProblem = async (todo: Todo) => {
    try {
      setTodoProcessing(todo.id, true);
      console.log('UNSOLUTION');
      const response = await llmRequest(todo.title, 'UNSOLUTION');
      if (response) updateTodoTitle(todo.id, response);
    } finally {
      setTodoProcessing(todo.id, false);
    }
  };

  const getBackgroundColor = (level: number) => {
    switch (level) {
      case 0: return 'bg-gray-300';
      case 1: return 'bg-gray-200';
      case 2: return 'bg-gray-100';
      default: return 'bg-white';
    }
  };

  const renderTodo = (todo: Todo, level = 0) => {
    return (
      <div key={todo.id}>
        <li
          className={`flex items-center border p-2 ${getBackgroundColor(level)}`}
          style={{ marginLeft: `${level * 20}px` }}
        >
          <input
            type="checkbox"
            checked={todo.completed}
            className="toggle toggle-sm toggle-accent mr-4"
            onChange={() => toggleTodo(todo.id)}
          />
          {editingTodoId === todo.id ? (
            <input
              type="text"
              value={editingText}
              onChange={(e) => setEditingText(e.target.value)}
              className="input input-sm input-bordered flex-1"
              autoFocus
              onBlur={() => {
                if (editingText.trim() && editingText !== todo.title) {
                  updateTodoTitle(todo.id, editingText);
                }
                setEditingTodoId(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (editingText.trim() && editingText !== todo.title) {
                    updateTodoTitle(todo.id, editingText);
                  }
                  setEditingTodoId(null);
                } else if (e.key === 'Escape') {
                  setEditingTodoId(null);
                }
              }}
            />
          ) : (
            <span
              className={`flex-1 truncate mr-2 ${todo.completed ? 'text-gray-400 line-through' : ''}`}
              onClick={() => {
                setEditingTodoId(todo.id);
                setEditingText(todo.title);
              }}
            >
              {todo.isProcessing ? (
                <div className="skeleton h-5 w-64"></div>
              ) : (
                todo.title
              )}
            </span>
          )}
          <div className="flex gap-2">
            <div className="dropdown dropdown-end">
              <button className="btn btn-primary btn-xs text-white">
                <SparklesIcon className="w-4 h-4 text-white" />
              </button>
              <ul className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                <li>
                  <button onClick={() => handleFixSpelling(todo)}>Fix spelling</button>
                </li>
                <li>
                  <button onClick={() => handleSimplify(todo)}>Simplify</button>
                </li>
                <li>
                  <button onClick={() => handleConvertToProblem(todo)}>Convert to problem</button>
                </li>
              </ul>
            </div>
            <div className="tooltip" data-tip="Add work">
              <button
                className="btn btn-primary btn-xs text-white"
                onClick={() => setEditingParentId(todo.id)}
              >
                +
              </button>
            </div>
            {!todo.hasChildren && (
              <div className="tooltip" data-tip="Delete work">
                <button
                  className="btn btn-error btn-xs text-white"
                  onClick={() => deleteTodo(todo.id)}
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </li>
        {editingParentId === todo.id && (
          <li className={`flex items-center border p-2 ${getBackgroundColor(level + 1)}`} style={{ marginLeft: `${(level + 1) * 20}px` }}>
            <input
              type="text"
              value={newSubtaskText}
              onChange={(e) => setNewSubtaskText(e.target.value)}
              className="input input-bordered flex-1"
              placeholder={t('enter-subtask')}
              autoFocus
              onBlur={() => {
                if (newSubtaskText.trim()) {
                  addSubtask(todo.id);
                } else {
                  setEditingParentId(null);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addSubtask(todo.id);
                } else if (e.key === 'Escape') {
                  setEditingParentId(null);
                  setNewSubtaskText('');
                }
              }}
            />
          </li>
        )}
        {todo.children?.map(child => renderTodo(child, level + 1))}
      </div>
    );
  };

  return (
    <div className="p-4">
      <h1 className="mb-4 text-xl">{team.name} - {t('todos')}</h1>

      <div className="mb-1">
        <progress className="progress w-full h-2 transition-all duration-300" value={calculateProgress()} max="100"></progress>
      </div>
      <div className="mb-4">
        <span>{calculateProgress()}% complete</span>
      </div>


      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          className="input input-bordered flex-1"
          placeholder={t('enter-todo')}
          onKeyDown={(e) => e.key === 'Enter' && addTodo()}
        />
        <button
          onClick={addTodo}
          className="btn btn-primary text-white"
        >
          {t('add-root-work')}
        </button>
      </div>

      <ul className="space-y-2">
        {todos.map(todo => renderTodo(todo))}
      </ul>
    </div>
  );
};

export async function getServerSideProps({ locale }: GetServerSidePropsContext) {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
      teamFeatures: {},
    },
  };
}

export default TodoPage;
