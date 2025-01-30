const nodeTypes = ['Product', 'Vision', 'Goal', 'Epic', 'Story', 'Task'];

export interface FetchNodesParams {
    teamId: string;
}

export interface CreateNodeParams {
    newTitle: string;
    parentId?: string;
    teamId?: string;
    level: number;
}

export interface DeleteNodeParams {
    nodeId: string;
    teamId?: string;
}

export interface UpdateNodeParams {
    nodeId: string;
    newTitle: string;
    teamId?: string;
}

export class GraphAPI {
    static async fetchNodes({ teamId }: FetchNodesParams) {
        const res = await fetch(`/api/work?teamId=${teamId}`);
        return res.json();
    }

    static async createNode({ newTitle, parentId, teamId, level }: CreateNodeParams) {
        const res = await fetch('/api/work', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: newTitle,
                parentId,
                teamId,
                type: nodeTypes[level]
            })
        });
        return res.json();
    }

    static async deleteNode({ nodeId, teamId }: DeleteNodeParams) {
        const res = await fetch(`/api/work?id=${nodeId}&teamId=${teamId}`, {
            method: 'DELETE'
        });
        return res.status;
    }

    static async updateNode({ nodeId, newTitle, teamId }: UpdateNodeParams) {
        const res = await fetch(`/api/work?id=${nodeId}&teamId=${teamId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: newTitle })
        });
        return res.json();
    }
}
