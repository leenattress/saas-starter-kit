import { renderHook, act } from '@testing-library/react';
import { useHierarchy, WorkNode } from './useHierarchy';

describe('useHierarchy', () => {
  const initialNodes: WorkNode[] = [
    { id: '1', title: 'Node 1', teamId: 'team1', type: 'Product', metadata: { key: 'value' } },
    { id: '2', title: 'Node 2', teamId: 'team1', type: 'Vision', parentId: '1', children: [], metadata: { key: 'value' } },
  ];

  it('should initialize with given nodes', () => {
    const { result } = renderHook(() => useHierarchy(initialNodes));
    expect(result.current.nodes).toEqual(initialNodes);
  });

  it('should add a child node to a parent node', () => {
    const { result } = renderHook(() => useHierarchy(initialNodes));
    const newChild: WorkNode = { id: '3', title: 'Node 3', teamId: 'team1', type: 'Goal', parentId: '1', metadata: { key: 'value' } };

    act(() => {
      result.current.addChildToParent('1', newChild);
    });

    const parentNode = result.current.nodes.find(node => node.id === '1');
    expect(parentNode?.children?.filter(child => child.id === '3').length).toBe(1);
  });

  it('should add a child node to a nested parent node', () => {
    const nestedNodes: WorkNode[] = [
      { id: '1', title: 'Node 1', teamId: 'team1', type: 'Product', children: [
        { id: '2', title: 'Node 2', teamId: 'team1', type: 'Vision', parentId: '1', children: [], metadata: { key: 'value' } }
      ], metadata: { key: 'value' } }
    ];
    const { result } = renderHook(() => useHierarchy(nestedNodes));
    const newChild: WorkNode = { id: '3', title: 'Node 3', teamId: 'team1', type: 'Goal', parentId: '2', metadata: { key: 'value' } };

    act(() => {
      result.current.addChildToParent('2', newChild);
    });

    const nestedParentNode = result.current.nodes[0].children?.[0];
    expect(nestedParentNode?.children?.filter(child => child.id === '3').length).toBe(1);
  });

  it('should add multiple levels of child nodes', () => {
    const { result } = renderHook(() => useHierarchy(initialNodes));
    const newChild1: WorkNode = { id: '3', title: 'Node 3', teamId: 'team1', type: 'Goal', parentId: '1', metadata: { key: 'value' } };
    const newChild2: WorkNode = { id: '4', title: 'Node 4', teamId: 'team1', type: 'Epic', parentId: '3', metadata: { key: 'value' } };

    act(() => {
      result.current.addChildToParent('1', newChild1);
      result.current.addChildToParent('3', newChild2);
    });

    const parentNode = result.current.nodes.find(node => node.id === '1');
    const childNode = parentNode?.children?.find(child => child.id === '3');
    expect(parentNode?.children?.filter(child => child.id === '3').length).toBe(1);
    expect(childNode?.children?.filter(child => child.id === '4').length).toBe(1);
  });

  it('should remove a child node and its descendants from the hierarchy', () => {
    const nestedNodes: WorkNode[] = [
      { id: '1', title: 'Node 1', teamId: 'team1', type: 'Product', children: [
        { id: '2', title: 'Node 2', teamId: 'team1', type: 'Vision', parentId: '1', children: [
          { id: '3', title: 'Node 3', teamId: 'team1', type: 'Goal', parentId: '2', metadata: { key: 'value' } }
        ], metadata: { key: 'value' } }
      ], metadata: { key: 'value' } }
    ];
    const { result } = renderHook(() => useHierarchy(nestedNodes));

    act(() => {
      result.current.removeChildFromParent('2');
    });

    const parentNode = result.current.nodes.find(node => node.id === '1');
    expect(parentNode?.children).not.toContainEqual(expect.objectContaining({ id: '2' }));
    expect(result.current.nodes).not.toContainEqual(expect.objectContaining({ id: '3' }));
  });

  it('should update a node with new properties', () => {
    const { result } = renderHook(() => useHierarchy(initialNodes));
    const updatedProperties = { title: 'Updated Node 1', metadata: null };

    act(() => {
      result.current.updateNode('1', updatedProperties);
    });

    expect(result.current.nodes[0].title).toBe('Updated Node 1');
    expect(result.current.nodes[0].metadata).toBeUndefined();
  });

  it('should retrieve a node by its ID', () => {
    const { result } = renderHook(() => useHierarchy(initialNodes));

    let node;
    act(() => {
      node = result.current.getNode('1');
    });

    expect(node).toEqual(initialNodes[0]);
  });

  it('should retrieve all nodes in the hierarchy', () => {
    const { result } = renderHook(() => useHierarchy(initialNodes));

    let allNodes;
    act(() => {
      allNodes = result.current.getAllNodes();
    });

    expect(allNodes).toEqual(initialNodes);
  });

  it('should move a node to a new parent', () => {
    const { result } = renderHook(() => useHierarchy(initialNodes));
    const newChild: WorkNode = { id: '3', title: 'Node 3', teamId: 'team1', type: 'Goal', parentId: '1', metadata: { key: 'value' } };

    act(() => {
      result.current.addChildToParent('1', newChild);
      result.current.moveNode('3', '2');
    });

    const parentNode = result.current.nodes.find(node => node.id === '2');
    expect(parentNode?.children?.filter(child => child.id === '3').length).toBe(1);
  });

  it('should get the parent of a node', () => {
    const { result } = renderHook(() => useHierarchy(initialNodes));
    const newChild: WorkNode = { id: '3', title: 'Node 3', teamId: 'team1', type: 'Goal', parentId: '1', metadata: { key: 'value' } };

    act(() => {
      result.current.addChildToParent('1', newChild);
    });

    const parent = result.current.getParent('3');
    expect(parent?.id).toBe('1');
  });

  it('should get all ancestors of a node', () => {
    const nestedNodes: WorkNode[] = [
      { id: '1', title: 'Node 1', teamId: 'team1', type: 'Product', children: [
        { id: '2', title: 'Node 2', teamId: 'team1', type: 'Vision', parentId: '1', children: [
          { id: '3', title: 'Node 3', teamId: 'team1', type: 'Goal', parentId: '2', metadata: { key: 'value' } }
        ], metadata: { key: 'value' } }
      ], metadata: { key: 'value' } }
    ];
    const { result } = renderHook(() => useHierarchy(nestedNodes));

    const ancestors = result.current.getAncestors('3');
    expect(ancestors.map(node => node.id)).toEqual(['2', '1']);
  });

  it('should return undefined when getting the parent of a root node', () => {
    const { result } = renderHook(() => useHierarchy(initialNodes));

    const parent = result.current.getParent('1');
    expect(parent).toBeUndefined();
  });

  it('should return an empty array when getting ancestors of a root node', () => {
    const { result } = renderHook(() => useHierarchy(initialNodes));

    const ancestors = result.current.getAncestors('1');
    expect(ancestors).toEqual([]);
  });

  it('should delete a top-level node', () => {
    const { result } = renderHook(() => useHierarchy(initialNodes));

    act(() => {
      result.current.removeChildFromParent('1');
    });

    expect(result.current.nodes).not.toContainEqual(expect.objectContaining({ id: '1' }));
  });
});
