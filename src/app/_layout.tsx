import {
  Archivo_400Regular,
  Archivo_500Medium,
  Archivo_600SemiBold,
  Archivo_700Bold,
  Archivo_800ExtraBold,
} from '@expo-google-fonts/archivo';
import { KronaOne_400Regular } from '@expo-google-fonts/krona-one';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '../theme';

export default function RootLayout() {
  const [loaded] = useFonts({
    KronaOne_400Regular,
    Archivo_400Regular,
    Archivo_500Medium,
    Archivo_600SemiBold,
    Archivo_700Bold,
    Archivo_800ExtraBold,
  });

  if (!loaded) return <View style={{ flex: 1, backgroundColor: colors.navyDeep }} />;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="index" options={{ contentStyle: { backgroundColor: colors.navyDeep } }} />
        <Stack.Screen name="credential" options={{ presentation: 'modal' }} />
        <Stack.Screen name="review/[jobId]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="listing/new" options={{ presentation: 'modal' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
