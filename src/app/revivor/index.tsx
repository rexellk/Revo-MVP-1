import { Redirect, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TopBar } from '../../components/layout';
import { CHECK_META } from '../../components/trust';
import { Banner, Button, Card, Divider, Icon, Label, NavyCard, Row } from '../../components/ui';
import { SERVICES } from '../../data/mock';
import { deleteListing, fetchMyRevivor } from '../../lib/verification';
import { isVerified, ME_ID, priceText, ratingOf, REQUIRED_CHECKS, useStore } from '../../store';
import { colors, fonts, space } from '../../theme';

export default function Dashboard() {
  const me = useStore((s) => s.revivors.find((r) => r.id === ME_ID));
  const reviews = useStore((s) => s.reviews);
  const submitted = useStore((s) => s.meSubmitted);
  const hydrateMe = useStore((s) => s.hydrateMe);
  const remove = useStore((s) => s.removeListing);
  const [checking, setChecking] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  // Latest decision on my most recent submission; null until fetched or if I never submitted.
  const [reviewState, setReviewState] = useState<'in_review' | 'verified' | 'rejected' | null>(submitted ? 'in_review' : null);

  // Rebuild my profile from Supabase every time the dashboard opens, in any state. A full rebuild
  // (not just the status) keeps labels right when the team changes a decision, e.g. rejected -> verified.
  const refresh = useCallback(async () => {
    setChecking(true);
    try {
      const mine = await fetchMyRevivor();
      if (mine) hydrateMe(mine);
      const review = mine?.submission;
      if (review) {
        setNote(review.reviewerNote);
        const st = [review.idStatus, review.aseStatus];
        setReviewState(st.includes('rejected') ? 'rejected' : st.every((x) => x === 'verified') ? 'verified' : 'in_review');
      }
    } catch {
      setNote('Could not reach REVO. Tap Refresh status to try again.');
    } finally {
      setChecking(false);
    }
  }, [hydrateMe]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  if (!me) return <Redirect href="/onboarding" />;

  const verified = isVerified(me);
  // Status of each required check. With several ASE certificates, any verified one counts.
  const statusOf = (t: (typeof REQUIRED_CHECKS)[number]) => {
    const vs = me.verifications.filter((v) => v.type === t);
    if (vs.some((v) => v.status === 'verified')) return 'verified';
    if (vs.some((v) => v.status === 'in_review')) return 'in_review';
    return 'not_started';
  };
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
            <Text style={styles.sub}>Upload your ID, your ASE certificate and work photos so the REVO team can verify you. Until then drivers can’t find you.</Text>
            <Button title="Continue setup" onPress={() => router.push('/onboarding/evidence')} />
          </Card>
        ) : null}

        <NavyCard style={{ gap: 14 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Row gap={10}>
              <View style={styles.shield}>
                <Icon name={verified ? 'shield-check' : 'shield-outline'} size={20} color={colors.cream} />
              </View>
              <View>
                <Text style={styles.navyTitle}>Verification Status</Text>
                <Text style={styles.navySub}>
                  {verified ? 'Verified · ID + ASE' : inReview ? 'In review by REVO' : 'Not verified'}
                </Text>
              </View>
            </Row>
          </Row>
          {REQUIRED_CHECKS.map((t) => {
            const st = statusOf(t);
            return (
              <Row key={t} style={{ justifyContent: 'space-between' }}>
                <Row gap={8}>
                  <Icon
                    name={st === 'verified' ? 'check-circle' : st === 'in_review' ? 'clock-outline' : 'circle-outline'}
                    size={18}
                    color={st === 'verified' ? colors.cream : colors.mutedOnNavy}
                  />
                  <Text style={styles.navySub}>{CHECK_META[t].title}</Text>
                </Row>
                <Text style={[styles.navyTitle, { fontSize: 12 }]}>
                  {st === 'verified' ? 'VERIFIED' : st === 'in_review' ? 'IN REVIEW' : 'NEEDED'}
                </Text>
              </Row>
            );
          })}
          <View style={styles.navyDivider} />
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={styles.navySub}>Visible in driver search</Text>
            <Text style={[styles.navyTitle, { fontSize: 13 }]}>{verified ? 'YES' : 'NO'}</Text>
          </Row>
          {!verified ? <Text style={styles.navySub}>Both checks are required before drivers can find you.</Text> : null}
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
                <Pressable
                  onPress={async () => {
                    try {
                      await deleteListing(l.service);
                      remove(l.id);
                    } catch (e) {
                      Alert.alert('Could not remove', e instanceof Error ? e.message : 'Check your connection and try again.');
                    }
                  }}
                  hitSlop={8}
                  accessibilityLabel="Remove listing"
                >
                  <Icon name="trash-can-outline" size={20} color={colors.muted} />
                </Pressable>
              </Row>
            </View>
          ))}
          {unpriced ? <Text style={[styles.sub, { color: colors.brick }]}>Tap a service to set its price.</Text> : null}
        </Card>

        <Button title="Preview my profile" variant="outline" icon="account-eye-outline" onPress={() => router.push({ pathname: '/revivors/[id]', params: { id: ME_ID, preview: '1' } })} />

        {note ? <Banner icon="information-outline" text={note} /> : null}

        {reviewState ? (
          <Card style={{ gap: 10 }}>
            <Text style={styles.sub}>
              {reviewState === 'verified'
                ? 'You are verified. Refresh any time to see the latest from the REVO team.'
                : reviewState === 'rejected'
                  ? 'The REVO team could not verify something. Check the note above, then tap Continue setup to upload again.'
                  : 'The REVO team is reviewing your ID and ASE certificate. This page updates when they finish.'}
            </Text>
            <Button title="Refresh status" variant="navy" small icon="refresh" loading={checking} onPress={refresh} />
          </Card>
        ) : null}

        {verified ? <Banner icon="check-decagram" text="You're live. Drivers near you can find and message you." /> : null}
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
  navyDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.lineOnNavy },
  statVal: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.ink },
  link: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 0.8, color: colors.brick },
});
