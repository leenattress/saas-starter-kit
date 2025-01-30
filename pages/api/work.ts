import { NextApiRequest, NextApiResponse } from 'next';
import neo4j from 'neo4j-driver';

const driver = neo4j.driver(
  process.env.GRAPH_DB_URL || 'bolt://localhost:7687',
  neo4j.auth.basic(
    process.env.GRAPH_DB_USER || 'neo4j',
    process.env.GRAPH_DB_PASSWORD || 'password'
  )
);

const validNodeTypes = ['Product', 'Vision', 'Goal', 'Epic', 'Story', 'Task'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = driver.session();

  try {
    switch (req.method) {
      case 'POST': {
        // Create a Work node, optionally with parent
        const { parentId, type, ...props } = req.body;

        if (!validNodeTypes.includes(type)) {
          return res.status(400).json({ error: 'Invalid node type' });
        }
        
        let result;
        if (parentId) {
          // Create node and relationship to parent in a single query
          result = await session.executeWrite((tx) =>
            tx.run(
              `MATCH (parent) WHERE id(parent) = $parentId
               CREATE (child:${type} $props)
               CREATE (child)-[:CHILD_OF]->(parent)
               RETURN child AS n`,
              { parentId: parseInt(parentId), props }
            )
          );
        } else {
          // Create without parent
          result = await session.executeWrite((tx) =>
            tx.run(
              `CREATE (n:${type} $props) RETURN n`,
              { props }
            )
          );
        }

        if (!result.records || result.records.length === 0) {
          return res.status(404).json({ error: 'Failed to create work item' });
        }
        
        const createdNode = result.records[0].get('n');
        res.json({ ...createdNode.properties, id: createdNode.elementId });
        break;
      }

      case 'GET': {
        // If no id provided, get entire tree for team
        // If id provided, get node and its parents
        if (!req.query.id) {
          const result = await session.executeRead((tx) =>
            tx.run(
              `MATCH (n {teamId: $teamId})
               OPTIONAL MATCH (n)-[r:CHILD_OF]->(parent)
               RETURN n, parent, r`,
              { teamId: req.query.teamId as string }
            )
          );

          if (!result.records || result.records.length === 0) {
            return res.json([]);
          }

          // Process the results into a more usable format
          const nodes = result.records.map(record => {
            const node = record.get('n').properties;
            const id = record.get('n').elementId;
            const parent = record.get('parent');
            
            return {
              ...node,
              id: id,
              parentId: parent ? parent.elementId : undefined
            };
          });

          // Build node map for O(1) lookups
          const nodeMap = new Map();
          nodes.forEach(node => {
            nodeMap.set(node.id, node);
          });

          // Build tree structure
          const tree = nodes.filter(node => {
            if (node.parentId) {
              const parent = nodeMap.get(node.parentId);
              if (parent) {
                parent.children = parent.children || [];
                parent.children.push(node);
                return false;
              }
            }
            return true;
          });

          res.json(tree);
        } else {
          // Get node and its parents
          const result = await session.executeRead((tx) =>
            tx.run(
              `MATCH (n {id: $id})
               MATCH path = (n)-[:CHILD_OF*0..]->(parent)
               RETURN nodes(path)`,
              { id: req.query.id as string }
            )
          );

          if (!result.records || result.records.length === 0) {
            return res.json([]);
          }

          // Process the path results into array of node properties
          const nodes = result.records.map(record => {
            return record.get('nodes(path)').map((node: any) => node.properties);
          })[0];

          res.json(nodes);
        }
        break;
      }

      case 'PUT': {
        // Update a Work node
        const result = await session.executeWrite((tx) =>
          tx.run(
            'MATCH (n {teamId: $teamId}) WHERE id(n) = $id SET n += $props RETURN n',
            { id: parseInt(req.body.id), props: req.body }
          )
        );
        res.json(result.records[0].get('n').properties);
        break;
      }

      case 'DELETE': {
        // Delete only the specified Work node
        await session.executeWrite((tx) =>
          tx.run(
            `MATCH (n {teamId: $teamId}) 
             WHERE id(n) = $id
             DETACH DELETE n`,
            { id: parseInt(req.query.id as string), teamId: req.query.teamId as string }
          )
        );
        res.status(204).end();
        break;
      }

      default:
        res.status(405).end();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await session.close();
  }
}
