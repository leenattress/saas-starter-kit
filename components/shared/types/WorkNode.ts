export interface WorkNode {
    id: string;
    title: string;
    teamId: string;
    parentId?: string;
    children?: WorkNode[];
    type: string;
}

export const WorkTypes = ['Product', 'Vision', 'Goal', 'Epic', 'Story', 'Task'];
