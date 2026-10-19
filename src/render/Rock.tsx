import { View } from 'react-native';

import { colors } from './theme';

/**
 * A rock made of two plain views. Not the 🪨 emoji: it only exists on
 * Android 11 and newer, and many budget phones run older versions.
 */
export function Rock({ width, color = colors.rock }: { width: number; color?: string }) {
  const height = width * 0.72;
  return (
    <View
      style={{
        width,
        height,
        backgroundColor: color,
        borderTopLeftRadius: width * 0.46,
        borderTopRightRadius: width * 0.38,
        borderBottomLeftRadius: width * 0.26,
        borderBottomRightRadius: width * 0.32,
      }}>
      <View
        style={{
          position: 'absolute',
          left: width * 0.2,
          top: height * 0.16,
          width: width * 0.3,
          height: height * 0.22,
          borderRadius: width * 0.15,
          backgroundColor: 'rgba(255, 255, 255, 0.35)',
        }}
      />
    </View>
  );
}
