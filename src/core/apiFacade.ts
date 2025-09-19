import type {
  CommentListResponse,
  CommentRequest,
  CommentResponse,
  FeedbackListResponse,
  FeedbackSubmission,
  FeedbackSubmissionResponse,
  GetFeedbacksOptions,
  VoteRequest,
  VoteResponse,
} from '../api/types';
import { FeddyAPIError } from '../api/client';
import Feddy from './feddy';
import { createApiClient, ensureConfiguredState } from './nativeModule';

const FeddyAPI = {
  async getFeedbacks(
    options: GetFeedbacksOptions = {}
  ): Promise<FeedbackListResponse> {
    const state = ensureConfiguredState();
    const client = createApiClient(state);
    return client.getFeedbacks({
      ...options,
      userId: options.userId ?? state.user.userId ?? undefined,
    });
  },

  async submitFeedback(
    payload: FeedbackSubmission
  ): Promise<FeedbackSubmissionResponse> {
    const state = ensureConfiguredState();
    const client = createApiClient(state);
    return client.submitFeedback(payload);
  },

  async voteFeedback(payload: VoteRequest): Promise<VoteResponse> {
    const client = createApiClient();
    return client.voteFeedback(payload);
  },

  async getComments(
    feedbackId: string,
    limit?: number,
    offset?: number
  ): Promise<CommentListResponse> {
    const client = createApiClient();
    return client.getComments(feedbackId, limit, offset);
  },

  async addComment(payload: CommentRequest): Promise<CommentResponse> {
    const client = createApiClient();
    return client.addComment(payload);
  },
} as const;

export { FeddyAPI, FeddyAPIError };
export type {
  CommentListResponse,
  CommentRequest,
  CommentResponse,
  FeedbackListResponse,
  FeedbackSubmission,
  FeedbackSubmissionResponse,
  GetFeedbacksOptions,
  VoteRequest,
  VoteResponse,
};

export function enrichSubmissionMetadata(
  payload: FeedbackSubmission
): FeedbackSubmission {
  const user = Feddy.getUser();
  const state = Feddy.getState();

  return {
    ...payload,
    metadata: {
      ...payload.metadata,
      userId: payload.metadata.userId || user.userId || 'anonymous',
      sdkVersion: state.sdkVersion,
    },
    userName: payload.userName ?? user.name ?? null,
    userEmail: payload.userEmail ?? user.email ?? null,
  };
}
