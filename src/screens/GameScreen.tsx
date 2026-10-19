import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { showRewarded } from '@/ads/AdManager';
import { getLevel, MAX_LEVEL } from '@/game/levels';
import { fireflyAt, START_HEARTS, tilesCorrect } from '@/game/round';
import {
  anchorCell,
  crossedTiles,
  newSession,
  pathLinks,
  sessionReducer,
  tileLooks,
  type Mood,
} from '@/game/session';
import { Board } from '@/render/Board';
import { colors, MIN_TOUCH } from '@/render/theme';
import { useProgress } from '@/store/progress';
import { IntroCard } from './IntroCard';
import { ResultCard } from './ResultCard';

const MOOD_FACE: Record<Mood, string> = {
  thinking: '🤔',
  waiting: '🦉',
  happy: '😄',
  oops: '😬',
  won: '🥳',
  lost: '😢',
};

/** Pause before the firefly starts, and how long the full path stays lit at the end. */
const SHOW_LEAD_MS = 450;
const SHOW_HOLD_MS = 650;
/** Pause between the yellow firefly's last tile and the blue firefly's first. */
const FIREFLY_GAP_MS = 500;
const WRONG_FLASH_MS = 450;

const TOP_BAR = 64;
const HELPER_BAR = 112;
const FRAME_PAD = 10;
const FRAME_BORDER = 3;

export function GameScreen({ level }: { level: number }) {
  const config = useMemo(() => getLevel(level), [level]);
  const [s, dispatch] = useReducer(sessionReducer, config, (c) => newSession(c.path, c.starts));
  // The picture card for something new (Grid Up!, rocks, two fireflies) comes before the show.
  // Phase 5: the "unlocks" interstitial goes right after this card.
  const [intro, setIntro] = useState(config.intro);
  const closeIntro = useCallback(() => setIntro(null), []);
  const completeLevel = useProgress((p) => p.completeLevel);

  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const free = height - insets.top - insets.bottom - TOP_BAR - HELPER_BAR - 2 * FRAME_PAD - 24;
  const extent = Math.floor(Math.min(width - 32 - 2 * (FRAME_PAD + FRAME_BORDER), free, 520));

  // The firefly show: light one tile per step, hold, then the player's turn.
  // With two fireflies, the blue one starts after a short pause.
  useEffect(() => {
    if (s.phase !== 'showing' || intro !== null) return;
    const at = (i: number) => SHOW_LEAD_MS + i * config.stepMs + fireflyAt(config.starts, i) * FIREFLY_GAP_MS;
    const last = config.path.length - 1;
    const timers = config.path.map((_, i) => setTimeout(() => dispatch({ type: 'showStep', shown: i + 1 }), at(i)));
    timers.push(
      setTimeout(() => dispatch({ type: 'showDone', now: Date.now() }), at(last) + config.stepMs + SHOW_HOLD_MS)
    );
    return () => timers.forEach(clearTimeout);
  }, [s.phase, s.showRun, config, intro]);

  useEffect(() => {
    if (s.wrongCell === null) return;
    const t = setTimeout(() => dispatch({ type: 'clearWrong' }), WRONG_FLASH_MS);
    return () => clearTimeout(t);
  }, [s.wrongCell, s.wrongKey]);

  useEffect(() => {
    if (s.phase === 'won' && s.stars !== null) completeLevel(level, s.stars);
  }, [s.phase, s.stars, level, completeLevel]);

  const showing = s.phase === 'showing';
  const playing = s.phase === 'input';
  const progress = s.round.progress;

  const goHome = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const goNext = () =>
    router.replace({ pathname: '/game/[level]', params: { level: String(Math.min(MAX_LEVEL, level + 1)) } });

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topBar}>
        <RoundButton label="‹" accessibilityLabel="Back" onPress={goHome} small />
        <Text style={styles.hearts} accessibilityLabel={`${s.round.hearts} hearts`}>
          {Array.from({ length: START_HEARTS }, (_, i) => (i < s.round.hearts ? '❤️' : '🤍')).join(' ')}
        </Text>
        <Text style={styles.level}>{level}</Text>
        <Text style={styles.face}>{MOOD_FACE[s.mood]}</Text>
      </View>

      <View style={styles.middle}>
        <View style={[styles.frame, config.boss && styles.bossFrame]}>
          <Board
            size={config.size}
            extent={extent}
            looks={tileLooks(s, config.size)}
            crossed={crossedTiles(s, config.size)}
            rocks={config.rocks}
            links={pathLinks(s)}
            wrongCell={s.wrongCell}
            wrongKey={s.wrongKey}
            fireflyCell={showing && s.shown > 0 ? config.path[s.shown - 1] : null}
            firefly={showing && s.shown > 0 ? fireflyAt(config.starts, s.shown - 1) : 0}
            fireflyMs={Math.min(320, config.stepMs * 0.5)}
            anchorCell={showing ? null : anchorCell(s)}
            // The hand points at the lantern: at the start, and when the blue path is next.
            handCell={playing && ((!s.touched && progress === 1) || s.round.travel) ? anchorCell(s) : null}
            inputEnabled={playing}
            onEnterCells={(cells) => dispatch({ type: 'enter', cells, now: Date.now() })}
            onLift={() => dispatch({ type: 'lift' })}
          />
        </View>
      </View>

      <View style={styles.helpers}>
        <RoundButton
          label="👁"
          badge="🎬"
          accessibilityLabel="Show the path again"
          disabled={!playing}
          onPress={() => showRewarded('show_again', () => dispatch({ type: 'replay' }))}
        />
        <RoundButton
          label="💡"
          badge="🎬"
          accessibilityLabel="Hint"
          disabled={!playing || s.hintCell !== null}
          onPress={() => showRewarded('hint', () => dispatch({ type: 'hint' }))}
        />
        <RoundButton
          label="↺"
          accessibilityLabel="Restart"
          disabled={showing}
          onPress={() => dispatch({ type: 'restart' })}
        />
      </View>

      {intro !== null ? <IntroCard intro={intro} onDone={closeIntro} /> : null}
      {s.phase === 'won' && s.stars !== null ? (
        <ResultCard kind="won" stars={s.stars} onNext={goNext} onRetry={() => dispatch({ type: 'restart' })} />
      ) : null}
      {s.phase === 'lost' ? (
        <ResultCard
          kind="lost"
          got={tilesCorrect(s.round)}
          total={config.path.length}
          onRetry={() => dispatch({ type: 'restart' })}
          onContinue={() => showRewarded('continue', () => dispatch({ type: 'continue' }))}
        />
      ) : null}
    </SafeAreaView>
  );
}

function RoundButton({
  label,
  badge,
  accessibilityLabel,
  disabled,
  small,
  onPress,
}: {
  label: string;
  badge?: string;
  accessibilityLabel: string;
  disabled?: boolean;
  small?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        small ? styles.smallButton : styles.helperButton,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}>
      <Text style={small ? styles.smallLabel : styles.helperLabel}>{label}</Text>
      {badge ? <Text style={styles.badge}>{badge}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.night },
  topBar: {
    height: TOP_BAR,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    gap: 8,
  },
  hearts: { fontSize: 22, flex: 1, textAlign: 'center' },
  level: { fontSize: 22, fontWeight: '800', color: colors.firefly, minWidth: 36, textAlign: 'center' },
  face: { fontSize: 32, width: 44, textAlign: 'center' },
  middle: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  frame: {
    padding: FRAME_PAD,
    borderRadius: 28,
    borderWidth: FRAME_BORDER,
    borderColor: colors.nightDeep,
    backgroundColor: colors.nightDeep,
  },
  bossFrame: { borderColor: colors.gold },
  helpers: {
    height: HELPER_BAR,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },
  helperButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helperLabel: { fontSize: 32, color: colors.ink, fontWeight: '800' },
  smallButton: {
    width: MIN_TOUCH - 12,
    height: MIN_TOUCH - 12,
    borderRadius: 22,
    backgroundColor: colors.tile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallLabel: { fontSize: 30, color: colors.textOnNight, fontWeight: '700', marginTop: -4 },
  badge: { position: 'absolute', right: -4, top: -4, fontSize: 18 },
  disabled: { opacity: 0.4 },
  pressed: { transform: [{ scale: 0.94 }] },
});
