import { useColorScheme } from 'react-native';
import { useMemo } from 'react';

export interface FeddyTheme {
  background: string;
  surface: string;
  surfaceBorder: string;
  surfaceSubtle: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentText: string;
  accentSoft: string;
  overlay: string;
  modalBackground: string;
  modalBorder: string;
  inputBackground: string;
  inputBorder: string;
  inputText: string;
  placeholder: string;
  buttonPrimaryBackground: string;
  buttonPrimaryText: string;
  buttonDisabledBackground: string;
  buttonDisabledText: string;
  destructive: string;
  voteContainerBackground: string;
  voteContainerBorder: string;
  voteActiveBackground: string;
  voteActiveBorder: string;
  voteNeutralText: string;
  voteActiveText: string;
  segmentBackground: string;
  segmentBorder: string;
  segmentIndicator: string;
  segmentLabel: string;
  segmentLabelActive: string;
  helperText: string;
  errorText: string;
  chipBackground: string;
  chipBorder: string;
  chipText: string;
  chipSelectedBackground: string;
  chipSelectedText: string;
  commentCardBorder: string;
  commentBackground: string;
  commentMeta: string;
  replyBorder: string;
  sendButtonBackground: string;
  sendButtonText: string;
  refreshControlTint: string;
  shadowColor: string;
}

const LIGHT_THEME: FeddyTheme = {
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceBorder: '#e2e8f0',
  surfaceSubtle: '#f1f5f9',
  textPrimary: '#0f172a',
  textSecondary: '#334155',
  textMuted: '#64748b',
  accent: '#2563eb',
  accentText: '#ffffff',
  accentSoft: 'rgba(37, 99, 235, 0.14)',
  overlay: 'rgba(15, 23, 42, 0.45)',
  modalBackground: '#ffffff',
  modalBorder: '#e2e8f0',
  inputBackground: '#ffffff',
  inputBorder: '#cbd5f5',
  inputText: '#0f172a',
  placeholder: '#94a3b8',
  buttonPrimaryBackground: '#2563eb',
  buttonPrimaryText: '#ffffff',
  buttonDisabledBackground: '#cbd5f5',
  buttonDisabledText: '#94a3b8',
  destructive: '#dc2626',
  voteContainerBackground: '#ffffff',
  voteContainerBorder: '#e2e8f0',
  voteActiveBackground: 'rgba(249, 115, 22, 0.12)',
  voteActiveBorder: '#fb923c',
  voteNeutralText: '#0f172a',
  voteActiveText: '#f97316',
  segmentBackground: '#e2e8f0',
  segmentBorder: '#cbd5f5',
  segmentIndicator: '#2563eb',
  segmentLabel: '#475569',
  segmentLabelActive: '#ffffff',
  helperText: '#64748b',
  errorText: '#dc2626',
  chipBackground: '#ffffff',
  chipBorder: '#dbeafe',
  chipText: '#475569',
  chipSelectedBackground: '#2563eb',
  chipSelectedText: '#ffffff',
  commentCardBorder: '#e2e8f0',
  commentBackground: '#ffffff',
  commentMeta: '#64748b',
  replyBorder: '#e2e8f0',
  sendButtonBackground: '#2563eb',
  sendButtonText: '#ffffff',
  refreshControlTint: '#2563eb',
  shadowColor: '#0f172a',
};

const DARK_THEME: FeddyTheme = {
  background: '#050b19',
  surface: '#0f172a',
  surfaceBorder: '#1e293b',
  surfaceSubtle: 'rgba(255,255,255,0.04)',
  textPrimary: '#e2e8f0',
  textSecondary: '#cbd5f5',
  textMuted: '#94a3b8',
  accent: '#38bdf8',
  accentText: '#0f172a',
  accentSoft: 'rgba(56, 189, 248, 0.2)',
  overlay: 'rgba(2, 6, 23, 0.72)',
  modalBackground: '#0f172a',
  modalBorder: '#1e293b',
  inputBackground: '#020617',
  inputBorder: '#1e293b',
  inputText: '#e2e8f0',
  placeholder: '#64748b',
  buttonPrimaryBackground: '#38bdf8',
  buttonPrimaryText: '#0f172a',
  buttonDisabledBackground: '#1e293b',
  buttonDisabledText: '#475569',
  destructive: '#f87171',
  voteContainerBackground: 'rgba(255,255,255,0.02)',
  voteContainerBorder: '#1e293b',
  voteActiveBackground: 'rgba(249,115,22,0.1)',
  voteActiveBorder: '#f97316',
  voteNeutralText: '#94a3b8',
  voteActiveText: '#f97316',
  segmentBackground: '#0f172a',
  segmentBorder: '#1e293b',
  segmentIndicator: 'rgba(56, 189, 248, 0.18)',
  segmentLabel: '#94a3b8',
  segmentLabelActive: '#0f172a',
  helperText: '#94a3b8',
  errorText: '#f87171',
  chipBackground: '#020617',
  chipBorder: '#1e293b',
  chipText: '#94a3b8',
  chipSelectedBackground: '#38bdf8',
  chipSelectedText: '#0f172a',
  commentCardBorder: '#1e293b',
  commentBackground: '#0f172a',
  commentMeta: '#94a3b8',
  replyBorder: '#1e293b',
  sendButtonBackground: '#38bdf8',
  sendButtonText: '#0f172a',
  refreshControlTint: '#38bdf8',
  shadowColor: '#000000',
};

export function useFeddyTheme(): FeddyTheme {
  const scheme = useColorScheme();
  return useMemo(
    () => (scheme === 'dark' ? DARK_THEME : LIGHT_THEME),
    [scheme]
  );
}
