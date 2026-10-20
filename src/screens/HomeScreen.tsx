import { router } from 'expo-router';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GameBanner } from '@/ads/GameBanner';
import { Fireflies } from '@/art/Fireflies';
import { Branch, GearIcon, PlayIcon, StarIcon } from '@/art/icons';
import { Pip } from '@/art/Pip';
import { Scene } from '@/art/Scene';
import { chapterFor } from '@/game/chapters';
import { strings } from '@/i18n/strings';
import { colors, fonts, type } from '@/render/theme';
import { totalStars, useProgress } from '@/store/progress';
import { IconButton, PillButton } from '@/ui/Buttons';

/**
 * The cover of the storybook: the current chapter's landscape, the level
 * number set huge, Pip waiting with the lantern, and one big Play button.
 * Phase 4 adds the Daily Path card, coins and the brain meter.
 */
const pipBranchInset = 6;

export function HomeScreen() {
  const level = useProgress((s) => s.level);
  const stars = useProgress((s) => totalStars(s.stars));
  const chapter = chapterFor(level);
  const { width, height } = useWindowDimensions();
  const compact = height < 700;
  // Two digits fill the space beside Pip; three digits (level 100+) are set smaller to fit.
  const digits = String(level).length;
  const heroSize = Math.min(compact ? 120 : 156, width * 0.42) * (digits >= 3 ? 0.72 : 1);
  const pipSize = Math.min(compact ? 128 : 168, width * 0.42);

  return (
    <View style={styles.screen}>
      <Scene chapter={chapter.id} />
      <Fireflies count={12} seed={chapter.id} top={0.06} bottom={0.5} />

      <SafeAreaView style={styles.safe}>
        <View style={styles.topRow}>
          <Text style={styles.wordmark}>{strings.title}</Text>
          <View style={styles.topRight}>
            <View style={styles.starCount} accessibilityLabel={`${stars} stars`}>
              <StarIcon size={18} />
              <Text style={[type.button, styles.starText]}>{stars}</Text>
            </View>
            <IconButton tone="night" size={44} accessibilityLabel={strings.settings} onPress={() => router.push('/settings')}>
              <GearIcon size={22} />
            </IconButton>
          </View>
        </View>

        <View style={styles.middle}>
          <Animated.Text entering={FadeInDown.delay(100).duration(500)} style={[type.label, styles.chapterLabel]}>
            {strings.chapterLabel(chapter.numeral)}
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(180).duration(500)} style={[type.chapter, styles.chapterTitle]}>
            {chapter.title}
          </Animated.Text>

          <View style={styles.heroRow}>
            <Animated.View entering={FadeInDown.delay(260).duration(600)} style={styles.heroBlock}>
              <Text style={[type.label, styles.levelLabel]}>{strings.levelLabel}</Text>
              <Text
                style={[type.hero, styles.hero, { fontSize: heroSize, lineHeight: heroSize * 1.02 }]}
                accessibilityLabel={strings.level(level)}
                adjustsFontSizeToFit
                numberOfLines={1}>
                {level}
              </Text>
            </Animated.View>
            <Animated.View entering={FadeIn.delay(420).duration(700)} style={styles.pip}>
              <Pip size={pipSize} mood="idle" lantern blink />
              <View style={[styles.branch, { width: pipSize * 1.5 }]}>
                <Branch width={pipSize * 1.5} />
              </View>
            </Animated.View>
          </View>
        </View>

        <Animated.View entering={FadeInDown.delay(380).duration(500)} style={styles.bottom}>
          <PillButton
            label={strings.play}
            accessibilityLabel={`${strings.play} ${strings.level(level)}`}
            icon={<PlayIcon size={24} />}
            onPress={() => router.push({ pathname: '/game/[level]', params: { level: String(level) } })}
          />
        </Animated.View>
        <View style={styles.banner}>
          <GameBanner place="home" />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.night },
  safe: { flex: 1 },
  topRow: {
    height: 60,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wordmark: { fontFamily: fonts.displayItalic, fontSize: 24, color: colors.firefly },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  starCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(12, 21, 41, 0.55)',
  },
  starText: { color: colors.textOnNight, fontSize: 17, lineHeight: 22 },
  middle: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  chapterLabel: { color: colors.firefly },
  chapterTitle: { color: colors.textOnNight, marginTop: 6 },
  heroRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 28 },
  // Takes the room left of Pip, so a long number shrinks instead of running under him.
  heroBlock: { flex: 1, marginRight: 8 },
  levelLabel: { color: colors.textDim, marginLeft: 6 },
  hero: { color: colors.textOnNight },
  pip: { marginBottom: 16 },
  // Pip's feet rest on the branch; it runs off the right edge of the screen.
  branch: { position: 'absolute', bottom: -16, left: -pipBranchInset, zIndex: -1 },
  bottom: { paddingHorizontal: 24 },
  // 16 pt between the Play button and the banner.
  banner: { paddingTop: 16, paddingBottom: 8, alignItems: 'center' },
});
