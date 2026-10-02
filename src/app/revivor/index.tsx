import { Redirect, router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TopBar } from '../../components/layout';
import { LEVEL_COPY, LevelMeter } from '../../components/trust';
import { Banner, Button, Card, Divider, Icon, Label, NavyCard, Row } from '../../components/ui';
import { SERVICES } from '../../data/mock';
import { levelOf, ME_ID, priceText, ratingOf, useStore } from '../../store';
import { colors, fonts, radius, space } from '../../theme';

export default function Dashboard() {
  const me = useStore((s) => s.revivors.find((r) => r.id === ME_ID));
  const reviews = useStore((s) => s.reviews);
  const submitted = useStore((s) => s.meSubmitted);
  const simulate = useStore((s) => s.simulateApproval);
  const remove = useStore((s) => s.removeListing);

  if (!me) return <Redirect href="/onboarding" />;

  const level = levelOf(me);
  const first = me.name.split(' ')[0];
  const { avg, count } = ratingOf(reviews, ME_ID);
  const inReview = me.verifications.some((v) => v.status === 'in_review');
  const unpriced = me.listings.filter((l) => !l.priceMin && !l.priceMax).length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopBar title="Dashboard" subtitle={`Welcome back, ${first}`} />
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg, paddingBottom: 40 }}>
        {!submitted ? (
          <Card style={{ gap: 12, borderWidth: 2, borderColor: colors.brick }}>
            <Row gap={10}>
              <Icon name="alert-circle-outline" size={22} color={colors.brick} />
              <Text style={styles.cardTitle}>Finish verification</Text>
            </Row>
            <Text style={styles.sub}>Upload your ID and work photos so the REVO team can verify you. Until then drivers can’t find you.</Text>
            <Button title="Continue setup" onPress={() => router.push('/onboarding/evidence')} />
          </Card>
        ) : null}

        <NavyCard style={{ gap: 14 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Row gap={10}>
              <View style={styles.shield}>
                <Icon name={level ? 'shield-check' : 'shield-outline'} size={20} color={colors.cream} />
              </View>
              <View>
                <Text style={styles.navyTitle}>Verification Status</Text>
                <Text style={styles.navySub}>
                  {level ? `Verified · ${LEVEL_COPY[level].title}` : inReview ? 'In review by REVO' : 'Not verified'}
                </Text>
              </View>
            </Row>
          </Row>
          <LevelMeter level={level} onNavy />
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={styles.navySub}>Visible in driver search</Text>
            <Text style={[styles.navyTitle, { fontSize: 13 }]}>{level ? 'YES' : 'NO'}</Text>
          </Row>
          {level > 0 && level < 3 ? (
            <Text style={styles.navySub}>
              Next: {level === 1 ? 'upload a certification to reach Level 2.' : 'complete the background check to reach Level 3.'}
            </Text>
          ) : null}
        </NavyCard>

        <Row gap={10}>
          <Stat value={String(me.confirmedJobs)} label="Confirmed jobs" />
          <Stat value={count ? avg.toFixed(1) : 'New'} label="Rating" />
          <Stat value={String(me.workPhotos.length)} label="Work photos" />
        </Row>

        <Card style={{ gap: 4 }}>
          <Row style={{ justifyContent: 'space-between', marginBottom: 4 }}>
            <Label>Your services</Label>
            <Pressable onPress={() => router.push('/listing/new')} hitSlop={8}>
              <Text style={styles.link}>+ ADD</Text>
            </Pressable>
          </Row>
          {me.listings.length === 0 ? <Text style={styles.sub}>Add the services you offer and your usual price range.</Text> : null}
          {me.listings.map((l, i) => (
            <View key={l.id}>
              {i ? <Divider /> : null}
              <Row gap={12} style={{ paddingVertical: 12 }}>
                <Icon name={SERVICES[l.service].icon as never} size={22} color={colors.brick} />
                <Pressable style={{ flex: 1 }} onPress={() => router.push({ pathname: '/listing/new', params: { service: l.service } })}>
                  <Text style={styles.cardTitle}>{SERVICES[l.service].name}</Text>
                  <Text style={[styles.sub, !l.priceMin && { color: colors.brick }]}>{priceText(l)}</Text>
                </Pressable>
                <Pressable onPress={() => remove(l.id)} hitSlop={8} accessibilityLabel="Remove listing">
                  <Icon name="trash-can-outline" size={20} color={colors.muted} />
                </Pressable>
              </Row>
            </View>
          ))}
          {unpriced ? <Text style={[styles.sub, { color: colors.brick }]}>Tap a service to set its price.</Text> : null}
        </Card>

        <Button title="Preview my profile" variant="outline" icon="account-eye-outline" onPress={() => router.push({ pathname: '/revivors/[id]', params: { id: ME_ID, preview: '1' } })} />

        {inReview ? (
          <View style={styles.demo}>
            <Label>Prototype controls</Label>
            <Text style={styles.sub}>Stands in for the REVO team approving your checks in the admin tool.</Text>
            <Button title="Simulate REVO approval" variant="navy" small onPress={simulate} />
          </View>
        ) : null}

        {level > 0 ? <Banner icon="check-decagram" text="You're live. Drivers near you can find and message you." /> : null}
      </ScrollView>
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <Card style={{ flex: 1, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 8, gap: 2 }}>
      <Text style={styles.statVal}>{value}</Text>
      <Text style={[styles.sub, { textAlign: 'center', fontSize: 11.5 }]}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  cardTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  sub: { fontFamily: fonts.medium, fontSize: 13, color: colors.muted, lineHeight: 18 },
  shield: { width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, borderColor: colors.lineOnNavy, alignItems: 'center', justifyContent: 'center' },
  navyTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.cream },
  navySub: { fontFamily: fonts.medium, fontSize: 13, color: colors.mutedOnNavy },
  statVal: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.ink },
  link: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 0.8, color: colors.brick },
  demo: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.muted, borderRadius: radius.lg, padding: space.lg, gap: 10 },
});
