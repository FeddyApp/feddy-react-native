import type { FC } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Feddy from '../core/feddy';
import { FeddyAPI, FeddyAPIError } from '../core/apiFacade';
import type { CommentItem, FeedbackItem } from '../api/types';

interface Props {
  visible: boolean;
  feedback: FeedbackItem | null;
  onDismiss: () => void;
  onVote?: (feedbackId: string) => Promise<void> | void;
}

const STATUS_LABELS: Record<string, string> = {
  PLANNED: 'Planned',
  IN_REVIEW: 'In Review',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: '#22c55e',
  medium: '#f97316',
  high: '#ef4444',
  critical: '#a855f7',
};

export const FeedbackDetailModal: FC<Props> = ({
  visible,
  feedback,
  onDismiss,
  onVote,
}) => {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  const loadComments = useCallback(async () => {
    if (!feedback) {
      return;
    }
    setLoadingComments(true);
    setError(null);
    try {
      const result = await FeddyAPI.getComments(feedback.id, 50, 0);
      setComments(result.comments ?? []);
    } catch (err) {
      if (err instanceof FeddyAPIError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unknown error');
      }
    } finally {
      setLoadingComments(false);
    }
  }, [feedback]);

  useEffect(() => {
    if (visible) {
      loadComments();
    } else {
      setComments([]);
      setCommentText('');
      setError(null);
    }
  }, [visible, loadComments]);

  const handleSubmitComment = useCallback(async () => {
    const trimmed = commentText.trim();
    if (!feedback || trimmed.length === 0) {
      return;
    }

    const user = Feddy.getUser();
    if (!user.userId) {
      setError('User ID is required to comment. Configure the SDK first.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await FeddyAPI.addComment({
        feedbackId: feedback.id,
        userId: user.userId,
        userName: user.name,
        userEmail: user.email,
        content: trimmed,
      });
      setCommentText('');
      await loadComments();
    } catch (err) {
      if (err instanceof FeddyAPIError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unknown error');
      }
    } finally {
      setSubmitting(false);
    }
  }, [commentText, feedback, loadComments]);

  const voteChipState = useMemo(() => {
    if (!feedback) {
      return { label: 'Vote', active: false };
    }
    return {
      label: feedback.userVoted ? 'Voted' : 'Vote',
      active: Boolean(feedback.userVoted),
    };
  }, [feedback]);

  if (!feedback) {
    return null;
  }

  const priorityColor = PRIORITY_COLORS[feedback.priority] ?? '#f97316';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onDismiss}
      transparent
    >
      <View style={styles.backdrop}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>{feedback.title}</Text>
            <Pressable onPress={onDismiss} hitSlop={16}>
              <Text style={styles.close}>Done</Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.section}>
              <View style={styles.statusRow}>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>
                    {(
                      STATUS_LABELS[feedback.status] ?? feedback.status
                    ).toUpperCase()}
                  </Text>
                </View>
                {onVote ? (
                  <Pressable
                    onPress={() => onVote(feedback.id)}
                    style={[
                      styles.voteChip,
                      voteChipState.active && styles.voteChipActive,
                    ]}
                    accessibilityRole="button"
                  >
                    <Text
                      style={[
                        styles.voteArrow,
                        voteChipState.active && styles.voteArrowActive,
                      ]}
                    >
                      ▲
                    </Text>
                    <Text
                      style={[
                        styles.voteCount,
                        voteChipState.active && styles.voteCountActive,
                      ]}
                    >
                      {feedback.voteCount}
                    </Text>
                    <Text
                      style={[
                        styles.voteLabel,
                        voteChipState.active && styles.voteCountActive,
                      ]}
                    >
                      {voteChipState.label.toUpperCase()}
                    </Text>
                  </Pressable>
                ) : null}
              </View>

              <Text style={styles.description}>{feedback.description}</Text>

              <View style={styles.tagRow}>
                <View style={styles.typeTag}>
                  <Text style={styles.tagText}>
                    {feedback.type.toUpperCase()}
                  </Text>
                </View>
                <View
                  style={[
                    styles.priorityTag,
                    { backgroundColor: `${priorityColor}1a` },
                  ]}
                >
                  <Text style={[styles.tagText, { color: priorityColor }]}>
                    {feedback.priority.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.commentHeader}>
              <Text style={styles.sectionLabel}>Comments</Text>
              {loadingComments ? (
                <ActivityIndicator color="#38bdf8" size="small" />
              ) : null}
            </View>

            {comments.length === 0 && !loadingComments ? (
              <Text style={styles.empty}>No comments yet.</Text>
            ) : null}

            {comments.map((comment) => (
              <View key={comment.id} style={styles.commentCard}>
                <Text style={styles.commentAuthor}>
                  {comment.author.userName ?? comment.author.userId}
                  <Text style={styles.commentType}>
                    {' '}
                    • {comment.commentType.toLowerCase()}
                  </Text>
                </Text>
                <Text style={styles.commentContent}>{comment.content}</Text>
                <Text style={styles.commentDate}>{comment.createdAt}</Text>
              </View>
            ))}
          </ScrollView>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Add a comment"
              placeholderTextColor="#64748b"
              value={commentText}
              onChangeText={setCommentText}
              editable={!submitting}
              multiline
              numberOfLines={3}
            />
            <Pressable
              style={[
                styles.submitButton,
                (submitting || commentText.trim().length === 0) &&
                  styles.submitButtonDisabled,
              ]}
              onPress={handleSubmitComment}
              disabled={submitting || commentText.trim().length === 0}
            >
              <Text style={styles.submitButtonText}>
                {submitting ? 'Sending…' : 'Send'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.85)',
    justifyContent: 'center',
    padding: 16,
  },
  modal: {
    backgroundColor: '#0b1120',
    borderRadius: 18,
    maxHeight: '92%',
    borderWidth: 1,
    borderColor: '#1f2937',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    marginRight: 16,
  },
  close: {
    fontSize: 16,
    color: '#38bdf8',
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 20,
  },
  section: {
    gap: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(56,189,248,0.16)',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    color: '#38bdf8',
  },
  description: {
    fontSize: 15,
    lineHeight: 21,
    color: '#cbd5f5',
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(59,130,246,0.15)',
  },
  priorityTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: '#94a3b8',
  },
  empty: {
    fontSize: 14,
    color: '#94a3b8',
  },
  voteChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(148,163,184,0.18)',
    gap: 8,
  },
  voteChipActive: {
    backgroundColor: 'rgba(249,115,22,0.2)',
  },
  voteArrow: {
    fontSize: 16,
    color: '#94a3b8',
  },
  voteArrowActive: {
    color: '#f97316',
  },
  voteCount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  voteCountActive: {
    color: '#f97316',
  },
  voteLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    letterSpacing: 0.8,
  },
  commentCard: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1f2937',
    marginTop: 12,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f8fafc',
  },
  commentType: {
    fontSize: 12,
    color: '#94a3b8',
  },
  commentContent: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: '#e2e8f0',
  },
  commentDate: {
    marginTop: 6,
    fontSize: 12,
    color: '#64748b',
  },
  error: {
    marginHorizontal: 20,
    marginBottom: 6,
    fontSize: 13,
    color: '#f87171',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#f8fafc',
    backgroundColor: '#0f172a',
  },
  submitButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#38bdf8',
  },
  submitButtonDisabled: {
    backgroundColor: '#1e293b',
  },
  submitButtonText: {
    color: '#0b1120',
    fontWeight: '600',
  },
});

export default FeedbackDetailModal;
