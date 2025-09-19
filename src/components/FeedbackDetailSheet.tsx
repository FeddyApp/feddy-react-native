import type { FC } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Feddy from '../core/feddy';
import { FeddyAPI, FeddyAPIError } from '../core/apiFacade';
import type { CommentItem, CommentType, FeedbackItem } from '../api/types';
import type { FeddyTheme } from '../styles/theme';
import { useFeddyTheme } from '../styles/theme';

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

const MAX_COMMENT_LENGTH = 1000;
const MIN_COMPOSER_HEIGHT = 88;

const DISPLAY_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
};

function formatCommentType(type: CommentType): string {
  return type.toLowerCase().replace(/^./, (char) => char.toUpperCase());
}

function formatDisplayDate(value: string | null | undefined): string {
  if (!value) {
    return 'Unknown';
  }

  const tryParse = (input: string): string | null => {
    const timestamp = Date.parse(input);
    if (Number.isNaN(timestamp)) {
      return null;
    }

    try {
      return new Intl.DateTimeFormat(undefined, DISPLAY_DATE_FORMAT).format(
        new Date(timestamp)
      );
    } catch (error) {
      return new Date(timestamp).toISOString().slice(0, 10);
    }
  };

  const candidates: string[] = [
    value,
    value.includes('T') ? value : value.replace(' ', 'T'),
  ];

  if (!value.endsWith('Z')) {
    candidates.push(`${value}Z`);
    candidates.push(
      value.includes('T') ? `${value}Z` : `${value.replace(' ', 'T')}Z`
    );
  }

  for (const candidate of candidates) {
    const formatted = tryParse(candidate);
    if (formatted) {
      return formatted;
    }
  }

  return value;
}

export const FeedbackDetailSheet: FC<Props> = ({
  visible,
  feedback,
  onDismiss,
  onVote,
}) => {
  const theme = useFeddyTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
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

    if (trimmed.length > MAX_COMMENT_LENGTH) {
      setError(`Comments are limited to ${MAX_COMMENT_LENGTH} characters.`);
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

  const canSubmit = useMemo(() => {
    const trimmed = commentText.trim();
    return trimmed.length > 0 && trimmed.length <= MAX_COMMENT_LENGTH;
  }, [commentText]);

  const commentHelperText = useMemo(() => {
    const trimmed = commentText.trim();
    if (trimmed.length === 0) {
      return 'Share your thoughts to keep the conversation going.';
    }
    if (trimmed.length > MAX_COMMENT_LENGTH) {
      return `Comment is ${trimmed.length - MAX_COMMENT_LENGTH} characters over the limit.`;
    }
    return `${MAX_COMMENT_LENGTH - trimmed.length} characters remaining.`;
  }, [commentText]);

  const renderCommentItem = useCallback(
    ({ item }: { item: CommentItem }) => (
      <View style={styles.commentCard}>
        <Text style={styles.commentAuthor}>
          {item.author.userName ?? item.author.userId}
        </Text>
        <Text style={styles.commentMeta}>
          {formatCommentType(item.commentType)} ·{' '}
          {formatDisplayDate(item.createdAt)}
        </Text>
        <Text style={styles.commentContent}>{item.content}</Text>
        {item.replies && item.replies.length > 0 ? (
          <View style={styles.repliesContainer}>
            {item.replies.map((reply) => (
              <View key={reply.id} style={styles.replyCard}>
                <Text style={styles.commentAuthor}>
                  {reply.author.userName ?? reply.author.userId}
                </Text>
                <Text style={styles.commentMeta}>
                  {formatCommentType(reply.commentType)} ·{' '}
                  {formatDisplayDate(reply.createdAt)}
                </Text>
                <Text style={styles.commentContent}>{reply.content}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    ),
    [styles]
  );

  const renderEmptyComponent = useCallback(() => {
    if (loadingComments) {
      return null;
    }
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyHint}>No comments yet.</Text>
      </View>
    );
  }, [loadingComments, styles]);

  if (!feedback) {
    return null;
  }

  const statusLabel = STATUS_LABELS[feedback.status] ?? feedback.status;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
      onRequestClose={onDismiss}
    >
      <SafeAreaView style={styles.screen}>
        <View style={styles.headerBar}>
          <Pressable onPress={onDismiss} accessibilityRole="button">
            <Text style={styles.headerAction}>Close</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Feedback Detail</Text>
          <View style={styles.headerSpacer} />
        </View>

        <KeyboardAvoidingView
          style={styles.body}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.select({ ios: 0, android: 36 }) ?? 0}
        >
          <FlatList
            data={comments}
            renderItem={renderCommentItem}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyComponent}
            ListHeaderComponent={
              <View style={styles.headerContent}>
                <Text style={styles.title}>{feedback.title}</Text>
                <Text style={styles.description}>{feedback.description}</Text>

                <View style={styles.metaSection}>
                  <Text style={styles.metaText}>Status: {statusLabel}</Text>
                  <Text style={styles.metaText}>Type: {feedback.type}</Text>
                  <Text style={styles.metaText}>
                    Priority: {feedback.priority}
                  </Text>
                </View>

                <View style={styles.voteRow}>
                  <Text style={styles.voteText}>
                    Votes: {feedback.voteCount}
                  </Text>
                  {onVote ? (
                    <Pressable
                      onPress={() => onVote(feedback.id)}
                      disabled={Boolean(feedback.userVoted)}
                      accessibilityRole="button"
                    >
                      <Text
                        style={[
                          styles.voteAction,
                          feedback.userVoted ? styles.voteActionDisabled : null,
                        ]}
                      >
                        {feedback.userVoted ? 'Voted' : 'Vote'}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>

                <View style={styles.composer}>
                  <TextInput
                    style={styles.composerInput}
                    placeholder="Share your thoughts"
                    placeholderTextColor={theme.placeholder}
                    value={commentText}
                    onChangeText={setCommentText}
                    editable={!submitting}
                    multiline
                  />
                  <Pressable
                    style={[
                      styles.sendButton,
                      !canSubmit || submitting
                        ? styles.sendButtonDisabled
                        : null,
                    ]}
                    onPress={handleSubmitComment}
                    disabled={!canSubmit || submitting}
                    accessibilityRole="button"
                  >
                    <Text style={styles.sendButtonText}>
                      {submitting ? 'Sending…' : 'Send'}
                    </Text>
                  </Pressable>
                  <Text style={styles.helperText}>{commentHelperText}</Text>
                  {error ? <Text style={styles.errorText}>{error}</Text> : null}
                </View>

                <View style={styles.commentsHeader}>
                  <Text style={styles.commentsTitle}>Comments</Text>
                  {loadingComments ? (
                    <ActivityIndicator size="small" color={theme.accent} />
                  ) : null}
                </View>
              </View>
            }
            contentContainerStyle={styles.listContent}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const createStyles = (theme: FeddyTheme) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.background,
    },
    headerBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: theme.modalBorder,
      backgroundColor: theme.surface,
    },
    headerAction: {
      fontWeight: '600',
      color: theme.accent,
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    headerSpacer: {
      width: 48,
    },
    body: {
      flex: 1,
    },
    listContent: {
      paddingHorizontal: 20,
      paddingBottom: 32,
    },
    headerContent: {
      paddingTop: 24,
      paddingBottom: 16,
      gap: 16,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    description: {
      fontSize: 15,
      lineHeight: 22,
      color: theme.textSecondary,
    },
    metaSection: {
      gap: 4,
    },
    metaText: {
      fontSize: 13,
      color: theme.textMuted,
    },
    voteRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    voteText: {
      fontWeight: '600',
      color: theme.textPrimary,
    },
    voteAction: {
      fontWeight: '600',
      color: theme.accent,
    },
    voteActionDisabled: {
      color: theme.textMuted,
    },
    composer: {
      gap: 8,
    },
    composerInput: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.inputBorder,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 12,
      textAlignVertical: 'top',
      backgroundColor: theme.inputBackground,
      color: theme.inputText,
      minHeight: MIN_COMPOSER_HEIGHT,
    },
    sendButton: {
      alignSelf: 'flex-end',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 999,
      backgroundColor: theme.sendButtonBackground,
    },
    sendButtonDisabled: {
      backgroundColor: theme.buttonDisabledBackground,
      opacity: 0.7,
    },
    sendButtonText: {
      fontWeight: '600',
      color: theme.sendButtonText,
    },
    helperText: {
      fontSize: 12,
      color: theme.helperText,
    },
    errorText: {
      fontSize: 12,
      color: theme.errorText,
    },
    commentsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 12,
    },
    commentsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    emptyContainer: {
      paddingVertical: 32,
      alignItems: 'center',
    },
    emptyHint: {
      fontSize: 13,
      color: theme.textMuted,
    },
    commentCard: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.commentCardBorder,
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
      gap: 4,
      backgroundColor: theme.commentBackground,
    },
    commentAuthor: {
      fontWeight: '600',
      color: theme.textPrimary,
    },
    commentMeta: {
      fontSize: 12,
      color: theme.commentMeta,
    },
    commentContent: {
      lineHeight: 20,
      color: theme.textSecondary,
    },
    repliesContainer: {
      marginTop: 12,
      paddingLeft: 12,
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderColor: theme.replyBorder,
      gap: 12,
    },
    replyCard: {
      gap: 4,
    },
  });

export default FeedbackDetailSheet;
