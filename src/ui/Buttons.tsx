import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AdBadge } from '@/art/icons';
import { colors, MIN_TOUCH, type } from '@/render/theme';

/** primary: mint. paper: light on dark screens. soft: a quieter button on paper cards. ghost: outline on dark. */
type Variant = 'primary' | 'paper' | 'soft' | 'ghost';

interface PillButtonProps {
  label: string;
  icon?: ReactNode;
  /** Mark it as "watch a video" (rewarded ad). */
  ad?: boolean;
  variant?: Variant;
  accessibilityLabel?: string;
  disabled?: boolean;
  onPress: () => void;
}

const FILL: Record<Variant, string> = {
  primary: colors.correct,
  paper: colors.paper,
  soft: colors.paperShade,
  ghost: 'transparent',
};

/** The main buttons: big, rounded, with an optional icon before the label. */
export function PillButton({ label, icon, ad, variant = 'primary', accessibilityLabel, disabled, onPress }: PillButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        { backgroundColor: FILL[variant] },
        variant === 'ghost' && styles.ghost,
        variant === 'paper' && styles.paperEdge,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}>
      {icon}
      <Text style={[type.button, { color: variant === 'ghost' ? colors.textOnNight : variant === 'soft' ? colors.inkSoft : colors.ink }]}>
        {label}
      </Text>
      {ad ? (
        <View style={styles.pillBadge}>
          <AdBadge size={26} onMint={variant === 'primary'} />
        </View>
      ) : null}
    </Pressable>
  );
}

interface IconButtonProps {
  children: ReactNode;
  accessibilityLabel: string;
  ad?: boolean;
  disabled?: boolean;
  /** "paper" for the big helpers, "night" for small buttons on dark backgrounds. */
  tone?: 'paper' | 'night';
  size?: number;
  onPress: () => void;
}

/** A round icon button. */
export function IconButton({
  children,
  accessibilityLabel,
  ad,
  disabled,
  tone = 'paper',
  size = 68,
  onPress,
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={Math.max(0, (MIN_TOUCH - size) / 2) + 6}
      style={({ pressed }) => [
        styles.round,
        { width: size, height: size, borderRadius: size / 2 },
        tone === 'paper' ? styles.paperTone : styles.nightTone,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}>
      {children}
      {ad ? (
        <View style={styles.roundBadge}>
          <AdBadge size={24} />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    minHeight: MIN_TOUCH + 6,
    borderRadius: 32,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  ghost: { borderWidth: 2, borderColor: 'rgba(244, 241, 232, 0.25)' },
  paperEdge: { borderBottomWidth: 3, borderColor: colors.paperShade },
  pillBadge: { position: 'absolute', right: 14 },
  round: { alignItems: 'center', justifyContent: 'center' },
  paperTone: { backgroundColor: colors.paper, borderBottomWidth: 3, borderColor: colors.paperShade },
  nightTone: { backgroundColor: 'rgba(34, 52, 94, 0.85)', borderWidth: 1, borderColor: 'rgba(244, 241, 232, 0.08)' },
  roundBadge: { position: 'absolute', right: -6, top: -6 },
  disabled: { opacity: 0.35 },
  pressed: { transform: [{ scale: 0.95 }] },
});
