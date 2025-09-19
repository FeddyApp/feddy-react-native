export type FeedbackType = 'bug' | 'feature' | 'improvement' | 'question';

export type FeedbackPriority = 'low' | 'medium' | 'high' | 'critical';

export type FeedbackStatus =
  | 'IN_REVIEW'
  | 'PLANNED'
  | 'IN_PROGRESS'
  | 'COMPLETED';

export interface FeedbackItem {
  id: string;
  title: string;
  description: string;
  type: FeedbackType;
  priority: FeedbackPriority;
  status: FeedbackStatus;
  voteCount: number;
  userVoted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackListResponse {
  feedbacks: FeedbackItem[];
  total: number;
  project: ProjectInfo;
}

export interface ProjectInfo {
  id: string;
  name: string;
}

export interface FeedbackMetadata {
  userId: string;
  platform: string;
  appVersion?: string | null;
  sdkVersion?: string | null;
}

export interface FeedbackSubmission {
  title: string;
  description: string;
  type: string;
  priority?: string | null;
  userEmail?: string | null;
  userName?: string | null;
  userAgent?: string | null;
  deviceInfo?: string | null;
  screenshot?: string | null;
  logs?: string | null;
  metadata: FeedbackMetadata;
}

export interface FeedbackSubmissionResponse {
  id: string;
  status: string;
  project: ProjectInfo;
}

export interface VoteRequest {
  feedbackId: string;
  userId: string;
  userName?: string | null;
  userEmail?: string | null;
}

export interface VoteResponse {
  feedbackId: string;
  voteCount: number;
}

export type CommentType = 'ADMIN' | 'AUTHOR' | 'USER';

export interface CommentAuthor {
  userId: string;
  userName?: string | null;
}

export interface CommentItem {
  id: string;
  content: string;
  commentType: CommentType;
  author: CommentAuthor;
  parentId?: string | null;
  replies?: CommentItem[] | null;
  createdAt: string;
}

export interface CommentPagination {
  limit: number;
  offset: number;
  count: number;
}

export interface CommentListResponse {
  comments: CommentItem[];
  feedbackId: string;
  pagination: CommentPagination;
}

export interface CommentRequest {
  feedbackId: string;
  userId: string;
  userName?: string | null;
  userEmail?: string | null;
  content: string;
  parentId?: string | null;
}

export interface CommentResponse {
  commentId: string;
  feedbackId: string;
  commentType: CommentType;
}

export interface APIResponseMeta {
  timestamp: string;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T | null;
  error?: string | null;
  meta: APIResponseMeta;
}

export interface ErrorResponse {
  success: boolean;
  error: string;
  meta: APIResponseMeta;
}

export interface GetFeedbacksOptions {
  status?: FeedbackStatus;
  userId?: string;
}
