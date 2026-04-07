import React, { useMemo } from 'react';
import { ReactFlow, Background, Controls, Node, Edge, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useZomraStore } from '../store/useZomraStore';
import { Brain, ShieldCheck, Sparkles, Activity } from 'lucide-react';

const CustomNode = ({ data }: any) => {
  const { label, icon: Icon, status, load, tokens } = data;
  
  return (
    <div className={`px-4 py-3 shadow-lg rounded-xl border-2 bg-deep-black/90 backdrop-blur-md min-w-[150px] ${
      status === 'Active' ? 'border-power-red shadow-[0_0_15px_rgba(255,51,51,0.3)]' : 
      status === 'Syncing' ? 'border-eagle-gold shadow-[0_0_15px_rgba(192,147,7,0.3)]' : 
      'border-crisp-white/10'
    }`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-lg ${
          status === 'Active' ? 'bg-power-red/20 text-power-red' : 
          status === 'Syncing' ? 'bg-eagle-gold/20 text-eagle-gold' : 
          'bg-crisp-white/5 text-crisp-white/50'
        }`}>
          <Icon size={16} className={status === 'Active' ? 'animate-pulse' : ''} />
        </div>
        <div className="text-xs font-bold text-crisp-white">{label}</div>
      </div>
      
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-[10px]">
          <span className="text-crisp-white/50">Load</span>
          <span className="font-mono text-crisp-white">{Math.round(load)}%</span>
        </div>
        <div className="w-full bg-deep-black/50 h-1 rounded-full overflow-hidden">
          <div 
            className={`h-full ${status === 'Active' ? 'bg-power-red' : 'bg-eagle-gold'}`}
            style={{ width: `${load}%`, transition: 'width 0.5s ease' }}
          />
        </div>
        
        {tokens !== undefined && (
          <div className="flex justify-between items-center text-[10px] pt-1">
            <span className="text-crisp-white/50">Tokens</span>
            <span className="font-mono text-eagle-gold">{tokens}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

export default function SwarmGraph() {
  const { agentPhase, isProcessingTask, totalTokens } = useZomraStore();

  const nodes: Node[] = useMemo(() => [
    {
      id: 'hermes',
      type: 'custom',
      position: { x: 100, y: 20 },
      data: { 
        label: 'Hermes (Core)', 
        icon: Brain, 
        status: isProcessingTask ? 'Active' : 'Idle',
        load: isProcessingTask ? 85 : 5,
        tokens: totalTokens > 0 ? totalTokens : (isProcessingTask ? Math.floor(Math.random() * 50) + 10 : 0)
      },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    },
    {
      id: '7orus',
      type: 'custom',
      position: { x: 0, y: 140 },
      data: { 
        label: '7orus (Security)', 
        icon: ShieldCheck, 
        status: agentPhase === 'Verify' ? 'Active' : 'Idle',
        load: agentPhase === 'Verify' ? 90 : 2,
        tokens: agentPhase === 'Verify' ? Math.floor(totalTokens * 0.1) + 50 : 0
      },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    },
    {
      id: 'cleanup',
      type: 'custom',
      position: { x: 200, y: 140 },
      data: { 
        label: 'Cleanup Agent', 
        icon: Sparkles, 
        status: agentPhase === 'Cleanup' ? 'Active' : 'Idle',
        load: agentPhase === 'Cleanup' ? 75 : 0,
        tokens: agentPhase === 'Cleanup' ? Math.floor(totalTokens * 0.05) + 20 : 0
      },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    }
  ], [agentPhase, isProcessingTask, totalTokens]);

  const edges: Edge[] = useMemo(() => [
    { 
      id: 'e1', 
      source: 'hermes', 
      target: '7orus', 
      animated: agentPhase === 'Verify' || isProcessingTask,
      style: { stroke: agentPhase === 'Verify' ? '#FF3333' : '#ffffff33', strokeWidth: 2 }
    },
    { 
      id: 'e2', 
      source: 'hermes', 
      target: 'cleanup', 
      animated: agentPhase === 'Cleanup' || isProcessingTask,
      style: { stroke: agentPhase === 'Cleanup' ? '#FF3333' : '#ffffff33', strokeWidth: 2 }
    }
  ], [agentPhase, isProcessingTask]);

  return (
    <div className="w-full h-full min-h-[200px] rounded-xl overflow-hidden border border-crisp-white/10 bg-deep-black/40">
      <ReactFlow 
        nodes={nodes} 
        edges={edges} 
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#ffffff10" gap={16} />
      </ReactFlow>
    </div>
  );
}
