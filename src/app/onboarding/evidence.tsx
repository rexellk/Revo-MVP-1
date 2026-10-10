import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StickyFooter, TopBar } from '../../components/layout';
import { isPdf, pickFile, pickMedia, showPhotoSourceSheetIOS, StepHeader, type PhotoSource } from '../../components/onboarding';
import { ActionSheet } from '../../components/sheet';
import { Banner, Button, Card, Icon, Label, Row, type IconName } from '../../components/ui';
import { submitVerification } from '../../lib/verification';
import { ME_ID, useStore } from '../../store';
import { colors, fonts, radius, space } from '../../theme';

// ASE certifications that cover the services REVO offers. At least one is required to be listed.
const ASE_CERTS = [
  'ASE Certified: Maintenance & Light Repair (G1)',
  'ASE Certified: Brakes (A5)',
  'ASE Certified: Electrical Systems (A6)',
  'ASE Certified: Engine Performance (A8)',
  'ASE Master Technician',
];

export default function Evidence() {
  const submit = useStore((s) => s.submitEvidence);
  const me = useStore((s) => s.revivors.find((r) => r.id === ME_ID));
  const [sending, setSending] = useState(false);
  const [idFront, setIdFront] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [certs, setCerts] = useState<{ name: string; fileName: string; uri: string }[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [video, setVideo] = useState<string | null>(null);
  const [certSheet, setCertSheet] = useState(false);
  // Where the next photo goes. Non-null opens the brand source sheet (Android and web; iOS uses the native one).
  const [photoFor, setPhotoFor] = useState<{ onPicked: (uri: string) => void; allowPdf: boolean } | null>(null);

  const ok = !!idFront && !!selfie && certs.length >= 1 && photos.length >= 1;

  const pickInto = async (from: PhotoSource, onPicked: (uri: string) => void, allowPdf: boolean) => {
    try {
      const uri = from === 'files' ? await pickFile(allowPdf) : await pickMedia('images', from);
      if (uri) onPicked(uri);
    } catch (e) {
      Alert.alert('Could not add the photo', e instanceof Error ? e.message : 'Try another option.');
    }
  };

  // allowPdf: scanned IDs and certificates often come as PDFs from the Files app.
  const askPhoto = (onPicked: (uri: string) => void, allowPdf = false) => {
    if (!showPhotoSourceSheetIOS((from) => pickInto(from, onPicked, allowPdf))) setPhotoFor({ onPicked, allowPdf });
  };

  const addCert = (name: string) =>
    askPhoto((uri) => setCerts((cs) => [...cs, { name, uri, fileName: `${name.replace(/[^A-Za-z0-9]+/g, '_')}.${isPdf(uri) ? 'pdf' : 'jpg'}` }]), true);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopBar title="Become a Revivor" back hideSwitch />
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.xl, paddingBottom: 40 }}>
        <StepHeader
          step={2}
          total={3}
          title="PROVE IT"
          body="Every Revivor needs a verified ID and an ASE certification. The REVO team checks both by hand, so drivers know your badge is real."
        />

        <Section title="Identity" requirement="Required" icon="card-account-details-outline">
          <UploadRow label="Photo of your driver's license or state ID" done={!!idFront} uri={idFront} onPress={() => askPhoto(setIdFront, true)} />
          <UploadRow label="A selfie, so we can match your face to the ID" done={!!selfie} uri={selfie} onPress={() => askPhoto(setSelfie)} />
        </Section>

        <Section title="ASE certification" requirement="Required · at least one" icon="certificate-outline">
          {certs.map((c, i) => (
            <Row key={i} gap={12} style={styles.fileRow}>
              <Thumb uri={c.uri} />
              <View style={{ flex: 1 }}>
                <Text style={styles.fileName}>{c.name}</Text>
                <Text style={styles.hint}>Uploaded · REVO will review</Text>
              </View>
              <Pressable onPress={() => setCerts(certs.filter((_, j) => j !== i))} hitSlop={8} accessibilityLabel="Remove">
                <Icon name="close" size={18} color={colors.muted} />
              </Pressable>
            </Row>
          ))}
          <Button title="Add ASE certificate" variant="outline" icon="plus" small onPress={() => setCertSheet(true)} />
          <Text style={styles.hint}>A photo or scan of the certificate. The name on it must match your ID.</Text>
        </Section>

        <Section title="Photos of your work" requirement="Required · at least 1" icon="image-multiple-outline">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {photos.map((u, i) => (
              <Pressable key={i} onPress={() => setPhotos(photos.filter((_, j) => j !== i))}>
                <Image source={{ uri: u }} style={styles.photo} />
                <View style={styles.remove}>
                  <Icon name="close" size={12} color={colors.cream} />
                </View>
              </Pressable>
            ))}
            {photos.length < 6 ? (
              <Pressable
                onPress={() => askPhoto((u) => setPhotos((ps) => [...ps, u]))}
                style={[styles.photo, styles.addPhoto]}
                testID="add-photo"
                accessibilityLabel="Add work photo"
              >
                <Icon name="plus" size={26} color={colors.ink} />
              </Pressable>
            ) : null}
          </View>
          <Text style={styles.hint}>Before and after shots of real jobs work best. No customer plates or faces.</Text>
        </Section>

        <Section title="30-second intro video" requirement="Optional · helps new Revivors" icon="video-outline">
          <UploadRow
            label={video ? 'Intro video added' : 'Say hi, where you have worked, and what you are best at'}
            done={!!video}
            onPress={async () => setVideo((await pickMedia('videos')) ?? video)}
          />
        </Section>

        <Banner icon="lock-outline" tone="cream" text="Your ID and selfie are only seen by the REVO team. Drivers see your badge and can open the ASE certificates you upload here." />
      </ScrollView>
      <StickyFooter>
        <Button
          title={sending ? 'Uploading...' : 'Submit for review'}
          disabled={!ok}
          loading={sending}
          onPress={async () => {
            if (!idFront || !selfie || !me) return;
            setSending(true);
            try {
              await submitVerification({
                idPhotoUri: idFront,
                selfieUri: selfie,
                aseCertificates: certs.map(({ name, uri }) => ({ name, uri })),
                workPhotoUris: photos,
                introVideoUri: video,
              });
              submit({ idUploaded: true, aseCertificates: certs.map(({ name, fileName }) => ({ name, fileName })), workPhotos: photos, introVideo: !!video });
              router.replace('/onboarding/submitted');
            } catch (e) {
              Alert.alert('Could not submit', e instanceof Error ? e.message : 'Check your connection and try again.');
            } finally {
              setSending(false);
            }
          }}
        />
      </StickyFooter>

      <ActionSheet
        visible={certSheet}
        title="Add ASE certificate"
        message="Which ASE certification is it?"
        onClose={() => setCertSheet(false)}
        options={ASE_CERTS.map((label) => ({ label, onPress: () => addCert(label) }))}
      />

      <ActionSheet
        visible={photoFor !== null}
        title="Add photo"
        onClose={() => setPhotoFor(null)}
        options={[
          { label: 'Take photo', icon: 'camera-outline', onPress: () => photoFor && pickInto('camera', photoFor.onPicked, photoFor.allowPdf) },
          { label: 'Photo library', icon: 'image-outline', onPress: () => photoFor && pickInto('library', photoFor.onPicked, photoFor.allowPdf) },
          { label: 'Choose file', icon: 'file-document-outline', onPress: () => photoFor && pickInto('files', photoFor.onPicked, photoFor.allowPdf) },
        ]}
      />
    </View>
  );
}

function Section({ title, requirement, icon, children }: { title: string; requirement: string; icon: IconName; children: React.ReactNode }) {
  return (
    <Card style={{ gap: 12 }}>
      <Row gap={10}>
        <Icon name={icon} size={22} color={colors.brick} />
        <View style={{ flex: 1 }}>
          <Text style={styles.secTitle}>{title}</Text>
          <Label style={{ fontSize: 10 }}>{requirement}</Label>
        </View>
      </Row>
      {children}
    </Card>
  );
}

/** Image preview, or a PDF icon for scanned documents. */
function Thumb({ uri }: { uri: string }) {
  if (!isPdf(uri)) return <Image source={{ uri }} style={styles.thumb} />;
  return (
    <View style={[styles.thumb, { backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' }]}>
      <Icon name="file-pdf-box" size={26} color={colors.brick} />
    </View>
  );
}

function UploadRow({ label, done, uri, onPress }: { label: string; done: boolean; uri?: string | null; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.fileRow, pressed && { opacity: 0.8 }]}>
      {uri ? (
        <Thumb uri={uri} />
      ) : (
        <View style={[styles.thumb, { backgroundColor: done ? colors.ink : colors.creamDeep, alignItems: 'center', justifyContent: 'center' }]}>
          <Icon name={done ? 'check-bold' : 'upload'} size={20} color={done ? colors.cream : colors.ink} />
        </View>
      )}
      <Text style={[styles.fileName, { flex: 1 }]}>{label}</Text>
      <Icon name={done ? 'check-circle' : 'chevron-right'} size={20} color={done ? colors.ink : colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  secTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.creamDeep, borderRadius: radius.md, padding: 10 },
  thumb: { width: 44, height: 44, borderRadius: radius.sm },
  fileName: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
  hint: { fontFamily: fonts.medium, fontSize: 12, color: colors.muted, lineHeight: 17 },
  photo: { width: 74, height: 74, borderRadius: radius.md },
  addPhoto: { borderWidth: 2, borderStyle: 'dashed', borderColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  remove: { position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center' },
});
