import { Redirect } from 'expo-router';

import { HomeScreen } from '@/screens/HomeScreen';
import { useProgress } from '@/store/progress';

export default function Home() {
  const seenStory = useProgress((s) => s.seenStory);
  // First launch: the story comes before anything else.
  if (!seenStory) return <Redirect href="/story" />;
  return <HomeScreen />;
}
