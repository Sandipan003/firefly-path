import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { maybeShowUnlockInterstitial, noteLevelComplete, showRewarded, unlockReasonForNext } from '@/ads/AdManager';
import { useAds } from '@/ads/adsState';
import { logEvent } from '@/analytics';
import { BackIcon, BulbIcon, EyeIcon, HeartIcon, RestartIcon } from '@/art/icons';
import { Pip } from '@/art/Pip';
import { Scene } from '@/art/Scene';
import { cardFor } from '@/game/cards';
import { chapterFor } from '@/game/chapters';
import { getLevel, MAX_LEVEL } from '@/game/levels';
import { fireflyAt, START_HEARTS, tilesCorrect } from '@/game/round';
import { anchorCell, crossedTiles, newSession, pathLinks, sessionReducer, tileLooks } from '@/game/session';
import { strings } from '@/i18n/strings';
import { Board } from '@/render/Board';
import { colors, fonts, type } from '@/render/theme';
import { useProgress } from '@/store/progress';
import { IconButton } from '@/ui/Buttons';
import { IntroCard } from './IntroCard';
import { ResultCard } from './ResultCard';

/** Pause before the firefly starts. (How long the full path stays lit comes from the level.) */
const SHOW_LEAD_MS = 450;
/** Pause between the yellow firefly's last tile and the blue firefly's first. */
const FIREFLY_GAP_MS = 500;
const WRONG_FLASH_MS = 450;

const TOP_BAR = 64;
const HEART_ROW = 36;
const HELPER_BAR = 116;
const FRAME_PAD = 10;
const FRAME_BORDER = 2;

export function GameScreen({ level }: { level: number }) {
  const config = useMemo(() => getLevel(level), [level]);
  const chapter = chapterFor(level);
  const [s, dispatch] = useReducer(sessionReducer, config, (c) => newSession(c.path, c.starts));
  // A chapter's title card, or a picture card for something new, comes before the show.
  const [card, setCard] = useState(() => cardFor(level, config.intro));
  const closing = useRef(false);
  const closeCard = useCallback(() => {
    // The card closes on a tap or by itself; only act on the first.
    if (closing.current) return;
    closing.current = true;
    // A bigger grid is an unlock moment: the "unlocks" interstitial may show
    // right after its card, before the new board's show starts.
    const gridUp = card?.kind === 'chapter' && card.gridUp !== null;
    if (gridUp) maybeShowUnlockInterstitial('grid_up', level).then(() => setCard(null));
    else setCard(null);
  }, [card, level]);
  const completeLevel = useProgress((p) => p.completeLevel);
  const rewardedReady = useAds((a) => a.rewardedReady);
  const [leaving, setLeaving] = useState(false);

  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const free = height - insets.top - insets.bottom - TOP_BAR - HEART_ROW - HELPER_BAR - 2 * FRAME_PAD - 24;
  const extent = Math.floor(Math.min(width - 32 - 2 * (FRAME_PAD + FRAME_BORDER), free, 520));

  // The firefly show: light one tile per step, hold, then the player's turn.
  // With two fireflies, the blue one starts after a short pause.
  useEffect(() => {
    if (s.phase !== 'showing' || card !== null) return;
    const at = (i: number) => SHOW_LEAD_MS + i * config.stepMs + fireflyAt(config.starts, i) * FIREFLY_GAP_MS;
    const last = config.path.length - 1;
    const timers = config.path.map((_, i) => setTimeout(() => dispatch({ type: 'showStep', shown: i + 1 }), at(i)));
    timers.push(
      setTimeout(() => dispatch({ type: 'showDone', now: Date.now() }), at(last) + config.stepMs + config.holdMs)
    );
    return () => timers.forEach(clearTimeout);
  }, [s.phase, s.showRun, config, card]);

  useEffect(() => {
    if (s.wrongCell === null) return;
    const t = setTimeout(() => dispatch({ type: 'clearWrong' }), WRONG_FLASH_MS);
    return () => clearTimeout(t);
  }, [s.wrongCell, s.wrongKey]);

  useEffect(() => {
    logEvent('level_start', { level });
  }, [level]);

  useEffect(() => {
    if (s.phase === 'won' && s.stars !== null) {
      completeLevel(level, s.stars);
      noteLevelComplete();
      logEvent('level_complete', { level, stars: s.stars, hearts_left: s.round.hearts });
      // Build the next level while the win card plays, so "Next" opens it at once.
      setTimeout(() => getLevel(level + 1), 300);
    }
    if (s.phase === 'lost') logEvent('level_fail', { level, tiles_correct: tilesCorrect(s.round) });
    // Only when the phase changes, not on every round update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.phase]);

  const showing = s.phase === 'showing';
  const playing = s.phase === 'input';
  const progress = s.round.progress;

  const goHome = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const goNext = async () => {
    if (leaving) return;
    setLeaving(true);
    // Beating a Boss (or 4 levels with no unlock) is an unlock moment: the
    // interstitial may show here, after the win card, before the next level.
    const reason = unlockReasonForNext(config.boss);
    if (reason) await maybeShowUnlockInterstitial(reason, level);
    router.replace({ pathname: '/game/[level]', params: { level: String(Math.min(MAX_LEVEL, level + 1)) } });
  };

  const replay = () => {
    showRewarded('show_again', () => {
      logEvent('show_again_used', { level });
      dispatch({ type: 'replay' });
    });
  };
  const hint = () => {
    showRewarded('hint', () => {
      logEvent('hint_used', { level, via: 'ad' });
      dispatch({ type: 'hint' });
    });
  };

  return (
    <View style={styles.screen}>
      <Scene chapter={chapter.id} dim={0.5} />
      <SafeAreaView style={styles.safe}>
        <View style={styles.topBar}>
          <IconButton tone="night" size={44} accessibilityLabel="Back" onPress={goHome}>
            <BackIcon size={22} />
          </IconButton>
          <View style={styles.title} accessibilityLabel={strings.level(level)}>
            <Text style={[type.label, { color: config.boss ? colors.gold : colors.textDim }]}>
              {config.boss ? `${strings.boss} · ${strings.levelLabel}` : strings.levelLabel}
            </Text>
            <Text style={styles.levelNumber}>{level}</Text>
          </View>
          <View style={styles.pip}>
            <Pip size={46} mood={s.mood} />
          </View>
        </View>

        <View style={styles.hearts} accessibilityLabel={`${s.round.hearts} hearts`}>
          {Array.from({ length: START_HEARTS }, (_, i) => (
            <Heart key={i} full={i < s.round.hearts} />
          ))}
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
              // The lantern tile breathes until the player starts, and again when the blue path is next.
              waitingCell={playing && ((!s.touched && progress === 1) || s.round.travel) ? anchorCell(s) : null}
              inputEnabled={playing}
              onEnterCells={(cells) => dispatch({ type: 'enter', cells, now: Date.now() })}
              onLift={() => dispatch({ type: 'lift' })}
            />
          </View>
        </View>

        <View style={styles.helpers}>
          <View style={styles.helperRow}>
            <IconButton
              ad
              accessibilityLabel="Show the path again"
              disabled={!playing || !rewardedReady}
              onPress={replay}>
              <EyeIcon size={30} />
            </IconButton>
            <IconButton
              ad
              accessibilityLabel="Hint"
              disabled={!playing || !rewardedReady || s.hintCell !== null}
              onPress={hint}>
              <BulbIcon size={30} />
            </IconButton>
            <IconButton accessibilityLabel="Restart" disabled={showing} onPress={() => dispatch({ type: 'restart' })}>
              <RestartIcon size={30} />
            </IconButton>
          </View>
          {/* Video buttons stay greyed out, never blocking the game, until a video has loaded. */}
          <Text style={[type.label, styles.noVideo, { opacity: playing && !rewardedReady ? 1 : 0 }]}>
            {strings.noVideo.toUpperCase()}
          </Text>
        </View>
      </SafeAreaView>

      {card !== null ? <IntroCard card={card} onDone={closeCard} /> : null}
      {s.phase === 'won' && s.stars !== null ? (
        <ResultCard
          kind="won"
          stars={s.stars}
          onNext={goNext}
          busy={leaving}
          onRetry={() => dispatch({ type: 'restart' })}
        />
      ) : null}
      {s.phase === 'lost' ? (
        <ResultCard
          kind="lost"
          got={tilesCorrect(s.round)}
          total={config.path.length}
          onRetry={() => dispatch({ type: 'restart' })}
          canContinue={rewardedReady}
          onContinue={() => showRewarded('continue', () => dispatch({ type: 'continue' }))}
        />
      ) : null}
    </View>
  );
}

/** One heart; it gives a little jolt when it's lost or won back. */
function Heart({ full }: { full: boolean }) {
  const scale = useSharedValue(1);
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    scale.set(withSequence(withTiming(1.35, { duration: 110 }), withTiming(1, { duration: 180 })));
  }, [full, scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  return (
    <Animated.View style={style}>
      <HeartIcon size={26} full={full} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.night },
  safe: { flex: 1 },
  topBar: {
    height: TOP_BAR,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  title: { alignItems: 'center' },
  levelNumber: { fontFamily: fonts.display, fontSize: 34, lineHeight: 38, color: colors.textOnNight, letterSpacing: -1 },
  pip: { width: 52, alignItems: 'center' },
  hearts: { height: HEART_ROW, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  middle: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  frame: {
    padding: FRAME_PAD,
    borderRadius: 30,
    borderWidth: FRAME_BORDER,
    borderColor: 'rgba(244, 241, 232, 0.08)',
    backgroundColor: 'rgba(10, 18, 36, 0.84)',
  },
  bossFrame: { borderColor: colors.gold },
  helpers: { height: HELPER_BAR, alignItems: 'center', justifyContent: 'center', gap: 8 },
  helperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 28 },
  noVideo: { color: colors.textDim },
});
