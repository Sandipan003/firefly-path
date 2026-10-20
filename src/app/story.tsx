import { router } from 'expo-router';

import { StoryScreen } from '@/screens/StoryScreen';
import { useProgress } from '@/store/progress';

export default function Story() {
  const markStorySeen = useProgress((s) => s.markStorySeen);

  const finish = (begin: boolean) => {
    markStorySeen();
    // Watched again from the home screen: just go back there.
    if (router.canGoBack()) router.back();
    // First launch: "Begin" goes straight into level 1, "Skip" to the home screen.
    else if (begin) router.replace({ pathname: '/game/[level]', params: { level: '1' } });
    else router.replace('/');
  };

  return <StoryScreen onFinish={finish} />;
}
