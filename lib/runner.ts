/**
 * Agent Runner ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“ production-ready event-driven execution engine.
 *
 * Orchestrates agent execution via n8n webhooks or the REST+SSE API client
 * while maintaining the same event-driven interface that UI components
 * depend on. The runner abstracts away:
 *   - Adapter selection (webhook vs REST+SSE)
 *   - API communication (REST + SSE streaming, webhook POST)
 *   - State management (nodes, logs, timers)
 *   - Error handling (timeout, network, API errors)
 *   - Lifecycle (start, cancel, dispose)
 *
 * UI components subscribe to RunnerEvent via on() and receive the
 * exact same event shapes they did with the mock engine ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â no UI
 * changes needed.
 *
 * Adapter resolution:
 *   - Agents with configured n8n webhooks use N8nWebhookAdapter
 *   - All other agents use the REST+SSE ApiClient
 *   - To add a new webhook, configure the env var and register in
 *     lib/n8n-webhook-adapter.ts
 */

import type {
  AgentExecution,
  AgentNode,
  AgentResult,
  LogEntry,
  RunnerEvent,
  EventHandler,
  ExecutionState,
  ExecutionError,
} from './types';

import { apiClient } from './api-client';
import { n8nWebhookAdapter } from './n8n-webhook-adapter';
import type { ExecutionAdapter } from './api-client';
import type { ApiExecutionResponse } from './api-types';

export class AgentRunner {
  private execution: AgentExecution | null = null;
  private listeners: Set<EventHandler> = new Set();
  private cancelled = false;
  private executionState: ExecutionState = 'idle';
  private executionError: ExecutionError | null = null;
  private unsubscribeStream: (() => void) | null = null;
  private poller: ReturnType<typeof setInterval> | null = null;
  /** The adapter used for the current execution */
  private currentAdapter: ExecutionAdapter | null = null;

  /** Subscribe to runner events */
  on(handler: EventHandler): () => void {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }

  /** Remove all listeners */
  off(handler: EventHandler): void {
    this.listeners.delete(handler);
  }

  private emit(event: RunnerEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        // swallow handler errors to keep the runner alive
      }
    }
  }

  private log(
    level: LogEntry['level'],
    message: string,
    nodeId?: string
  ): void {
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      message,
      nodeId,
    };
    this.execution?.logs.push(entry);
    this.emit({
      type: 'log',
      executionId: this.execution?.id ?? '',
      agentId: this.execution?.agentId ?? '',
      nodeId,
      data: entry,
      timestamp: Date.now(),
    });
  }

  private setExecutionState(
    state: ExecutionState,
    error?: ExecutionError
  ): void {
    this.executionState = state;
    this.executionError = error ?? null;
  }

  /** Get current execution state */
  get state(): ExecutionState {
    return this.executionState;
  }

  /** Get last execution error */
  get error(): ExecutionError | null {
    return this.executionError;
  }

  /**
   * Resolve which adapter to use for a given agent.
   * Webhook adapter takes priority if a webhook URL is configured.
   */
  private resolveAdapter(agentId: string): ExecutionAdapter {
    if (n8nWebhookAdapter.hasWebhook(agentId)) {
      return n8nWebhookAdapter;
    }
    return apiClient;
  }

  /**
   * Check if an agent uses webhook-based execution.
   */
  isWebhookAgent(agentId: string): boolean {
    return n8nWebhookAdapter.hasWebhook(agentId);
  }

  /**
   * Start a full execution for the given agent.
   *
   * Automatically selects the adapter:
   *   - n8n webhook if configured for this agent (synchronous)
   *   - REST+SSE API client otherwise (streaming)
   *
   * @param agentId - The agent identifier (e.g. 'icp', 'leads', 'outreach')
   * @param payload - Optional custom input payload to send to the backend
   */
  async start(agentId: string, payload?: Record<string, unknown>): Promise<AgentExecution> {
    if (this.executionState === 'running' || this.execution?.status === 'running') {
      this.log('warn', 'Run request ignored because an execution is already running.');
      if (this.execution) return this.execution;
      throw new Error('An execution is already running');
    }

    this.cancel(); // clean up previous run
    this.cancelled = false;
    this.executionError = null;
    this.setExecutionState('running');

    // Create a placeholder execution immediately for UI responsiveness
    const placeholderExecution: AgentExecution = {
      id: `connecting-${Date.now()}`,
      agentId,
      status: 'idle',
      nodes: [],
      startTime: Date.now(),
      endTime: null,
      logs: [],
    };
    this.execution = placeholderExecution;

    const adapter = this.resolveAdapter(agentId);
    this.currentAdapter = adapter;
    const isN8nWebhook = adapter === n8nWebhookAdapter;

    if (isN8nWebhook) {
      placeholderExecution.status = 'running';
      placeholderExecution.nodes = [
        {
          id: 'waiting-for-n8n',
          name: 'Waiting for n8n workflow',
          status: 'running',
          duration: 0,
          input: '',
          output: '',
          error: null,
        },
      ];
      this.setExecutionState('running');
      this.emit({
        type: 'execution-start',
        executionId: placeholderExecution.id,
        agentId,
        timestamp: Date.now(),
      });
      this.log('info', 'Sending request to Lead Management webhook...');
      this.log('info', 'Waiting for n8n workflow completion...');
    } else {
      this.emit({
        type: 'log',
        executionId: placeholderExecution.id,
        agentId,
        timestamp: Date.now(),
        data: {
          timestamp: Date.now(),
          level: 'info',
          message: 'Connecting to execution backend...',
        } as LogEntry,
      });
    }

    try {
      const startResponse = await fetch('/api/agents/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, payload: payload ?? {} }),
      });

      if (!startResponse.ok) {
        const errorBody = await startResponse.text();
        throw new Error(`Agent start failed (${startResponse.status}): ${errorBody}`);
      }

      const response = await startResponse.json() as ApiExecutionResponse;
// A webhook acknowledgement is not completion when n8n responds immediately.
      const isSynchronous = adapter === n8nWebhookAdapter && response.status !== 'running';
      return this.handleExecutionResponse(response, placeholderExecution, agentId, isSynchronous, isN8nWebhook);
    } catch (error) {
      // For lead agent, try to extract request ID and continue polling even on webhook timeout
      if (agentId === 'leads' && typeof payload?.request_id === 'string') {
        const requestId = payload.request_id;
        return this.handleStartErrorWithFallbackPolling(error, agentId, requestId);
      }
      return this.handleStartError(error, agentId);
    }
  }

  /**
   * Handle the execution response from any adapter.
   * For webhooks (synchronous), emit all events immediately.
   * For REST+SSE, subscribe to streaming.
   */
  private isLeadAgentAcknowledgement(response: ApiExecutionResponse): boolean {
    return response.agentId === 'leads' &&
      (response.status === 'running' || response.status === 'processing') &&
      response.nodes.some(n => n.id === 'lead-management-workflow');
  }
  private async handleExecutionResponse(
    response: ApiExecutionResponse,
    placeholderExecution: AgentExecution,
    agentId: string,
    isSynchronous: boolean,
    executionAlreadyStarted = false
  ): Promise<AgentExecution> {
    if (this.isLeadAgentAcknowledgement(response)) {
      console.log('[RUNNER] Lead agent acknowledgement detected, starting polling for:', response.id);
      // Clear any error state and set to running when we get acknowledgement
      this.setExecutionState('running');
      this.executionError = null;
      this.startPollingForLeads(response.id);
      this.execution = response;
      this.emit({
        type: 'execution-start',
        executionId: response.id,
        agentId: response.agentId,
        timestamp: Date.now(),
      });
      this.log('info', 'Workflow acknowledged. Polling for results...');
      return response;
    }
    // Map API response to internal execution type
    const nodes: AgentNode[] = response.nodes.map((n) => ({
      id: n.id,
      name: n.name,
      status: n.status as AgentNode['status'],
      duration: n.duration,
      input: n.input,
      output: n.output,
      error: n.error,
    }));

    const execution: AgentExecution = {
      id: response.id,
      agentId: response.agentId,
      status: isSynchronous ? response.status : 'running',
      nodes,
      startTime: response.startTime ?? Date.now(),
      endTime: response.endTime,
      logs: response.logs.map((l) => ({
        timestamp: l.timestamp,
        level: l.level as LogEntry['level'],
        message: l.message,
        nodeId: l.nodeId,
      })),
    };

    // Merge any logs from the placeholder
    execution.logs = [...placeholderExecution.logs, ...execution.logs];
    this.execution = execution;
    this.setExecutionState('running');

    // Emit execution start only once for a long-running webhook request.
    if (!executionAlreadyStarted) {
      this.emit({
        type: 'execution-start',
        executionId: execution.id,
        agentId: execution.agentId,
        timestamp: Date.now(),
      });
    }

    this.log('info', `Execution started for agent: ${agentId}`);

    // For synchronous (webhook) responses, emit all events at once
    if (isSynchronous) {
      for (const node of nodes) {
        if (node.status === 'running' || node.status === 'pending') {
          this.emit({
            type: 'node-start',
            executionId: execution.id,
            agentId: execution.agentId,
            nodeId: node.id,
            data: { node },
            timestamp: Date.now(),
          });
        }
        if (node.status === 'success') {
          this.emit({
            type: 'node-start',
            executionId: execution.id,
            agentId: execution.agentId,
            nodeId: node.id,
            data: { node },
            timestamp: Date.now(),
          });
          this.emit({
            type: 'node-complete',
            executionId: execution.id,
            agentId: execution.agentId,
            nodeId: node.id,
            data: { node },
            timestamp: Date.now(),
          });
        }
        if (node.status === 'failed') {
          this.emit({
            type: 'node-start',
            executionId: execution.id,
            agentId: execution.agentId,
            nodeId: node.id,
            data: { node },
            timestamp: Date.now(),
          });
          this.emit({
            type: 'node-error',
            executionId: execution.id,
            agentId: execution.agentId,
            nodeId: node.id,
            data: { node, error: node.error },
            timestamp: Date.now(),
          });
        }
      }

      // Emit logs
      for (const log of response.logs) {
        this.emit({
          type: 'log',
          executionId: execution.id,
          agentId: execution.agentId,
          nodeId: log.nodeId,
          data: log,
          timestamp: log.timestamp,
        });
      }

      // Complete the execution
      execution.status = response.status === 'failed' ? 'failed' : 'completed';
      execution.endTime = response.endTime ?? Date.now();
      this.execution = execution;
      this.setExecutionState(execution.status === 'completed' ? 'completed' : 'failed');

      this.emit({
        type: 'execution-complete',
        executionId: execution.id,
        agentId: execution.agentId,
        data: this.getResult(),
        timestamp: Date.now(),
      });
      this.log(
        'info',
        execution.status === 'completed' && agentId === 'leads'
          ? 'Lead Management workflow completed.'
          : `Execution ${execution.status} via webhook`
      );
    } else if (this.currentAdapter !== n8nWebhookAdapter) {
      // Asynchronous REST executions provide an SSE stream.
      this.unsubscribeStream = apiClient.streamExecution(
        execution.id,
        (event) => this.handleStreamEvent(event),
        (error) => this.handleStreamError(error),
        () => this.handleStreamClose()
      );
    } else {
      // n8n acknowledged the trigger but did not provide a trackable execution.
      // Keep the UI in RUNNING state rather than treating the acknowledgement as completion.
      this.log('warn', 'Waiting for n8n workflow completion; no execution status endpoint is available.');
    }

    return execution;
  }

  private startPollingForLeads(requestId: string): void {
    this.log('info', `Workflow acknowledged. Polling for results for request ID: ${requestId}`);
    this.log('info', 'This may take 10-15 minutes depending on workflow complexity...');

    if (this.poller) {
      clearInterval(this.poller);
    }

    const startPollingTime = Date.now();
    const POLLING_TIMEOUT = 1200000; // 20 minutes max polling time
    const POLLING_INTERVAL = 3000; // Poll every 3 seconds

    this.poller = setInterval(async () => {
      if (this.cancelled) {
        if (this.poller) clearInterval(this.poller);
        return;
      }

      // Check if we've exceeded the polling timeout
      const elapsedTime = Date.now() - startPollingTime;
      if (elapsedTime > POLLING_TIMEOUT) {
        this.log('error', 'Polling timeout: Lead generation took longer than 15 minutes');
        if (this.poller) clearInterval(this.poller);
        this.handleStartError(
          new Error('Lead generation workflow exceeded maximum wait time of 15 minutes'),
          'leads'
        );
        return;
      }

      try {
        const res = await fetch(`/api/leads/results/${requestId}`);
        if (!res.ok) {
          this.log('warn', `Polling failed: Server responded with ${res.status}`);
          return;
        }

        const result = await res.json();

        if (result.status === 'completed') {
          this.log('info', 'Polling successful: Lead generation completed.');
          if (this.poller) clearInterval(this.poller);
          this.poller = null;

          try {
            const finalResult = n8nWebhookAdapter.normalizeWebhookResponse(result, 'leads');
            const finalExecution = await this.handleExecutionResponse(finalResult, this.execution!, 'leads', true, true);
            this.execution = finalExecution;
          } catch (handlerError) {
            this.log('error', `Error handling completion response: ${(handlerError as Error).message}`);
            this.handleStartError(handlerError, 'leads');
          }
          return;

        } else if (result.status === 'failed') {
          this.log('error', `Polling result: Lead generation failed. Error: ${result.error}`);
          if (this.poller) clearInterval(this.poller);
          this.poller = null;
          this.handleStartError(new Error(result.error ?? 'Lead generation failed in n8n'), 'leads');
          return;

        } else if (result.status === 'processing') {
          const elapsedSeconds = Math.round(elapsedTime / 1000);
          this.log('info', `Still processing... (${elapsedSeconds}s elapsed)`);
        }
        // if status is 'processing', do nothing and wait for the next poll.

      } catch (error) {
        this.log('error', `Polling request failed: ${(error as Error).message}`);
        if (this.poller) clearInterval(this.poller);
        this.poller = null;
        this.handleStartError(error, 'leads');
      }
    }, POLLING_INTERVAL);
  }

  private handleStreamEvent(event: import('./api-types').ApiStreamEvent): void {
    if (this.cancelled || !this.execution) return;

    switch (event.type) {
      case 'node-start':
        if (event.nodeId) {
          const node = this.execution.nodes.find((n) => n.id === event.nodeId);
          if (node) {
            node.status = 'running';
          }
          this.emit({
            type: 'node-start',
            executionId: this.execution.id,
            agentId: this.execution.agentId,
            nodeId: event.nodeId,
            data: event.data,
            timestamp: event.timestamp,
          });
        }
        break;

      case 'node-complete':
        if (event.nodeId) {
          const node = this.execution.nodes.find((n) => n.id === event.nodeId);
          if (node && event.data) {
            const data = event.data as { node?: Partial<AgentNode> };
            if (data.node) {
              node.status = 'success';
              node.output = data.node.output ?? node.output;
              node.duration = data.node.duration ?? node.duration;
            }
          }
          this.emit({
            type: 'node-complete',
            executionId: this.execution.id,
            agentId: this.execution.agentId,
            nodeId: event.nodeId,
            data: event.data,
            timestamp: event.timestamp,
          });
        }
        break;

      case 'node-error':
        if (event.nodeId) {
          const node = this.execution.nodes.find((n) => n.id === event.nodeId);
          if (node && event.data) {
            const data = event.data as { node?: Partial<AgentNode>; error?: string };
            if (data.node) {
              node.status = 'failed';
              node.error = data.error ?? data.node.error ?? 'Unknown error';
              node.duration = data.node.duration ?? node.duration;
            }
          }
          this.emit({
            type: 'node-error',
            executionId: this.execution.id,
            agentId: this.execution.agentId,
            nodeId: event.nodeId,
            data: event.data,
            timestamp: event.timestamp,
          });
        }
        break;

      case 'log':
        if (event.data) {
          const logEntry = event.data as LogEntry;
          this.execution.logs.push(logEntry);
          this.emit({
            type: 'log',
            executionId: this.execution.id,
            agentId: this.execution.agentId,
            nodeId: logEntry.nodeId,
            data: logEntry,
            timestamp: event.timestamp,
          });
        }
        break;

      case 'execution-complete':
        this.execution.status = 'completed';
        this.execution.endTime = event.timestamp;
        this.setExecutionState('completed');
        this.emit({
          type: 'execution-complete',
          executionId: this.execution.id,
          agentId: this.execution.agentId,
          data: this.getResult(),
          timestamp: event.timestamp,
        });
        this.log('info', 'Execution completed successfully');
        this.cleanupStream();
        break;

      case 'execution-cancelled':
        this.execution.status = 'cancelled';
        this.execution.endTime = event.timestamp;
        this.setExecutionState('cancelled');
        this.emit({
          type: 'execution-cancelled',
          executionId: this.execution.id,
          agentId: this.execution.agentId,
          timestamp: event.timestamp,
        });
        this.log('warn', 'Execution cancelled');
        this.cleanupStream();
        break;
    }
  }

  private handleStreamError(error: Error): void {
    this.log('warn', `Stream warning: ${error.message}`);
  }

  private handleStreamClose(): void {
    if (this.execution?.status === 'running') {
      this.log('debug', 'Stream connection closed, continuing to poll');
    }
  }

  private getAdapterBaseUrl(): string {
    if (this.currentAdapter === n8nWebhookAdapter) {
      return n8nWebhookAdapter.resolveWebhookUrl(this.execution?.agentId ?? '') ?? 'unknown webhook';
    }
    return apiClient.baseUrl;
  }

  private async handleStartErrorWithFallbackPolling(
    error: unknown,
    agentId: string,
    requestId: string
  ): Promise<AgentExecution> {
    // For lead agent with a timeout error, try polling for results
    // The workflow might have been triggered even if we got a timeout
    if ((error as { name?: string })?.name === 'TimeoutError') {
      this.log('warn', 'Webhook request timed out, but workflow may still be processing');
      this.log('info', 'Continuing to poll for results from n8n...');
      
      // Update the execution with the request ID so polling can use it
      if (this.execution && !this.execution.id.startsWith('connecting-')) {
        this.execution.id = requestId;
      }
      
      this.setExecutionState('running');
      this.startPollingForLeads(requestId);
      return this.execution || {
        id: requestId,
        agentId,
        status: 'running',
        nodes: [{
          id: 'lead-management-workflow',
          name: 'Lead Management workflow',
          status: 'running',
          duration: 0,
          input: '',
          output: '',
          error: null,
        }],
        startTime: Date.now(),
        endTime: null,
        logs: [
          {
            timestamp: Date.now(),
            level: 'warn',
            message: 'Webhook connection timed out, but continuing to poll for results...',
          },
        ],
      };
    }

    // For other errors, fall back to standard error handling
    return this.handleStartError(error, agentId);
  }

  private async handleStartError(error: unknown, agentId: string): Promise<AgentExecution> {
    let executionError: ExecutionError;

    if ((error as { name?: string })?.name === 'TimeoutError') {
      executionError = {
        type: 'timeout',
        message: `Request timed out. Backend did not respond within the configured timeout.`,
      };
    } else if ((error as { statusCode?: number })?.statusCode) {
      const apiErr = error as { statusCode: number; message: string; details?: Record<string, unknown> };
      executionError = {
        type: 'api',
        message: `API error (${apiErr.statusCode}): ${apiErr.message}`,
        details: apiErr.details,
      };
    } else if ((error as { name?: string })?.name === 'NetworkError' || error instanceof TypeError) {
      executionError = {
        type: 'network',
        message: `Cannot reach the backend. Is the server running?`,
      };
    } else {
      executionError = {
        type: 'unknown',
        message: `Unexpected error: ${(error as Error)?.message ?? String(error)}`,
      };
    }

    this.executionError = executionError;
    this.setExecutionState('error', executionError);

    const failedExecution: AgentExecution = {
      id: `error-${Date.now()}`,
      agentId,
      status: 'failed',
      nodes: [],
      startTime: Date.now(),
      endTime: Date.now(),
      logs: [
        ...(this.execution?.logs ?? []),
        {
          timestamp: Date.now(),
          level: 'error',
          message: executionError.message,
        },
      ],
    };
    this.execution = failedExecution;

    this.emit({
      type: 'execution-error',
      executionId: failedExecution.id,
      agentId,
      data: executionError,
      timestamp: Date.now(),
    });

    this.log('error', `Execution failed: ${executionError.message}`);

    this.emit({
      type: 'execution-complete',
      executionId: failedExecution.id,
      agentId,
      data: this.getResult(),
      timestamp: Date.now(),
    });

    return failedExecution;
  }

  private cleanupStream(): void {
    if (this.unsubscribeStream) {
      this.unsubscribeStream();
      this.unsubscribeStream = null;
    }
    if (this.poller) {
      clearInterval(this.poller);
    }
    this.currentAdapter = null;
  }

  /** Cancel the current execution */
  cancel(): void {
    if (!this.execution) return;
    if (this.execution.status === 'completed' || this.execution.status === 'cancelled' || this.execution.status === 'failed') {
      return;
    }

    this.cancelled = true;
    this.cleanupStream();

    const execId = this.execution.id;
    if (
      execId &&
      !execId.startsWith('connecting-') &&
      !execId.startsWith('error-') &&
      this.currentAdapter &&
      this.currentAdapter !== n8nWebhookAdapter
    ) {
      this.currentAdapter.cancelExecution(execId).catch(() => {
        // Best-effort cancellation
      });
    }

    this.execution.status = 'cancelled';
    this.execution.endTime = Date.now();
    this.setExecutionState('cancelled');

    this.emit({
      type: 'execution-cancelled',
      executionId: this.execution.id,
      agentId: this.execution.agentId,
      timestamp: Date.now(),
    });
    this.log('warn', 'Execution cancelled by user');
  }

  /** Get the current execution result */
  getResult(): AgentResult | null {
    if (!this.execution || !this.execution.startTime) return null;
    const endTime = this.execution.endTime ?? Date.now();
    const totalDuration = endTime - this.execution.startTime;
    return {
      success: this.execution.status === 'completed',
      executionId: this.execution.id,
      agentId: this.execution.agentId,
      nodes: this.execution.nodes,
      startTime: this.execution.startTime,
      endTime,
      totalDuration,
      logs: this.execution.logs,
    };
  }

  /** Check if currently running */
  get isRunning(): boolean {
    return this.execution?.status === 'running' || false;
  }

  /** Check if currently running */
  get isLoading(): boolean {
    return this.executionState === 'running';
  }

  /** Get current execution status */
  get status(): AgentExecution['status'] | null {
    return this.execution?.status ?? null;
  }

  /** Dispose the runner */
  destroy(): void {
    this.cleanupStream();
    this.listeners.clear();
    this.execution = null;
    this.executionError = null;
    this.setExecutionState('idle');
  }
}

/** Singleton instance for the app */
export const runner = new AgentRunner();
