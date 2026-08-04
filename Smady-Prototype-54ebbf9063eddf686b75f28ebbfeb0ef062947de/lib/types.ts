/**
 * Core types for the Agent Runner testing engine.
 * Production-ready types for node-based agent execution simulation.
 */

export type NodeStatus = 'pending' | 'running' | 'success' | 'failed';

export interface AgentNode {
  id: string;
  name: string;
  status: NodeStatus;
  duration: number; // elapsed time in ms
  input: string;
  output: string;
  error: string | null;
}

export interface AgentExecution {
  id: string;
  agentId: string;
  status: 'idle' | 'running' | 'processing' | 'completed' | 'cancelled' | 'failed';
  nodes: AgentNode[];
  startTime: number | null;
  endTime: number | null;
  logs: LogEntry[];
}

export interface AgentResult {
  success: boolean;
  executionId: string;
  agentId: string;
  nodes: AgentNode[];
  startTime: number;
  endTime: number;
  totalDuration: number;
  logs: LogEntry[];
}

export interface LogEntry {
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  nodeId?: string;
}

export type RunnerEventType =
  | 'node-start'
  | 'node-complete'
  | 'node-error'
  | 'execution-start'
  | 'execution-complete'
  | 'execution-cancelled'
  | 'execution-error'
  | 'log';

export interface RunnerEvent {
  type: RunnerEventType;
  executionId: string;
  agentId: string;
  nodeId?: string;
  data?: unknown;
  timestamp: number;
}

export type EventHandler = (event: RunnerEvent) => void;

export interface MockNodeDefinition {
  id: string;
  name: string;
  simulateInput: string;
  simulateOutput: string;
  simulateError?: string | null;
  durationMs: [number, number]; // min, max delay
}

export interface MockAgentDefinition {
  agentId: string;
  nodes: MockNodeDefinition[];
}

/**
 * Execution state for UI components to track the lifecycle of a run.
 */
export type ExecutionState = 'idle' | 'loading' | 'running' | 'completed' | 'cancelled' | 'failed' | 'timeout' | 'error';

/**
 * Extended error info for UI display.
 */
export interface ExecutionError {
  type: 'network' | 'timeout' | 'api' | 'unknown';
  message: string;
  details?: Record<string, unknown>;
}
