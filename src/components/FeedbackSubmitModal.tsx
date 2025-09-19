import type { FC } from 'react';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { FeedbackSubmission } from '../api/types';
import type { FeddyTheme } from '../styles/theme';
import { useFeddyTheme } from '../styles/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: FeedbackSubmission) => Promise<void>;
  defaultType?: string;
}

const FEEDBACK_TYPES = [
  { value: 'BUG', label: 'Bug' },
  { value: 'FEATURE', label: 'Feature' },
  { value: 'IMPROVEMENT', label: 'Improvement' },
  { value: 'QUESTION', label: 'Question' },
];

const FEEDBACK_PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

export const FeedbackSubmitModal: FC<Props> = ({
  visible,
  onClose,
  onSubmit,
  defaultType = 'BUG',
}) => {
  const theme = useFeddyTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [type, setType] = useState(defaultType);
  const [priority, setPriority] = useState<string | null>('medium');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    title.trim().length > 0 && description.trim().length > 0 && !submitting;

  const platformInfo = useMemo(() => {
    const os = Platform.OS.toUpperCase();
    const version = String(Platform.Version);
    return `${os} ${version}`;
  }, []);

  const handleClose = () => {
    if (submitting) {
      return;
    }
    onClose();
    setError(null);
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }

    const payload: FeedbackSubmission = {
      title: title.trim(),
      description: description.trim(),
      type,
      priority,
      userEmail: email.trim() || null,
      metadata: {
        userId: '',
        platform: platformInfo,
        appVersion: null,
        sdkVersion: null,
      },
    };

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(payload);
      setTitle('');
      setDescription('');
      setError(null);
      onClose();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to submit feedback');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={handleClose}
      transparent
    >
      <View style={styles.backdrop}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Submit Feedback</Text>
            <Pressable onPress={handleClose} hitSlop={16}>
              <Text style={styles.close}>Cancel</Text>
            </Pressable>
          </View>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.section}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.chipRow}>
                {FEEDBACK_TYPES.map((item) => (
                  <Pressable
                    key={item.value}
                    style={[
                      styles.chip,
                      item.value === type && styles.chipSelected,
                    ]}
                    onPress={() => setType(item.value)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        item.value === type && styles.chipTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter feedback title"
                placeholderTextColor={theme.placeholder}
                value={title}
                onChangeText={(value) => {
                  if (value.length <= 50) {
                    setTitle(value);
                  }
                }}
              />
              <Text style={styles.counter}>{title.length}/50</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.multiLine]}
                multiline
                numberOfLines={5}
                placeholder="Describe your feedback in detail"
                placeholderTextColor={theme.placeholder}
                value={description}
                onChangeText={(value) => {
                  if (value.length <= 500) {
                    setDescription(value);
                  }
                }}
              />
              <Text style={styles.counter}>{description.length}/500</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Priority</Text>
              <View style={styles.chipRow}>
                {FEEDBACK_PRIORITIES.map((item) => (
                  <Pressable
                    key={item.value}
                    style={[
                      styles.chip,
                      item.value === priority && styles.chipSelected,
                    ]}
                    onPress={() => setPriority(item.value)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        item.value === priority && styles.chipTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Email (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={theme.placeholder}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </ScrollView>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[
              styles.submitButton,
              !canSubmit && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            {submitting ? (
              <ActivityIndicator color={theme.buttonPrimaryText} />
            ) : (
              <Text style={styles.submitText}>Submit</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (theme: FeddyTheme) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: theme.overlay,
      justifyContent: 'center',
      padding: 16,
    },
    modal: {
      backgroundColor: theme.modalBackground,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.modalBorder,
      maxHeight: '90%',
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.modalBorder,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    close: {
      fontSize: 16,
      color: theme.accent,
    },
    scroll: {
      maxHeight: 420,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 16,
    },
    section: {
      marginTop: 16,
    },
    label: {
      fontSize: 12,
      color: theme.textMuted,
      textTransform: 'uppercase',
      marginBottom: 8,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: theme.chipBackground,
      borderWidth: 1,
      borderColor: theme.chipBorder,
    },
    chipSelected: {
      backgroundColor: theme.chipSelectedBackground,
      borderColor: theme.chipSelectedBackground,
    },
    chipText: {
      color: theme.chipText,
      fontWeight: '500',
    },
    chipTextSelected: {
      color: theme.chipSelectedText,
    },
    input: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: theme.inputText,
      backgroundColor: theme.inputBackground,
    },
    multiLine: {
      minHeight: 120,
      textAlignVertical: 'top',
    },
    counter: {
      marginTop: 4,
      fontSize: 12,
      textAlign: 'right',
      color: theme.textMuted,
    },
    error: {
      marginHorizontal: 20,
      marginTop: 12,
      color: theme.errorText,
    },
    submitButton: {
      margin: 20,
      paddingVertical: 14,
      borderRadius: 14,
      backgroundColor: theme.buttonPrimaryBackground,
      alignItems: 'center',
    },
    submitButtonDisabled: {
      backgroundColor: theme.buttonDisabledBackground,
    },
    submitText: {
      color: theme.buttonPrimaryText,
      fontWeight: '600',
      fontSize: 16,
    },
  });

export default FeedbackSubmitModal;
