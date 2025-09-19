import type { FC } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  LayoutAnimation,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import Feddy from '../core/feddy';
import {
  FeddyAPI,
  FeddyAPIError,
  enrichSubmissionMetadata,
} from '../core/apiFacade';
import type {
  FeedbackItem,
  FeedbackListResponse,
  FeedbackStatus,
  VoteRequest,
} from '../api/types';
import type { FeddyTheme } from '../styles/theme';
import { useFeddyTheme } from '../styles/theme';
import FeedbackRow from './FeedbackRow';
import FeedbackDetailSheet from './FeedbackDetailSheet';
import { FeedbackSubmitModal } from './FeedbackSubmitModal';

const STATUS_OPTIONS: { value: FeedbackStatus; label: string }[] = [
  { value: 'IN_REVIEW', label: 'In Review' },
  { value: 'PLANNED', label: 'Planned' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
];

type FeedbackCache = Record<FeedbackStatus, FeedbackItem[]>;

const INITIAL_CACHE: FeedbackCache = {
  IN_REVIEW: [],
  PLANNED: [],
  IN_PROGRESS: [],
  COMPLETED: [],
};

const INITIAL_LOADING_MAP: Record<FeedbackStatus, boolean> = {
  IN_REVIEW: false,
  PLANNED: false,
  IN_PROGRESS: false,
  COMPLETED: false,
};

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const FeedbackListView: FC = () => {
  const theme = useFeddyTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [status, setStatus] = useState<FeedbackStatus>('IN_REVIEW');
  const [cache, setCache] = useState<FeedbackCache>(INITIAL_CACHE);
  const [loadingMap, setLoadingMap] =
    useState<Record<FeedbackStatus, boolean>>(INITIAL_LOADING_MAP);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(
    null
  );
  const [showSubmit, setShowSubmit] = useState(false);
  const [segmentWidth, setSegmentWidth] = useState(0);

  const indicator = useRef(
    new Animated.Value(
      STATUS_OPTIONS.findIndex((option) => option.value === 'IN_REVIEW')
    )
  ).current;

  const ensureConfigured = useCallback(() => {
    const state = Feddy.getState();
    if (!state.isConfigured) {
      throw new Error(
        'Feddy SDK is not configured. Call Feddy.configure() before using the list view.'
      );
    }
    return state;
  }, []);

  const loadFeedbacks = useCallback(
    async (
      targetStatus: FeedbackStatus,
      force = false,
      options?: { refresh?: boolean }
    ) => {
      try {
        ensureConfigured();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Feddy SDK not configured'
        );
        if (options?.refresh) {
          setRefreshing(false);
        }
        return;
      }

      if (!force && cache[targetStatus].length > 0) {
        if (options?.refresh) {
          setRefreshing(false);
        }
        return;
      }

      if (options?.refresh) {
        setRefreshing(true);
      } else {
        setLoadingMap((current) => ({ ...current, [targetStatus]: true }));
      }
      setError(null);

      try {
        const response: FeedbackListResponse = await FeddyAPI.getFeedbacks({
          status: targetStatus,
        });
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setCache((current) => ({
          ...current,
          [targetStatus]: response.feedbacks ?? [],
        }));
      } catch (err) {
        if (err instanceof FeddyAPIError) {
          setError(`${err.type}: ${err.message}`);
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Unknown error');
        }
      } finally {
        if (options?.refresh) {
          setRefreshing(false);
        } else {
          setLoadingMap((current) => ({ ...current, [targetStatus]: false }));
        }
      }
    },
    [cache, ensureConfigured]
  );

  useEffect(() => {
    loadFeedbacks(status, cache[status].length === 0);
  }, [status, cache, loadFeedbacks]);

  const activeIndex = useMemo(
    () => STATUS_OPTIONS.findIndex((option) => option.value === status),
    [status]
  );

  useEffect(() => {
    Animated.spring(indicator, {
      toValue: activeIndex,
      damping: 16,
      stiffness: 180,
      mass: 0.6,
      useNativeDriver: true,
    }).start();
  }, [activeIndex, indicator]);

  const handleVote = useCallback(
    async (feedbackId: string) => {
      try {
        const user = Feddy.getUser();
        if (!user.userId) {
          throw new Error(
            'User ID unavailable. Please configure Feddy with a user first.'
          );
        }

        const payload: VoteRequest = {
          feedbackId,
          userId: user.userId,
          userName: user.name,
          userEmail: user.email,
        };

        await FeddyAPI.voteFeedback(payload);
        setSelectedFeedback((current) =>
          current && current.id === feedbackId
            ? {
                ...current,
                userVoted: true,
                voteCount: current.voteCount + 1,
              }
            : current
        );
        await loadFeedbacks(status, true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to submit vote');
      }
    },
    [loadFeedbacks, status]
  );

  const data = useMemo(() => cache[status], [cache, status]);
  const isLoadingCurrent = loadingMap[status];

  const handleSubmitFeedback = useCallback(
    async (payload: Parameters<typeof FeddyAPI.submitFeedback>[0]) => {
      const enrichedPayload = enrichSubmissionMetadata(payload);

      await FeddyAPI.submitFeedback(enrichedPayload);
      await loadFeedbacks('IN_REVIEW', true);
      await loadFeedbacks(status, true);
    },
    [loadFeedbacks, status]
  );

  const renderItem = useCallback(
    ({ item }: { item: FeedbackItem }) => (
      <View style={styles.rowWrapper}>
        <FeedbackRow
          feedback={item}
          onVote={() => handleVote(item.id)}
          onPress={() => setSelectedFeedback(item)}
        />
      </View>
    ),
    [handleVote, styles.rowWrapper]
  );

  return (
    <View style={styles.screen}>
      <View style={styles.headerRow}>
        <Text style={styles.screenTitle}>Feedback</Text>
        <Pressable style={styles.addButton} onPress={() => setShowSubmit(true)}>
          <Text style={styles.addButtonText}>+ Submit</Text>
        </Pressable>
      </View>

      <View
        style={styles.segmentContainer}
        onLayout={(event) => {
          const { width } = event.nativeEvent.layout;
          setSegmentWidth(width / STATUS_OPTIONS.length);
        }}
      >
        {segmentWidth > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.segmentIndicator,
              {
                width: segmentWidth,
                transform: [
                  {
                    translateX: indicator.interpolate({
                      inputRange: [0, STATUS_OPTIONS.length - 1],
                      outputRange: [
                        0,
                        segmentWidth * (STATUS_OPTIONS.length - 1),
                      ],
                    }),
                  },
                ],
              },
            ]}
          />
        ) : null}

        {STATUS_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            style={[
              styles.segmentItem,
              option.value === status && styles.segmentItemActive,
            ]}
            onPress={() => setStatus(option.value)}
          >
            <Text
              style={[
                styles.segmentLabel,
                option.value === status && styles.segmentLabelActive,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {isLoadingCurrent && data.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={theme.accent} />
          <Text style={styles.loadingText}>Loading feedback…</Text>
        </View>
      ) : data.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyTitle}>No feedback yet</Text>
          <Text style={styles.emptySubtitle}>
            Be the first to share feedback for this status.
          </Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadFeedbacks(status, true, { refresh: true })}
              tintColor={theme.refreshControlTint}
            />
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      <FeedbackDetailSheet
        visible={selectedFeedback != null}
        feedback={selectedFeedback}
        onDismiss={() => setSelectedFeedback(null)}
        onVote={async (feedbackId) => {
          await handleVote(feedbackId);
          await loadFeedbacks(status, true);
        }}
      />

      <FeedbackSubmitModal
        visible={showSubmit}
        onClose={() => setShowSubmit(false)}
        onSubmit={handleSubmitFeedback}
      />
    </View>
  );
};

const createStyles = (theme: FeddyTheme) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.background,
      paddingTop: 24,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      marginBottom: 18,
    },
    screenTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    addButton: {
      backgroundColor: theme.buttonPrimaryBackground,
      borderRadius: 999,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    addButtonText: {
      color: theme.buttonPrimaryText,
      fontWeight: '600',
    },
    segmentContainer: {
      flexDirection: 'row',
      backgroundColor: theme.segmentBackground,
      borderRadius: 14,
      marginHorizontal: 20,
      padding: 4,
      borderWidth: 1,
      borderColor: theme.segmentBorder,
      position: 'relative',
      overflow: 'hidden',
    },
    segmentIndicator: {
      position: 'absolute',
      top: 4,
      bottom: 4,
      left: 4,
      borderRadius: 10,
      backgroundColor: theme.segmentIndicator,
    },
    segmentItem: {
      flex: 1,
      borderRadius: 10,
      paddingVertical: 10,
      alignItems: 'center',
    },
    segmentItemActive: {
      backgroundColor: 'transparent',
    },
    segmentLabel: {
      color: theme.segmentLabel,
      fontWeight: '600',
    },
    segmentLabelActive: {
      color: theme.segmentLabelActive,
    },
    error: {
      marginHorizontal: 20,
      marginTop: 16,
      color: theme.errorText,
    },
    loadingContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 48,
      gap: 12,
    },
    loadingText: {
      color: theme.textMuted,
    },
    emptyState: {
      marginTop: 64,
      alignItems: 'center',
      paddingHorizontal: 32,
      gap: 12,
    },
    emptyIcon: {
      fontSize: 48,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    emptySubtitle: {
      textAlign: 'center',
      color: theme.textMuted,
    },
    listContent: {
      paddingTop: 20,
      paddingBottom: 120,
      paddingHorizontal: 20,
      gap: 16,
    },
    rowWrapper: {
      shadowColor: theme.shadowColor,
      shadowOpacity: 0.12,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
  });

export default FeedbackListView;
