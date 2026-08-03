/**
 * API Client — adapter-configurable HTTP + SSE client for agent execution.
 *
 * This is the ONLY layer that talks to the backend. The UI components
 * never import from this file directly; they communicate through the
 * AgentRunner (lib/runner.ts), which uses this client internally.
 *
 * To connect a different backend (n8n, API gateway, etc.):
 * 1. Create your own adapter class implementing `ExecutionAdapter` interface
 * 2. Pass it to the runner or swap it in AgentRunner's constructor
 *
 * Currently uses the REST + SSE contract defined in lib/api-types.ts.
 */

import type {
  StartExecutionRequest,
  ApiExecutionResponse,
  ApiStreamEvent,
  ApiClientConfig,
  ApiErrorResponse,
} from './api-types';

// ─── Custom Error Classes ───────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends Error {
  constructor(message = 'Request timed out') {
    super(message);
    this.name = 'TimeoutError';
  }
}

// ─── Adapter Interface ──────────────────────────────────────────────

/**
 * ExecutionAdapter interface — implement this to support different backends.
 *
 * The default implementation uses REST + SSE, but you could swap in:
 *   - n8nWebhookAdapter  (webhook-triggered with polling)
 *   - GraphQLAdapter     (GraphQL subscriptions)
 *   - WebSocketAdapter   (WebSocket-based streaming)
 *   - MockAdapter        (for testing without a backend)
 */
export interface ExecutionAdapter {
  startExecution(request: StartExecutionRequest): Promise<ApiExecutionResponse>;
  getExecution(executionId: string): Promise<ApiExecutionResponse>;
  cancelExecution(executionId: string): Promise<void>;
  streamExecution(
    executionId: string,
    onEvent: (event: ApiStreamEvent) => void,
    onError?: (error: Error) => void,
    onClose?: () => void
  ): () => void; // returns unsubscribe function
}

// ─── Default API Client (REST + SSE) ────────────────────────────────

export class ApiClient implements ExecutionAdapter {
  private config: Required<ApiClientConfig>;
  private activeEventSources: Map<string, EventSource> = new Map();
  private activePollers: Map<string, ReturnType<typeof setInterval>> = new Map();

  constructor(config: ApiClientConfig) {
    this.config = {
      baseUrl: config.baseUrl.replace(/\/+$/, ''),
      apiKey: config.apiKey ?? '',
      timeoutMs: config.timeoutMs ?? 30000,
      pollIntervalMs: config.pollIntervalMs ?? 500,
      maxReconnectAttempts: config.maxReconnectAttempts ?? 3,
    };
  }

  /** Update config at runtime (e.g. when endpoint changes) */
  updateConfig(partial: Partial<ApiClientConfig>): void {
    Object.assign(this.config, {
      ...partial,
      baseUrl: (partial.baseUrl ?? this.config.baseUrl).replace(/\/+$/, ''),
    });
  }

  /** Get current base URL */
  get baseUrl(): string {
    return this.config.baseUrl;
  }

  // ─── Private Helpers ──────────────────────────────────────────────

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }
    return headers;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch(`${this.config.baseUrl}${path}`, {
        method,
        headers: this.buildHeaders(),
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        let errorBody: ApiErrorResponse | null = null;
        try {
          errorBody = await response.json();
        } catch {
          // ignore parse errors
        }
        throw new ApiError(
          errorBody?.message ?? `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorBody?.details
        );
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if ((error as Error)?.name === 'AbortError') {
        throw new TimeoutError();
      }
      throw new NetworkError(
        `Request failed: ${(error as Error)?.message ?? 'Unknown error'}`,
        error
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // ─── Public API Methods ───────────────────────────────────────────

  /** Start a new agent execution */
  async startExecution(request: StartExecutionRequest): Promise<ApiExecutionResponse> {
    return this.request<ApiExecutionResponse>('POST', '/api/executions', request);
  }

  /** Get execution status by ID */
  async getExecution(executionId: string): Promise<ApiExecutionResponse> {
    return this.request<ApiExecutionResponse>('GET', `/api/executions/${executionId}`);
  }

  /** Cancel a running execution */
  async cancelExecution(executionId: string): Promise<void> {
    await this.request<void>('POST', `/api/executions/${executionId}/cancel`);
  }

  // ─── Streaming ────────────────────────────────────────────────────

  /**
   * Subscribe to execution events via SSE.
   * Falls back to polling if EventSource is not available or fails.
   *
   * Returns an unsubscribe function.
   */
  streamExecution(
    executionId: string,
    onEvent: (event: ApiStreamEvent) => void,
    onError?: (error: Error) => void,
    onClose?: () => void
  ): () => void {
    let cancelled = false;
    let reconnectAttempts = 0;

    // Try SSE first
    if (typeof EventSource !== 'undefined') {
      try {
        const url = `${this.config.baseUrl}/api/executions/${executionId}/stream`;
        const eventSource = new EventSource(url);
        this.activeEventSources.set(executionId, eventSource);

        eventSource.onmessage = (msg: MessageEvent) => {
          if (cancelled) return;
          try {
            const parsed: ApiStreamEvent = JSON.parse(msg.data);
            onEvent(parsed);
          } catch (err) {
            onError?.(new Error(`Failed to parse SSE event: ${err}`));
          }
        };

        eventSource.onerror = () => {
          if (cancelled) return;
          reconnectAttempts++;
          if (reconnectAttempts <= this.config.maxReconnectAttempts) {
            // EventSource will auto-reconnect, but we want to notify
            onError?.(new Error(`SSE reconnecting (attempt ${reconnectAttempts}/${this.config.maxReconnectAttempts})`));
          } else {
            // Max reconnects reached — fall back to polling
            eventSource.close();
            this.activeEventSources.delete(executionId);
            this.startPollingFallback(executionId, onEvent, onError, onClose, cancelled);
          }
        };

        eventSource.onopen = () => {
          reconnectAttempts = 0; // reset on successful connection
        };

        // Return unsubscribe function
        return () => {
          cancelled = true;
          eventSource.close();
          this.activeEventSources.delete(executionId);
        };
      } catch {
        // EventSource construction failed — fall through to polling
      }
    }

    // Fallback: polling
    this.startPollingFallback(executionId, onEvent, onError, onClose, cancelled);
    return () => {
      cancelled = true;
    };
  }

  private startPollingFallback(
    executionId: string,
    onEvent: (event: ApiStreamEvent) => void,
    onError?: (error: Error) => void,
    onClose?: () => void,
    cancelledRef?: boolean
  ): void {
    // Track last known state to produce delta events
    let lastNodes: string[] = [];
    let lastLogs = 0;
    let lastStatus = '';

    const poll = async () => {
      if (cancelledRef) return;
      try {
        const exec = await this.getExecution(executionId);

        // Emit execution status changes
        if (exec.status !== lastStatus) {
          onEvent({
            type: exec.status === 'running' ? 'execution-start'
              : exec.status === 'completed' ? 'execution-complete'
              : exec.status === 'cancelled' ? 'execution-cancelled'
              : exec.status === 'failed' ? 'execution-complete'
              : 'execution-start',
            executionId: exec.id,
            agentId: exec.agentId,
            timestamp: Date.now(),
            data: { status: exec.status },
          });
          lastStatus = exec.status;

          if (exec.status === 'running' && lastNodes.length === 0) {
            // First poll — emit all existing nodes as events
            for (const node of exec.nodes) {
              onEvent({
                type: 'node-start',
                executionId: exec.id,
                agentId: exec.agentId,
                nodeId: node.id,
                timestamp: Date.now(),
                data: { node },
              });
            }
          }
        }

        // Emit node status changes
        const currentIds = exec.nodes.map((n) => `${n.id}:${n.status}:${n.duration}`);
        for (let i = 0; i < currentIds.length; i++) {
          if (currentIds[i] !== lastNodes[i]) {
            const node = exec.nodes[i];
            if (node.status === 'running') {
              onEvent({
                type: 'node-start',
                executionId: exec.id,
                agentId: exec.agentId,
                nodeId: node.id,
                timestamp: Date.now(),
                data: { node },
              });
            } else if (node.status === 'success') {
              onEvent({
                type: 'node-complete',
                executionId: exec.id,
                agentId: exec.agentId,
                nodeId: node.id,
                timestamp: Date.now(),
                data: { node },
              });
            } else if (node.status === 'failed') {
              onEvent({
                type: 'node-error',
                executionId: exec.id,
                agentId: exec.agentId,
                nodeId: node.id,
                timestamp: Date.now(),
                data: { node, error: node.error },
              });
            }
          }
        }
        lastNodes = currentIds;

        // Emit new logs
        if (exec.logs.length > lastLogs) {
          for (let i = lastLogs; i < exec.logs.length; i++) {
            onEvent({
              type: 'log',
              executionId: exec.id,
              agentId: exec.agentId,
              nodeId: exec.logs[i].nodeId,
              timestamp: exec.logs[i].timestamp,
              data: exec.logs[i],
            });
          }
          lastLogs = exec.logs.length;
        }

        // If execution is terminal, stop polling
        if (['completed', 'cancelled', 'failed'].includes(exec.status)) {
          onClose?.();
        }
      } catch (error) {
        onError?.(error instanceof Error ? error : new Error(String(error)));
      }
    };

    // Initial poll
    poll();

    // Set up interval
    const intervalId = setInterval(poll, this.config.pollIntervalMs);
    this.activePollers.set(executionId, intervalId);
  }

  /** Stop all active streams and pollers */
  disconnectAll(): void {
    for (const [id, es] of this.activeEventSources) {
      es.close();
    }
    this.activeEventSources.clear();

    for (const [id, interval] of this.activePollers) {
      clearInterval(interval);
    }
    this.activePollers.clear();
  }
}

// ─── Singleton Instance ─────────────────────────────────────────────

/** Default API client instance configured from environment variables */
export const apiClient = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
  apiKey: process.env.NEXT_PUBLIC_API_KEY,
  timeoutMs: process.env.NEXT_PUBLIC_EXECUTION_TIMEOUT_MS
    ? parseInt(process.env.NEXT_PUBLIC_EXECUTION_TIMEOUT_MS, 10)
    : 30000,
});
