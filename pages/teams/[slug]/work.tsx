import { GetServerSidePropsContext } from 'next';
import { useState, useEffect } from 'react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import useTeam from 'hooks/useTeam';
import { Loading, Error } from '@/components/shared';
import { GraphAPI } from '@/lib/graphAPI';
import { useHierarchy, WorkNode, WorkTypes } from 'hooks/useHierarchy';
import { TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';

function WorkPage() {
  const { t } = useTranslation('common');
  const { isLoading, isError, team } = useTeam();
  const [newTitle, setNewTitle] = useState('');
  const [addingChildId, setAddingChildId] = useState<string | null>(null);
  const [childTitle, setChildTitle] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentNode, setCurrentNode] = useState<WorkNode | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const { nodes, setNodes, addChildToParent, removeChildFromParent } = useHierarchy([]);

  useEffect(() => {
    if (team?.id) {
      const fetchNodes = async (teamId: string) => {
        const data = await GraphAPI.fetchNodes({ teamId });
        setNodes(data);
      };
      fetchNodes(team.id);
    }
  }, [team?.id]);

  if (isLoading) {
    return <Loading />;
  }

  if (isError) {
    return <Error />;
  }

  const createNode = async (parentId?: string, level: number = 0) => {
    if (!newTitle.trim()) return;
    const node = await GraphAPI.createNode({ newTitle, parentId, teamId: team?.id, level });
    setNodes(prev => [...prev, node]);
    setNewTitle('');
  };

  const createChildNode = async (parentId: string, level: number) => {
    if (!childTitle.trim()) return;
    const node = await GraphAPI.createNode({ newTitle: childTitle, parentId, teamId: team?.id, level });
    if (node) {
      addChildToParent(parentId, node);
      setChildTitle('');
      setAddingChildId(parentId);
    }
  };

  const deleteNode = async (nodeId: string) => {
    const status = await GraphAPI.deleteNode({ nodeId, teamId: team?.id });
    if (status === 204) {
      removeChildFromParent(nodeId);
    }
  };

  const updateNodeTitle = async (nodeId: string, newTitle: string) => {
    const updatedNode = await GraphAPI.updateNode({ nodeId, newTitle, teamId: team?.id });
    setNodes(prev => prev.map(node => (node.id === nodeId ? updatedNode : node)));
  };

  const openModal = (node: WorkNode) => {
    setCurrentNode(node);
    setEditTitle(node.title);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentNode(null);
    setEditTitle('');
  };

  const saveWork = () => {
    if (currentNode && editTitle.trim()) {
      updateNodeTitle(currentNode.id, editTitle);
      closeModal();
    }
  };

  const renderNodes = (nodes: WorkNode[], level: number = 0) => {
    return nodes.map(node => {
      const backgroundColor = `hsl(220, 20%, ${80 + level * 3}%)`;
      const buttonText = WorkTypes[level + 1] || 'Task';

      return (
        <div key={node.id} data-id={node.id} data-level={level} className={`${level > 0 ? 'ml-4' : ''} p-0`}>
          <div className="flex items-center justify-between gap-2 p-2 mb-1" style={{ backgroundColor }}>
            <p className="truncate font-medium" onClick={() => openModal(node)}><strong>{WorkTypes[level]}</strong> - {node.title}</p>
            <div className="join">
              {WorkTypes[level + 1] && (
                <button
                  onClick={() => setAddingChildId(node.id)}
                  className="btn btn-sm btn-primary text-white join-item"
                >
                  Add {buttonText}
                </button>
              )}
              <button
                onClick={() => deleteNode(node.id)}
                className="btn btn-sm btn-secondary text-white join-item"
              >
                <TrashIcon className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
          {addingChildId === node.id && (
            <div className="flex gap-2 mb-2 w-full">
              <input
                type="text"
                placeholder={`Add ${buttonText}`}
                value={childTitle}
                onChange={(e) => setChildTitle(e.target.value)}
                className="ml-4 input input-sm input-ghost flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    createChildNode(node.id, level + 1);
                  }
                  if (e.key === 'Escape') {
                    setAddingChildId(null);
                  }
                }}
                autoFocus
              />
              <button
                onClick={() => setAddingChildId(null)}
                className="btn btn-sm btn-error mr-2 min-w-[20px]"
              >
                <XMarkIcon className="w-4 h-4 text-white" />
              </button>
            </div>
          )}
          {node.children && node.children.length > 0 && (
            <ul className="list-none">
              {renderNodes(node.children, level + 1)}
            </ul>
          )}
        </div>
      );
    });
  };

  return (
    <div className="flex gap-4 p-4">
      <div className={`flex-1 mb-4 ${showDetails ? 'w-2/3' : 'w-full'}`}>
        <div className="flex items-center gap-2 mb-6">
          <input
            type="text"
            placeholder="Add a project"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="input input-bordered w-full"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                createNode();
              }
            }}
          />
          <button
            onClick={() => createNode()}
            className="btn btn-primary"
          >
            Add
          </button>
        </div>

        <ul className="list-none">
          {renderNodes(nodes)}
        </ul>

        <hr className="my-8" />

        <button onClick={() => setIsDebugOpen(!isDebugOpen)} className="btn btn-success btn-sm mb-4">
          {isDebugOpen ? 'Hide Debug Info' : 'Show Debug Info'}
        </button>
        {isDebugOpen && <pre>{JSON.stringify(nodes, null, 2)}</pre>}
      </div>
      {showDetails && (
        <div className="flex-1 mb-4">
          <h1 className="text-2xl font-bold mb-4">Details</h1>
          <div className="p-4 border border-gray-300 rounded">
            <p>Placeholder for right pane content</p>
          </div>
        </div>
      )}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[9999]">
          <div className="bg-white p-4 rounded shadow-lg">
            <h2 className="text-xl font-bold mb-4">Edit Title</h2>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="input input-bordered mb-4"
            />
            <div className="flex justify-end gap-2">
              <button onClick={closeModal} className="btn btn-secondary">Cancel</button>
              <button onClick={saveWork} className="btn btn-primary">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export async function getServerSideProps({ locale }: GetServerSidePropsContext) {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
      teamFeatures: {},
    },
  };
}

export default WorkPage;