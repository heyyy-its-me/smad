/**
 * N8nWebhookAdapter Ã¢â‚¬â€ synchronous webhook-based execution adapter.
 *
 * This adapter implements the ExecutionAdapter interface by POSTing
 * agent payloads to n8n webhook URLs and mapping the synchronous
 * response into the frontend's AgentExecution / AgentResult types.
 *
 * Since n8n webhooks are synchronous (request Ã¢â€ â€™ response), there is
 * no SSE streaming or polling needed. The adapter returns a fully
 * completed execution in the response.
 *
 * To add more agents:
 *   1. Add the webhook URL to the environment variables
 *   2. Register it in the `webhookUrls` map
 *
 * To swap in a production backend later:
 *   - Replace this adapter with ApiClient (REST + SSE)
 *   - Or create a new adapter implementing ExecutionAdapter
 *   - No UI changes needed
 */

import type {
  StartExecutionRequest,
  ApiExecutionResponse,
  ApiStreamEvent,
  ApiNodeResponse,
  ApiLogResponse,
} from './api-types';
import { ApiError, NetworkError, TimeoutError } from './api-client';
import type { ExecutionAdapter } from './api-client';

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Webhook URL Registry Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

/**
 * Maps agent IDs to their n8n webhook URLs.
 * Add new agents here as webhooks become available.
 */
const WEBHOOK_URLS: Record<string, string | undefined> = {
  leads: process.env.NEXT_PUBLIC_LEAD_MANAGEMENT_WEBHOOK_URL,
  outreach: process.env.NEXT_PUBLIC_OUTREACH_WEBHOOK_URL,
};

// Timeout for initial webhook acknowledgement (30 seconds)
const WEBHOOK_INITIAL_TIMEOUT_MS = 30000;
// Maximum polling timeout (15 minutes for complex n8n workflows)
const LEAD_MANAGEMENT_POLLING_TIMEOUT_MS = 900000;

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Response Schema Detection Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

/**
 * The n8n webhook can return responses in different shapes.
 * This adapter tries multiple schemas and normalises them.
 *
 * Supported response schemas:
 *
 * Schema A (Full execution):
 * ```json
 * {
 *   "executionId": "exec-xxx",
 *   "nodes": [{ "id": "lead-1", "name": "Lead Enrichment", ... }],
 *   "logs": [...],
 *   "startTime": 1234567890,
 *   "endTime": 1234567890
 * }
 * ```
 *
 * Schema B (Logs array only):
 * ```json
 * [
 *   { "level": "info", "message": "Processing...", "timestamp": 123 },
 *   { "level": "info", "message": "Done!", "timestamp": 456 }
 * ]
 * ```
 *
 * Schema C (Single result object):
 * ```json
 * {
 *   "success": true,
 *   "message": "Lead enrichment completed",
 *   "data": { ... }
 * }
 * ```
 */

interface NormalisedResponse {
  nodes: ApiNodeResponse[];
  logs: ApiLogResponse[];
  startTime: number;
  endTime: number;
  success: boolean;
}

function isWorkflowStartedAcknowledgement(raw: unknown): raw is Record<string, unknown> {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return false;

  const response = raw as Record<string, unknown>;
  
  // Check for n8n workflow trigger acknowledgement patterns:
  // 1. status: 'processing' or 'running' (workflow is executing)
  // 2. Explicit "workflow was started" message
  // 3. executionId without error indicators
  const isProcessingOrRunning = response.status === 'processing' || response.status === 'running';
  
  const hasStartMessage = typeof response.message === 'string' &&
    /^(workflow was started|.*is.*processing)\.?$/i.test(response.message.trim());
  
  const hasExecutionIdWithoutError = 
    typeof response.executionId === 'string' &&
    !responseIndicatesFailure(response);

  return isProcessingOrRunning || hasStartMessage || hasExecutionIdWithoutError;
}

function isFinalLeadManagementResponse(raw: unknown): raw is Record<string, unknown> {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return false;

  const response = raw as Record<string, unknown>;
  return response.status === 'completed' &&
    typeof response.request_id === 'string' &&
    typeof response.total_count === 'number' &&
    Array.isArray(response.leads);
}
function responseIndicatesFailure(response: Record<string, unknown>): boolean {
  return (
    response.success === false ||
    response.status === 'failed' ||
    response.status === 'error' ||
    (typeof response.error === 'string' && response.error.length > 0)
  );
}

function normalizeWebhookResponse(raw: unknown, agentId: string): ApiExecutionResponse {
  const now = Date.now();

  if (!raw) {
    return {
      id: "client-request-" + now,
      agentId,
      status: "completed",
      nodes: [],
      logs: [{ timestamp: now, level: "info" as const, message: "Webhook returned empty response." }],
      startTime: now,
      endTime: now,
    };
  }

  // Schema A: Full execution with nodes array
  if (typeof raw === 'object' && raw !== null && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;

    if (Array.isArray(obj.nodes)) {
      const nodes: ApiNodeResponse[] = obj.nodes.map((n: unknown, i: number) => {
        const node = (n as Record<string, unknown>) ?? {};
        return {
          id: (node.id as string) ?? `${agentId}-${i + 1}`,
          name: (node.name as string) ?? `Step ${i + 1}`,
          status: (node.status as ApiNodeResponse['status']) ?? 'success',
          duration: (node.duration as number) ?? 0,
          input: (node.input as string) ?? '',
          output: (node.output as string) ?? '',
          error: (node.error as string) ?? null,
        };
      });

      const logs: ApiLogResponse[] = Array.isArray(obj.logs)
        ? (obj.logs as ApiLogResponse[]).map((l: unknown) => {
            const log = (l as Record<string, unknown>) ?? {};
            return {
              timestamp: (log.timestamp as number) ?? now,
              level: (log.level as ApiLogResponse['level']) ?? 'info',
              message: (log.message as string) ?? '',
              nodeId: log.nodeId as string | undefined,
            };
          })
        : [];

      const norm: NormalisedResponse = {
        nodes,
        logs,
        startTime: (obj.startTime as number) ?? now,
        endTime: (obj.endTime as number) ?? now,
        success: !responseIndicatesFailure(obj) && nodes.every((n) => n.status !== 'failed'),
      };

      return {
        id: (obj.executionId as string) ?? `client-request-${now}`,
        agentId,
        status: norm.success ? 'completed' : 'failed',
        ...norm,
        logs: norm.logs as ApiLogResponse[],
      };
    }

    // Schema C: Single final result object
    const failed = responseIndicatesFailure(obj);
    const errorMessage = typeof obj.error === 'string' ? obj.error : undefined;
    const message = errorMessage ?? (obj.message as string) ?? (obj.result as string) ?? JSON.stringify(obj);
    const output = JSON.stringify(obj);
    const norm: NormalisedResponse = {
      nodes: [
        {
          id: `${agentId}-1`,
          name: agentId === 'leads' ? 'Lead Management' : 'Agent Execution',
          status: failed ? 'failed' : 'success',
          duration: 0,
          input: '',
          output,
          error: failed ? errorMessage ?? message : null,
        },
      ],
      logs: [
        {
          timestamp: now,
          level: failed ? 'error' : 'info',
          message: `Webhook response received: ${message.substring(0, 200)}`,
        },
      ],
      startTime: now,
      endTime: now,
      success: !failed,
    };

    return {
      id: (obj.request_id as string) ?? `client-request-${now}`,
      agentId,
      status: norm.success ? 'completed' : 'failed',
      ...norm,
      logs: norm.logs as ApiLogResponse[],
    };
  }

  // Schema B: Array of log entries
  if (Array.isArray(raw)) {
    const logs: ApiLogResponse[] = raw.map((item: unknown) => {
      const entry = (item as Record<string, unknown>) ?? {};
      if (entry.level && entry.message) {
        return {
          timestamp: (entry.timestamp as number) ?? now,
          level: (entry.level as ApiLogResponse['level']) ?? 'info',
          message: (entry.message as string) ?? '',
          nodeId: entry.nodeId as string | undefined,
        };
      }
      return {
        timestamp: now,
        level: 'info',
        message: JSON.stringify(item),
      };
    });

    const norm: NormalisedResponse = {
      nodes: [
        {
          id: `${agentId}-1`,
          name: 'Lead Management',
          status: 'success',
          duration: 0,
          input: '',
          output: JSON.stringify(raw),
          error: null,
        },
      ],
      logs,
      startTime: now,
      endTime: now,
      success: true,
    };

    return {
      id: `client-request-${now}`,
      agentId,
      status: 'completed',
      ...norm,
      logs: norm.logs as ApiLogResponse[],
    };
  }

  // Fallback: wrap as a single log and return
  return {
    nodes: [
      {
        id: `${agentId}-1`,
        name: 'Lead Management',
        status: 'success',
        duration: 0,
        input: '',
        output: String(raw).substring(0, 500),
        error: null,
      },
    ],
    logs: [
      {
        timestamp: now,
        level: 'info',
        message: String(raw).substring(0, 300),
      },
    ],
    startTime: now,
    endTime: now,
    id: `client-request-${now}`,
    agentId,
    status: 'completed',
  };
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Adapter Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

export class N8nWebhookAdapter implements ExecutionAdapter {
  normalizeWebhookResponse = normalizeWebhookResponse;
  private timeoutMs: number;

  constructor(config?: { timeoutMs?: number }) {
    this.timeoutMs = config?.timeoutMs ?? 60000; // n8n workflows can take longer
  }

  /**
   * Resolve the webhook URL for a given agent.
   * Returns null if no webhook is configured for this agent.
   */
  resolveWebhookUrl(agentId: string): string | null {
    const url = WEBHOOK_URLS[agentId];
    return url && url.length > 0 ? url : null;
  }

  /**
   * Check if a webhook is configured for the given agent.
   */
  hasWebhook(agentId: string): boolean {
    return this.resolveWebhookUrl(agentId) !== null;
  }

  private getTimeoutMs(agentId: string): number {
    // All webhook calls have a 30-second timeout for initial acknowledgement
    // For lead agent, the actual processing happens asynchronously and we poll for results
    return agentId === 'leads' ? WEBHOOK_INITIAL_TIMEOUT_MS : WEBHOOK_INITIAL_TIMEOUT_MS;
  }

  /**
   * Get all agent IDs that have webhooks configured.
   */
  get configuredAgents(): string[] {
    return Object.entries(WEBHOOK_URLS)
      .filter(([_, url]) => url && url.length > 0)
      .map(([agentId]) => agentId);
  }

  /**
   * Start execution by POSTing to the configured webhook URL.
   * Returns a completed execution response (synchronous).
   */
  async startExecution(request: StartExecutionRequest): Promise<ApiExecutionResponse> {
    const webhookUrl = this.resolveWebhookUrl(request.agentId);
    if (!webhookUrl) {
      throw new ApiError(
        `No webhook URL configured for agent "${request.agentId}". ` +
          `Set NEXT_PUBLIC_${request.agentId.toUpperCase()}_MANAGEMENT_WEBHOOK_URL environment variable.`,
        404
      );
    }

    const timeoutMs = this.getTimeoutMs(request.agentId);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const httpResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.payload ?? {}),
        signal: controller.signal,
      });

      if (!httpResponse.ok) {
        let errorBody: string | null = null;
        try {
          errorBody = await httpResponse.text();
        } catch {
          // ignore
        }
        throw new ApiError(
          `Webhook responded with HTTP ${httpResponse.status}: ${httpResponse.statusText}` +
            (errorBody ? ` Ã¢â‚¬â€ ${errorBody.substring(0, 300)}` : ''),
          httpResponse.status
        );
      }

      const responseText = await httpResponse.text();
      let responseBody: unknown = null;

      if (responseText.trim()) {
        try {
          responseBody = JSON.parse(responseText);
        } catch {
          responseBody = responseText;
        }
      }
      const now = Date.now();

      const clientRequestId = typeof request.payload?.request_id === 'string' ? request.payload.request_id : null;

      // For the lead agent, if we get an acknowledgement, we return a 'running' status
      // to trigger the polling mechanism in the runner.
      if (request.agentId === 'leads' && isWorkflowStartedAcknowledgement(responseBody)) {
        return {
          id: clientRequestId ?? `lead-trigger-${now}`,
          agentId: request.agentId,
          status: 'running',
          nodes: [
            {
              id: 'lead-management-workflow',
              name: 'Lead Management workflow',
              status: 'running',
              duration: 0,
              input: '',
              output: '',
              error: null,
            },
          ],
          startTime: now,
          endTime: null,
          logs: [
            {
              timestamp: now,
              level: 'info',
              message: `Webhook acknowledged start of workflow.`,
            },
          ],
        };
      }

      // For all other cases, normalize the response as a final result.
      return normalizeWebhookResponse(responseBody, request.agentId);

    } catch (error) {
      if (error instanceof ApiError) throw error;
      if ((error as Error)?.name === 'AbortError') {
        throw new TimeoutError(
          `Webhook timed out after ${timeoutMs}ms. The n8n workflow may still be running.`
        );
      }
      throw new NetworkError(
        `Webhook request failed: ${(error as Error)?.message ?? 'Unknown error'}`,
        error
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Not supported for synchronous webhooks.
   * Webhooks are fire-and-forget; there is no execution state to poll.
   */
  async getExecution(_executionId: string): Promise<ApiExecutionResponse> {
    throw new ApiError('getExecution is not supported for webhook-based execution', 501);
  }

  /**
   * Not supported for synchronous webhooks.
   * The workflow runs immediately on the webhook and cannot be cancelled
   * after the request is sent.
   */
  async cancelExecution(_executionId: string): Promise<void> {
    throw new ApiError('cancelExecution is not supported for webhook-based execution', 501);
  }

  /**
   * No-op stream for synchronous webhooks.
   * All execution data is returned in the startExecution response,
   * so no subscription is needed.
   */
  streamExecution(
    _executionId: string,
    _onEvent: (event: ApiStreamEvent) => void,
    _onError?: (error: Error) => void,
    _onClose?: () => void
  ): () => void {
    // No-op: synchronous webhooks don't stream
    return () => {};
  }
}

/** Singleton instance */
export const n8nWebhookAdapter = new N8nWebhookAdapter();
