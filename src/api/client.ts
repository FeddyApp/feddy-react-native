import type {
  APIResponse,
  CommentListResponse,
  CommentRequest,
  CommentResponse,
  ErrorResponse,
  FeedbackListResponse,
  FeedbackSubmission,
  FeedbackSubmissionResponse,
  GetFeedbacksOptions,
  VoteRequest,
  VoteResponse,
} from './types';

type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export type FeddyAPIErrorType =
  | 'invalid-url'
  | 'no-data'
  | 'decoding'
  | 'network'
  | 'server'
  | 'invalid-api-key'
  | 'rate-limited';

export class FeddyAPIError extends Error {
  readonly type: FeddyAPIErrorType;

  constructor(
    type: FeddyAPIErrorType,
    message: string,
    options?: { cause?: unknown }
  ) {
    super(message, options);
    this.type = type;
    this.name = 'FeddyAPIError';
  }

  static invalidURL(): FeddyAPIError {
    return new FeddyAPIError('invalid-url', 'Invalid URL');
  }

  static noData(): FeddyAPIError {
    return new FeddyAPIError('no-data', 'No data received');
  }

  static decoding(message: string, cause?: unknown): FeddyAPIError {
    return new FeddyAPIError('decoding', message, { cause });
  }

  static network(message: string, cause?: unknown): FeddyAPIError {
    return new FeddyAPIError('network', message, { cause });
  }

  static server(message: string): FeddyAPIError {
    return new FeddyAPIError('server', message);
  }

  static invalidAPIKey(): FeddyAPIError {
    return new FeddyAPIError('invalid-api-key', 'Invalid API key');
  }

  static rateLimited(): FeddyAPIError {
    return new FeddyAPIError('rate-limited', 'Rate limit exceeded');
  }
}

interface RequestOptions {
  path: string;
  method: HTTPMethod;
  query?: Record<string, string | undefined>;
  body?: unknown;
}

export interface FeddyAPIClientConfig {
  apiKey: string;
  baseUrl: string;
}

export class FeddyAPIClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(config: FeddyAPIClientConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
  }

  async getFeedbacks(
    options: GetFeedbacksOptions = {}
  ): Promise<FeedbackListResponse> {
    const { status, userId } = options;
    const response = await this.request<FeedbackListResponse>({
      path: '/api/feedback',
      method: 'GET',
      query: {
        status,
        userId,
      },
    });

    if (!response.data) {
      throw FeddyAPIError.noData();
    }

    return response.data;
  }

  async submitFeedback(
    submission: FeedbackSubmission
  ): Promise<FeedbackSubmissionResponse> {
    const response = await this.request<FeedbackSubmissionResponse>({
      path: '/api/feedback/submit',
      method: 'POST',
      body: submission,
    });

    if (!response.data) {
      throw FeddyAPIError.noData();
    }

    return response.data;
  }

  async voteFeedback(payload: VoteRequest): Promise<VoteResponse> {
    const response = await this.request<VoteResponse>({
      path: '/api/feedback/vote',
      method: 'POST',
      body: payload,
    });

    if (!response.data) {
      throw FeddyAPIError.noData();
    }

    return response.data;
  }

  async getComments(
    feedbackId: string,
    limit?: number,
    offset?: number
  ): Promise<CommentListResponse> {
    const response = await this.request<CommentListResponse>({
      path: '/api/feedback/comment',
      method: 'GET',
      query: {
        feedbackId,
        limit: limit != null ? String(limit) : undefined,
        offset: offset != null ? String(offset) : undefined,
      },
    });

    if (!response.data) {
      throw FeddyAPIError.noData();
    }

    return response.data;
  }

  async addComment(comment: CommentRequest): Promise<CommentResponse> {
    const response = await this.request<CommentResponse>({
      path: '/api/feedback/comment',
      method: 'POST',
      body: comment,
    });

    if (!response.data) {
      throw FeddyAPIError.noData();
    }

    return response.data;
  }

  private buildURL(
    path: string,
    query?: Record<string, string | undefined>
  ): string {
    const url = new URL(this.baseUrl + path);

    if (query) {
      Object.entries(query)
        .filter(
          ([, value]) => value !== undefined && value !== null && value !== ''
        )
        .forEach(([key, value]) => {
          url.searchParams.append(key, value as string);
        });
    }

    return url.toString();
  }

  private async request<T>({
    path,
    method,
    query,
    body,
  }: RequestOptions): Promise<APIResponse<T>> {
    let url: string;

    try {
      url = this.buildURL(path, query);
    } catch (error) {
      throw FeddyAPIError.invalidURL();
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
    };

    const init: RequestInit = { method, headers };

    if (body !== undefined) {
      try {
        init.body = JSON.stringify(body);
      } catch (error) {
        throw FeddyAPIError.decoding('Failed to encode request body', error);
      }
    }

    let response: Response;

    try {
      response = await fetch(url, init);
    } catch (error) {
      throw FeddyAPIError.network('Network request failed', error);
    }

    let text: string;

    try {
      text = await response.text();
    } catch (error) {
      throw FeddyAPIError.decoding('Failed to read response body', error);
    }

    let json: APIResponse<T> | ErrorResponse | null = null;

    if (text) {
      try {
        json = JSON.parse(text) as APIResponse<T> | ErrorResponse;
      } catch (error) {
        throw FeddyAPIError.decoding('Failed to parse response JSON', error);
      }
    }

    if (!response.ok) {
      if (response.status === 401) {
        throw FeddyAPIError.invalidAPIKey();
      }

      if (response.status === 429) {
        throw FeddyAPIError.rateLimited();
      }

      const message =
        json && 'error' in json ? json.error : `HTTP ${response.status}`;
      throw FeddyAPIError.server(message ?? 'Server error');
    }

    if (!json) {
      throw FeddyAPIError.noData();
    }

    return json as APIResponse<T>;
  }
}
