import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StickyFooter, TopBar } from '../../components/layout';
import { pickMedia, StepHeader } from '../../components/onboarding';
import { ActionSheet } from '../../components/sheet';
import { Banner, Button, Card, Icon, Label, Row, type IconName } from '../../components/ui';
import { useStore } from '../../store';
import { colors, fonts, radius, space } from '../../theme';

const CERT_TYPES = ['ASE certification', 'WCC Automotive Program', 'Manufacturer training', 'Other trade certificate'];

export default function Evidence() {
  const submit = useStore((s) => s.submitEvidence);
  const [idFront, setIdFront] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [certs, setCerts] = useState<{ name: string; fileName: string; uri: string }[]>([]);
  const [bgConsent, setBgConsent] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [video, setVideo] = useState<string | null>(null);
  const [certSheet, setCertSheet] = useState(false);

  const ok = !!idFront && !!selfie && photos.length >= 3;

  const addCert = async (name: string) => {
    const uri = await pickMedia();
    if (uri) setCerts([...certs, { name, uri, fileName: `${name.replace(/\s+/g, '_')}.jpg` }]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopBar title="Become a Revivor" back hideSwitch />
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.xl, paddingBottom: 40 }}>
        <StepHeader
          step={2}
          total={3}
          title="PROVE IT"
          body="The REVO team checks everything here by hand. Your badges come only from these checks, so drivers know they're real."
        />

        <Section title="Identity" level="Required · Level 1" icon="card-account-details-outline">
          <UploadRow label="Photo of your driver's license or state ID" done={!!idFront} uri={idFront} onPress={async () => setIdFront((await pickMedia()) ?? idFront)} />
          <UploadRow label="A selfie, so we can match your face to the ID" done={!!selfie} uri={selfie} onPress={async () => setSelfie((await pickMedia()) ?? selfie)} />
        </Section>

        <Section title="Certifications" level="Needed for Level 2" icon="certificate-outline">
          {certs.map((c, i) => (
            <Row key={i} gap={12} style={styles.fileRow}>
              <Image source={{ uri: c.uri }} style={styles.thumb} />
              <View style={{ flex: 1 }}>
                <Text style={styles.fileName}>{c.name}</Text>
                <Text style={styles.hint}>Uploaded · REVO will review</Text>
              </View>
              <Pressable onPress={() => setCerts(certs.filter((_, j) => j !== i))} hitSlop={8} accessibilityLabel="Remove">
                <Icon name="close" size={18} color={colors.muted} />
              </Pressable>
            </Row>
          ))}
          <Button title="Add certificate" variant="outline" icon="plus" small onPress={() => setCertSheet(true)} />
        </Section>

        <Section title="Background check" level="Needed for Level 3" icon="shield-check-outline">
          <Pressable onPress={() => setBgConsent(!bgConsent)} style={styles.consent}>
            <View style={[styles.box, bgConsent && styles.boxOn]}>{bgConsent ? <Icon name="check-bold" size={14} color={colors.cream} /> : null}</View>
            <Text style={[styles.hint, { flex: 1, color: colors.ink, fontSize: 13.5 }]}>
              I agree to a background check run by REVO’s screening partner. I’ll get a separate email to complete it.
            </Text>
          </Pressable>
        </Section>

        <Section title="Photos of your work" level="Required · at least 3" icon="image-multiple-outline">
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
                onPress={async () => {
                  const u = await pickMedia();
                  if (u) setPhotos([...photos, u]);
                }}
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

        <Section title="30-second intro video" level="Optional · helps new Revivors" icon="video-outline">
          <UploadRow
            label={video ? 'Intro video added' : 'Say hi, where you have worked, and what you are best at'}
            done={!!video}
            onPress={async () => setVideo((await pickMedia('videos')) ?? video)}
          />
        </Section>

        <Banner icon="lock-outline" tone="cream" text="Your ID and selfie are only seen by the REVO team. Drivers see your badges and can open the certificates you upload here." />
      </ScrollView>
      <StickyFooter>
        <Button
          title="Submit for review"
          disabled={!ok}
          onPress={() => {
            submit({ idUploaded: true, backgroundConsent: bgConsent, certifications: certs.map(({ name, fileName }) => ({ name, fileName })), workPhotos: photos, introVideo: !!video });
            router.replace('/onboarding/submitted');
          }}
        />
      </StickyFooter>

      <ActionSheet
        visible={certSheet}
        title="Add certificate"
        message="What kind of certificate is it?"
        onClose={() => setCertSheet(false)}
        options={CERT_TYPES.map((label) => ({ label, onPress: () => addCert(label) }))}
      />
    </View>
  );
}

function Section({ title, level, icon, children }: { title: string; level: string; icon: IconName; children: React.ReactNode }) {
  return (
    <Card style={{ gap: 12 }}>
      <Row gap={10}>
        <Icon name={icon} size={22} color={colors.brick} />
        <View style={{ flex: 1 }}>
          <Text style={styles.secTitle}>{title}</Text>
          <Label style={{ fontSize: 10 }}>{level}</Label>
        </View>
      </Row>
      {children}
    </Card>
  );
}

function UploadRow({ label, done, uri, onPress }: { label: string; done: boolean; uri?: string | null; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.fileRow, pressed && { opacity: 0.8 }]}>
      {uri ? (
        <Image source={{ uri }} style={styles.thumb} />
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
  consent: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  box: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: colors.brick, borderColor: colors.brick },
  photo: { width: 74, height: 74, borderRadius: radius.md },
  addPhoto: { borderWidth: 2, borderStyle: 'dashed', borderColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  remove: { position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center' },
});
