import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { track } from '../../analytics';
import { StickyFooter, TopBar } from '../../components/layout';
import { Banner, Button, Chip, Field, Icon, Label, Row } from '../../components/ui';
import { SERVICES, SERVICE_ORDER } from '../../data/mock';
import type { ServiceId } from '../../data/types';
import { ME_ID, useStore } from '../../store';
import { colors, space } from '../../theme';

export default function ListingEditor() {
  const params = useLocalSearchParams<{ service?: ServiceId }>();
  const existing = useStore((s) => s.revivors.find((r) => r.id === ME_ID)?.listings.find((l) => l.service === params.service));
  const add = useStore((s) => s.addListing);
  const [service, setService] = useState<ServiceId | null>(params.service ?? null);
  const [min, setMin] = useState(existing?.priceMin ? String(existing.priceMin) : '');
  const [max, setMax] = useState(existing?.priceMax ? String(existing.priceMax) : '');
  const [note, setNote] = useState(existing?.note ?? '');

  const lo = Number(min);
  const hi = Number(max || min);
  const ok = !!service && lo > 0 && hi >= lo;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TopBar
        title={existing ? 'Edit service' : 'Add a service'}
        hideSwitch
        right={
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Close">
            <Icon name="close" size={24} />
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.xl }} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 10 }}>
          <Label>Service</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {SERVICE_ORDER.map((s) => (
              <Chip key={s} label={SERVICES[s].short} icon={SERVICES[s].icon as never} selected={service === s} onPress={() => !params.service && setService(s)} />
            ))}
          </View>
        </View>
        <Row gap={12} style={{ alignItems: 'flex-start' }}>
          <Field style={{ flex: 1 }} label="From ($)" placeholder="60" keyboardType="number-pad" value={min} onChangeText={(t) => setMin(t.replace(/\D/g, '').slice(0, 4))} />
          <Field style={{ flex: 1 }} label="Up to ($)" placeholder="85" keyboardType="number-pad" value={max} onChangeText={(t) => setMax(t.replace(/\D/g, '').slice(0, 4))} />
        </Row>
        <Field label="Note for drivers (optional)" placeholder="Parts included. Synthetic or conventional." value={note} onChangeText={setNote} />
        <Banner icon="information-outline" tone="cream" text="Drivers see this range on your profile. You agree on the exact price in chat before the job." />
      </ScrollView>
      <StickyFooter>
        <Button
          title="Save service"
          disabled={!ok}
          onPress={() => {
            if (!service) return;
            add({ service, priceMin: lo, priceMax: hi, note: note.trim() || undefined });
            track('listing_created', { service, lo, hi });
            router.back();
          }}
        />
      </StickyFooter>
    </KeyboardAvoidingView>
  );
}
