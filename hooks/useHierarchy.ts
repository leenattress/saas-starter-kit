import { useState } from "react";

export interface WorkNode {
    id: string;
    title: string;
    teamId: string;
    parentId?: string;
    children?: WorkNode[];
    type: string;
    metadata?: Record<string, any> | null;
}

export const WorkTypes = ['Product', 'Vision', 'Goal', 'Epic', 'Story', 'Task'];

/**
 * Custom hook to manage a hierarchy of work nodes.
 * @param {WorkNode[]} initialNodes - The initial set of nodes to populate the hierarchy.
 * @returns {Object} An object containing methods and state to manage the hierarchy.
 */
export function useHierarchy(initialNodes: WorkNode[]) {
    const [nodes, setNodes] = useState<WorkNode[]>(initialNodes);

    /**
     * Recursively finds a node by ID and executes a given action on it.
     * @param {WorkNode[]} nodes - The list of nodes to search through.
     * @param {string} nodeId - The ID of the node to find.
     * @param {Function} action - The action to execute on the found node.
     * @param {WorkNode} [parentNode] - The parent node of the current node.
     * @returns {boolean} True if the node was found and the action executed, otherwise false.
     */
    const findNodeAndExecute = (nodes: WorkNode[], nodeId: string, action: (node: WorkNode, parentNode?: WorkNode) => void, parentNode?: WorkNode): boolean => {
        for (let node of nodes) {
            if (node.id === nodeId) {
                action(node, parentNode);
                return true;
            }
            if (node.children && findNodeAndExecute(node.children, nodeId, action, node)) {
                return true;
            }
        }
        return false;
    };

    /**
     * Adds a child node to a specified parent node.
     * @param {string} parentId - The ID of the parent node.
     * @param {WorkNode} child - The child node to add.
     */
    const addChildToParent = (parentId: string, child: WorkNode) => {
        setNodes(prevNodes => {
            findNodeAndExecute(prevNodes, parentId, (parent) => {
                if (!parent.children) {
                    parent.children = [];
                }
                // Check if child with same ID already exists
                if (!parent.children.some(existingChild => existingChild.id === child.id)) {
                    console.log('Adding child:', JSON.stringify(child));
                    parent.children.push(child);
                }
            });
            return [...prevNodes];
        });
    };

    /**
     * Removes a child node from its parent node.
     * @param {string} childId - The ID of the child node to remove.
     */
    const removeChildFromParent = (childId: string) => {
        setNodes(prevNodes => {
            // First try to find and remove from parent's children
            let foundInParent = false;
            findNodeAndExecute(prevNodes, childId, (_, parent) => {
                if (parent) {
                    parent.children = (parent.children || []).filter(child => child.id !== childId);
                    foundInParent = true;
                }
            });

            // If not found in any parent's children, it's a top-level node
            if (!foundInParent) {
                return prevNodes.filter(node => node.id !== childId);
            }

            return [...prevNodes];
        });
    };

    /**
     * Updates a node with new properties, including metadata.
     * @param {string} nodeId - The ID of the node to update.
     * @param {Partial<WorkNode>} newProperties - The new properties to assign to the node.
     */
    const updateNode = (nodeId: string, newProperties: Partial<WorkNode>) => {
        setNodes(prevNodes => {
            findNodeAndExecute(prevNodes, nodeId, (node) => {
                Object.assign(node, newProperties);
                if (newProperties.metadata === null) {
                    delete node.metadata;
                }
            });
            return [...prevNodes];
        });
    };

    /**
     * Retrieves a node by its ID.
     * @param {string} nodeId - The ID of the node to retrieve.
     * @returns {WorkNode | undefined} The found node or undefined if not found.
     */
    const getNode = (nodeId: string) => {
        let foundNode: WorkNode | undefined;
        findNodeAndExecute(nodes, nodeId, (node) => {
            foundNode = node;
        });
        return foundNode;
    };

    /**
     * Retrieves all nodes in the hierarchy.
     * @returns {WorkNode[]} The list of all nodes.
     */
    const getAllNodes = () => {
        return nodes;
    };

    /**
     * Moves a node to a new parent
     * @param {string} nodeId - The ID of the node to move
     * @param {string} newParentId - The ID of the new parent
     */
    const moveNode = (nodeId: string, newParentId: string) => {
        const nodeToMove = getNode(nodeId);
        if (!nodeToMove) return;
        
        removeChildFromParent(nodeId);
        addChildToParent(newParentId, nodeToMove);
    };

    /**
     * Gets the parent of a node
     * @param {string} nodeId - The ID of the node
     * @returns {WorkNode | undefined} The parent node or undefined
     */
    const getParent = (nodeId: string) => {
        let parent: WorkNode | undefined;
        findNodeAndExecute(nodes, nodeId, (_, parentNode) => {
            parent = parentNode;
        });
        return parent;
    };

    /**
     * Gets all ancestors of a node
     * @param {string} nodeId - The ID of the node
     * @returns {WorkNode[]} Array of ancestor nodes from immediate parent to root
     */
    const getAncestors = (nodeId: string) => {
        const ancestors: WorkNode[] = [];
        let currentNode = getParent(nodeId);
        
        while (currentNode) {
            ancestors.push(currentNode);
            currentNode = getParent(currentNode.id);
        }
        
        return ancestors;
    };

    return {
        nodes,
        setNodes,
        addChildToParent,
        removeChildFromParent,
        updateNode,
        getNode,
        getAllNodes,
        moveNode,
        getParent,
        getAncestors,
    };
}
