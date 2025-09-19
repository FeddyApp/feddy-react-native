import type { FC } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { FeedbackItem } from '../api/types';

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

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
  },
  voteContainer: {
    width: 56,
    height: 72,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    backgroundColor: 'rgba(255,255,255,0.02)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  voteContainerActive: {
    borderColor: '#f97316',
    backgroundColor: 'rgba(249,115,22,0.1)',
  },
  voteArrow: {
    fontSize: 18,
    color: '#94a3b8',
    marginBottom: 6,
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
    color: '#f8fafc',
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
    color: '#f8fafc',
  },
  description: {
    marginTop: 8,
    fontSize: 14,
    color: '#cbd5f5',
  },
});

export default FeedbackRow;
