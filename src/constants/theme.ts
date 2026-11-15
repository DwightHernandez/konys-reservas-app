import { useColorScheme } from 'react-native';

export const LIGHT_COLORS = {
  ink: '#0F2B3D',
  hero: '#0F2B3D',
  orange: '#F28C28',
  orangeText: '#0F2B3D',
  cream: '#F4F7F9',
  muted: '#647784',
  line: '#D9E2E8',
  white: '#FFFFFF',
  surface: '#FFFFFF',
  pale: '#EAF1F5',
  green: '#278252',
  greenButton: '#237648',
  red: '#C53D35',
  redButton: '#B8322B',
  gray: '#E8EDF1',
  heroBody: '#E7F0F4',
  badgeBg: '#19465B',
  badgeText: '#FFD39D',
  placeholder: '#8A9AA4',
  photoBg: '#E3EBEF',
  disabled: '#D6DEE3',
  overlay: 'rgba(5, 20, 29, 0.58)',
  dangerSurface: '#FCECEA',
};

export const DARK_COLORS = {
  ink: '#F3F7F9',
  hero: '#0F2B3D',
  orange: '#F28C28',
  orangeText: '#0F2B3D',
  cream: '#071722',
  muted: '#A9BBC5',
  line: '#244354',
  white: '#FFFFFF',
  surface: '#0D2330',
  pale: '#153648',
  green: '#77CF97',
  greenButton: '#237648',
  red: '#FF8E83',
  redButton: '#A8322E',
  gray: '#203A49',
  heroBody: '#DCE8ED',
  badgeBg: '#19465B',
  badgeText: '#FFD39D',
  placeholder: '#8FA2AD',
  photoBg: '#153648',
  disabled: '#344B58',
  overlay: 'rgba(0, 8, 13, 0.72)',
  dangerSurface: '#452B2B',
};

// Legacy Expo Router hook compatibility; new screens use useAppTheme().
export const Colors = {
  light: { ...LIGHT_COLORS, text: LIGHT_COLORS.ink, background: LIGHT_COLORS.cream, tint: LIGHT_COLORS.orange, icon: LIGHT_COLORS.muted, tabIconDefault: LIGHT_COLORS.muted, tabIconSelected: LIGHT_COLORS.orange },
  dark: { ...DARK_COLORS, text: DARK_COLORS.ink, background: DARK_COLORS.cream, tint: DARK_COLORS.orange, icon: DARK_COLORS.muted, tabIconDefault: DARK_COLORS.muted, tabIconSelected: DARK_COLORS.orange },
};

export type AppColors = typeof LIGHT_COLORS;

export function useAppTheme(): AppColors {
  return useColorScheme() === 'dark' ? DARK_COLORS : LIGHT_COLORS;
}
