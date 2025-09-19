import type { FC } from 'react';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { FeedbackItem } from '../api/types';
import type { FeddyTheme } from '../styles/theme';
import { useFeddyTheme } from '../styles/theme';

interface Props {
  feedback: FeedbackItem;
  onVote: () => void;
  onPress: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  PLANNED: '#7C3AED',
  IN_PROGRESS: '#2563EB',
  IN_REVIEW: '#0EA5E9',
  COMPLETED: '#10B981',
};

export const FeedbackRow: FC<Props> = ({ feedback, onVote, onPress }) => {
  const theme = useFeddyTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const userVoted = Boolean(feedback.userVoted);
  const statusColor = STATUS_COLORS[feedback.status] ?? '#475569';

  return (
    <Pressable
      style={styles.container}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View
        style={[styles.voteContainer, userVoted && styles.voteContainerActive]}
      >
        <Pressable
          onPress={(event) => {
            event.stopPropagation();
            onVote();
          }}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Vote for this feedback"
        >
          <Text style={[styles.voteArrow, userVoted && styles.voteArrowActive]}>
            ▲
          </Text>
        </Pressable>
        <Text style={[styles.voteCount, userVoted && styles.voteCountActive]}>
          {feedback.voteCount}
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={1}>
            {feedback.title}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>
              {feedback.status.replace(/_/g, ' ')}
            </Text>
          </View>
        </View>
        <Text style={styles.description} numberOfLines={2}>
          {feedback.description}
        </Text>
      </View>
    </Pressable>
  );
};

const createStyles = (theme: FeddyTheme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      padding: 16,
      backgroundColor: theme.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.surfaceBorder,
      alignItems: 'center',
    },
    voteContainer: {
      width: 56,
      height: 72,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.voteContainerBorder,
      backgroundColor: theme.voteContainerBackground,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    voteContainerActive: {
      borderColor: theme.voteActiveBorder,
      backgroundColor: theme.voteActiveBackground,
    },
    voteArrow: {
      fontSize: 18,
      color: theme.voteNeutralText,
      marginBottom: 6,
    },
    voteArrowActive: {
      color: theme.voteActiveText,
    },
    voteCount: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    voteCountActive: {
      color: theme.voteActiveText,
    },
    content: {
      flex: 1,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    title: {
      flex: 1,
      fontSize: 16,
      fontWeight: '600',
      color: theme.textPrimary,
      marginRight: 8,
    },
    statusBadge: {
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    statusText: {
      fontSize: 10,
      fontWeight: '600',
      color: '#ffffff',
    },
    description: {
      marginTop: 8,
      fontSize: 14,
      color: theme.textSecondary,
    },
  });

export default FeedbackRow;
