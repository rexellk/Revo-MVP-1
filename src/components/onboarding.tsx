import * as ImagePicker from 'expo-image-picker';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, space } from '../theme';
import { Row } from './ui';

export function StepHeader({ step, total, title, body }: { step: number; total: number; title: string; body: string }) {
  return (
    <View style={{ gap: 10 }}>
      <Row gap={6}>
        {Array.from({ length: total }, (_, i) => (
          <View key={i} style={[styles.seg, { backgroundColor: i < step ? colors.brick : colors.line }]} />
        ))}
      </Row>
      <Text style={styles.step}>
        STEP {step} OF {total}
      </Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

export async function pickMedia(kind: 'images' | 'videos' = 'images'): Promise<string | null> {
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: [kind], quality: 0.7, allowsEditing: kind === 'images' });
  if (res.canceled || !res.assets?.length) return null;
  return res.assets[0].uri;
}

const styles = StyleSheet.create({
  seg: { flex: 1, height: 5, borderRadius: 3 },
  step: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 1.4, color: colors.brick, marginTop: space.sm },
  title: { fontFamily: fonts.display, fontSize: 21, lineHeight: 29, color: colors.ink },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: colors.muted },
});
