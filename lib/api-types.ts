/**
 * API types for backend agent execution integration.
 *
 * These types define the contract between the frontend and any backend
 * execution service (n8n webhooks, API gateway, production orchestrator, etc.).
 *
 * The `ApiClient` adapter (see api-client.ts) maps these raw API responses
 * into the internal `AgentExecution` / `AgentResult` / `RunnerEvent` types
 * used by the UI components — so backend changes only affect this file
 * and the adapter mapping, never the UI.
 */

// ─── Request Payloads ───────────────────────────────────────────────

/** Payload sent to POST /api/executions to start a new agent run */
export interface StartExecutionRequest {
  agentId: string;
  /** Optional: override the default agent input payload */
  payload?: Record<string, unknown>;
  /** Optional: configuration for this execution */
  config?: Record<string, unknown>;
}

// ─── Response Shapes ────────────────────────────────────────────────

/** Raw node response from the API */
export interface ApiNodeResponse {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  duration: number;
  input: string;
  output: string;
  error: string | null;
}

/** Raw log entry from the API */
export interface ApiLogResponse {
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  nodeId?: string;
}

/** Full execution state from the API */
export interface ApiExecutionResponse {
  id: string;
  agentId: string;
  status: 'idle' | 'running' | 'processing' | 'completed' | 'cancelled' | 'failed';
  nodes: ApiNodeResponse[];
  startTime: number | null;
  endTime: number | null;
  logs: ApiLogResponse[];
}

/** Execution summary from list endpoints */
export interface ApiExecutionSummary {
  id: string;
  agentId: string;
  status: string;
  startTime: number | null;
  endTime: number | null;
  nodeCount: number;
  successCount: number;
  failedCount: number;
}

// ─── SSE Event Types ────────────────────────────────────────────────

/** Raw SSE event shape from the stream endpoint */
export interface ApiStreamEvent {
  type: string;
  executionId: string;
  agentId: string;
  nodeId?: string;
  data?: unknown;
  timestamp: number;
}

// ─── Error Types ────────────────────────────────────────────────────

/** Standard API error response */
export interface ApiErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  details?: Record<string, unknown>;
}

// ─── Configuration ──────────────────────────────────────────────────

/** Configuration for the API client */
export interface ApiClientConfig {
  /** Base URL of the backend API */
  baseUrl: string;
  /** Optional API key for authenticated requests */
  apiKey?: string;
  /** Default timeout in milliseconds (default: 30000) */
  timeoutMs?: number;
  /** Polling interval fallback in milliseconds (default: 500) */
  pollIntervalMs?: number;
  /** Maximum number of reconnection attempts (default: 3) */
  maxReconnectAttempts?: number;
}
