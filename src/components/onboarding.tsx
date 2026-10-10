import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { ActionSheetIOS, Platform, StyleSheet, Text, View } from 'react-native';
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

export type PhotoSource = 'camera' | 'library' | 'files';

export const isPdf = (uri: string) => /\.pdf($|\?)/i.test(uri);

/** Picks a file from the Files app. Images only, or images and PDFs (scanned certificates, IDs). */
export async function pickFile(allowPdf: boolean): Promise<string | null> {
  const res = await DocumentPicker.getDocumentAsync({ type: allowPdf ? ['image/*', 'application/pdf'] : 'image/*', copyToCacheDirectory: true });
  if (res.canceled || !res.assets?.length) return null;
  return res.assets[0].uri;
}

/**
 * Native iOS "Take Photo / Photo Library / Choose File" sheet. Returns false on other
 * platforms so the caller can show the brand ActionSheet instead.
 */
export function showPhotoSourceSheetIOS(onChoose: (from: PhotoSource) => void): boolean {
  if (Platform.OS !== 'ios') return false;
  const sources: PhotoSource[] = ['camera', 'library', 'files'];
  ActionSheetIOS.showActionSheetWithOptions(
    { options: ['Take Photo', 'Photo Library', 'Choose File', 'Cancel'], cancelButtonIndex: 3 },
    (i) => {
      if (i < sources.length) onChoose(sources[i]);
    },
  );
  return true;
}

export async function pickMedia(kind: 'images' | 'videos' = 'images', from: 'library' | 'camera' = 'library'): Promise<string | null> {
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: [kind], quality: 0.7, allowsEditing: kind === 'images' };
  if (from === 'camera') {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) throw new Error('Camera access is off. Turn it on in Settings, or choose from your library.');
  }
  const res = from === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  if (res.canceled || !res.assets?.length) return null;
  return res.assets[0].uri;
}

const styles = StyleSheet.create({
  seg: { flex: 1, height: 5, borderRadius: 3 },
  step: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 1.4, color: colors.brick, marginTop: space.sm },
  title: { fontFamily: fonts.display, fontSize: 21, lineHeight: 29, color: colors.ink },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: colors.muted },
});
