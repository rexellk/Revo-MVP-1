import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StickyFooter, TopBar } from '../../components/layout';
import { pickMedia, StepHeader } from '../../components/onboarding';
import { Avatar, Button, Chip, Field, Icon, Label } from '../../components/ui';
import { SERVICES, SERVICE_ORDER } from '../../data/mock';
import type { ServiceId } from '../../data/types';
import { useStore } from '../../store';
import { colors, fonts, radius, shadow, space } from '../../theme';

const RADII = [5, 10, 15, 25];

export default function OnboardingProfile() {
  const create = useStore((s) => s.createRevivorProfile);
  const [photo, setPhoto] = useState<string | undefined>();
  const [name, setName] = useState('');
  const [years, setYears] = useState('');
  const [bio, setBio] = useState('');
  const [area, setArea] = useState('Ann Arbor');
  const [radiusMiles, setRadius] = useState(10);
  const [services, setServices] = useState<ServiceId[]>([]);

  const ok = name.trim().split(' ').length >= 2 && Number(years) >= 0 && years !== '' && bio.trim().length >= 20 && services.length > 0;
  const toggle = (s: ServiceId) => setServices(services.includes(s) ? services.filter((x) => x !== s) : [...services, s]);
  const displayName = (() => {
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2 ? `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.` : name.trim();
  })();

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TopBar title="Become a Revivor" />
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.xl, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <StepHeader step={1} total={3} title="YOUR PROFILE" body="Drivers decide who to trust from this page. Real photo, real name, real experience." />

        <Pressable onPress={async () => setPhoto((await pickMedia()) ?? photo)} style={styles.photoRow}>
          {photo ? (
            <Avatar initials="" tone={colors.navy} size={84} uri={photo} />
          ) : (
            <View style={styles.photoEmpty}>
              <Icon name="camera-plus-outline" size={28} color={colors.cream} />
            </View>
          )}
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.photoTitle}>{photo ? 'Change photo' : 'Add a clear photo of your face'}</Text>
            <Text style={styles.photoHint}>The REVO team matches it to your ID.</Text>
          </View>
        </Pressable>

        <Field label="Full legal name" placeholder="Mike Stevenson" value={name} onChangeText={setName} hint={displayName ? `Drivers see: ${displayName}` : 'Drivers see your first name and last initial.'} />
        <Field label="Years of hands-on experience" placeholder="5" keyboardType="number-pad" value={years} onChangeText={(t) => setYears(t.replace(/\D/g, '').slice(0, 2))} />
        <Field
          label="Short bio"
          placeholder="Where you've worked, what you're best at, how you work with customers."
          multiline
          value={bio}
          onChangeText={setBio}
          hint={bio.trim().length >= 20 ? 'Looks good.' : `${20 - bio.trim().length} more characters, at least.`}
        />

        <View style={{ gap: 10 }}>
          <Label>Services you offer</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {SERVICE_ORDER.map((s) => (
              <Pressable key={s} onPress={() => toggle(s)} style={[styles.svc, services.includes(s) && styles.svcOn]}>
                <Icon name={SERVICES[s].icon as never} size={20} color={services.includes(s) ? colors.cream : colors.ink} />
                <Text style={[styles.svcText, services.includes(s) && { color: colors.cream }]}>{SERVICES[s].short}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Field label="Home base" placeholder="Ann Arbor" value={area} onChangeText={setArea} />
        <View style={{ gap: 10 }}>
          <Label>How far will you travel?</Label>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {RADII.map((m) => (
              <Chip key={m} label={`${m} mi`} selected={radiusMiles === m} onPress={() => setRadius(m)} />
            ))}
          </View>
        </View>
      </ScrollView>
      <StickyFooter>
        <Button
          title="Continue"
          disabled={!ok}
          onPress={() => {
            create({
              name: displayName,
              bio: bio.trim(),
              yearsExperience: Number(years),
              area: area.trim() || 'Ann Arbor',
              radiusMiles,
              services,
              photoUri: photo,
            });
            router.push('/onboarding/evidence');
          }}
        />
      </StickyFooter>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.lg,
    ...shadow.card,
  },
  photoEmpty: { width: 84, height: 84, borderRadius: 42, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  photoTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  photoHint: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.muted },
  svc: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.ink,
    backgroundColor: colors.white,
  },
  svcOn: { backgroundColor: colors.brick, borderColor: colors.brick },
  svcText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
});
