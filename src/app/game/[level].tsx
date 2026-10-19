import { useLocalSearchParams } from 'expo-router';

import { GameScreen } from '@/screens/GameScreen';

export default function GameRoute() {
  const { level } = useLocalSearchParams<{ level: string }>();
  const n = Math.max(1, Math.floor(Number(level)) || 1);
  // A new key per level gives each level a fresh board and fresh timers.
  return <GameScreen key={n} level={n} />;
}
