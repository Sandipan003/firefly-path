// iOS and web load the fonts when the app starts. Android has them built in
// (see fontSources.android.ts). Import single weights by path: the package
// root would bundle all 18 weights.
import { Baloo2_600SemiBold } from '@expo-google-fonts/baloo-2/600SemiBold';
import { Baloo2_800ExtraBold } from '@expo-google-fonts/baloo-2/800ExtraBold';
import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces/600SemiBold';
import { Fraunces_600SemiBold_Italic } from '@expo-google-fonts/fraunces/600SemiBold_Italic';

export const fontSources = {
  Fraunces_600SemiBold,
  Fraunces_600SemiBold_Italic,
  Baloo2_600SemiBold,
  Baloo2_800ExtraBold,
};
