import { type FC, useCallback } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Controls,
  Background,
  Handle,
  type NodeProps,
  Position,
  type Node,
  type Connection,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';

type NodeData = {
  id: number;
  doi: string;
  title: string;
  year: number | null;
  month: number | null;
  day: number | null;
  authors: string[] | null;
};

type CustomNodeProps = NodeProps<Node<NodeData>>;

// カードデザインと完全に同じカスタムノード
const CustomNode: FC<CustomNodeProps> = (props) => {
  const { data } = props;
  const { doi, title, authors, year, month, day } = data;

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#555', width: 10, height: 10 }} // 見やすく調整
      />
      <Card className="hover:shadow-md transition w-80">
        <CardHeader>
          <CardTitle className="text-xl leading-tight">{title}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {Array.isArray(authors) ? authors.join(', ') : authors}
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mt-2">
            <p className="text-sm text-muted-foreground">
              Published:{' '}
              {new Date(year || 0, month || 0, day || 0).toLocaleDateString()}
            </p>
            {doi && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`https://doi.org/${doi}`, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                View Paper
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#555', width: 10, height: 10 }} // 見やすく調整
      />
    </>
  );
};

export function PaperRelationshipFlow({
  papers,
}: {
  papers: NodeData[];
}) {
  // const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  // const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // const onConnect = useCallback(
  //   (params) => setEdges((eds) => addEdge(params, eds)),
  //   [setEdges],
  // );

  // ノード生成
  // 初期ノードの作成
  const initialNodes = papers.map((paper, idx) => ({
    id: `paper-${paper.id}`,
    position: {
      x: 100 + (idx % 3) * 400,
      y: 100 + Math.floor(idx / 3) * 400,
    },
    data: paper,
    type: 'custom',
  }));

  // 状態管理を有効化（これが重要！）
  const [nodes, _setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // エッジ接続ハンドラを有効化
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  return (
    <div style={{ width: '100%', height: '800px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={{ custom: CustomNode }}
        nodesDraggable={true}
        defaultEdgeOptions={{
          style: { strokeWidth: 3, stroke: '#555' },
        }}
        fitView
      >
        <Controls />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}
