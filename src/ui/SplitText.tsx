import { Text, View, type StyleProp, type TextStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { quality } from '@/perf/quality';

interface SplitTextProps {
  text: string;
  style?: StyleProp<TextStyle>;
  /** Wait this long before the first letter. */
  delay?: number;
  /** Time between letters. */
  stagger?: number;
  align?: 'center' | 'left';
}

/**
 * Text that rises in letter by letter, like a storybook page turning.
 * Words never break across lines. On the low quality tier it rises word by
 * word instead, which is far fewer animated views.
 * Give it a new `key` to play it again.
 */
export function SplitText({ text, style, delay = 0, stagger = 28, align = 'center' }: SplitTextProps) {
  const words = text.split(' ');
  const byLetter = quality.loops;
  // Index of each word's first letter in the whole text, for its delay.
  const firstLetter = words.reduce<number[]>((acc, _, i) => [...acc, i === 0 ? 0 : acc[i - 1] + words[i - 1].length], []);
  const rise = (letter: number) => FadeInDown.delay(delay + letter * stagger).duration(420);

  return (
    <View
      accessible
      accessibilityLabel={text}
      style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: align === 'center' ? 'center' : 'flex-start' }}>
      {words.map((word, wi) => {
        const space = wi < words.length - 1 ? ' ' : '';
        if (!byLetter) {
          return (
            <Animated.Text key={wi} entering={rise(firstLetter[wi])} style={style}>
              {word + space}
            </Animated.Text>
          );
        }
        return (
          <View key={wi} style={{ flexDirection: 'row' }}>
            {[...word].map((ch, ci) => (
              <Animated.Text key={ci} entering={rise(firstLetter[wi] + ci)} style={style}>
                {ch}
              </Animated.Text>
            ))}
            {space ? <Text style={style}> </Text> : null}
          </View>
        );
      })}
    </View>
  );
}
