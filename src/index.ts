export { default as Feddy } from './core/feddy';
export type {
  ConfigureOptions,
  FeddyState,
  FeddyUser,
  UpdateUserOptions,
} from './core/nativeModule';

export {
  FeddyAPI,
  FeddyAPIError,
  enrichSubmissionMetadata,
} from './core/apiFacade';
export type {
  FeedbackItem,
  FeedbackListResponse,
  FeedbackSubmission,
  FeedbackSubmissionResponse,
  FeedbackType,
  FeedbackPriority,
  FeedbackStatus,
  VoteRequest,
  VoteResponse,
  CommentListResponse,
  CommentRequest,
  CommentResponse,
  CommentItem,
  CommentType,
  GetFeedbacksOptions,
} from './api/types';

export { default as FeedbackListView } from './components/FeedbackListView';
export { default as FeedbackDetailSheet } from './components/FeedbackDetailSheet';
export { FeedbackSubmitModal } from './components/FeedbackSubmitModal';
export { default as FeedbackRow } from './components/FeedbackRow';
