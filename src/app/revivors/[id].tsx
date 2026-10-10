import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { track } from '../../analytics';
import { StickyFooter } from '../../components/layout';
import { ActionSheet } from '../../components/sheet';
import { CHECK_META, NewBadge, ReviewItem, VerificationRow, VerifiedBadge, WorkPhotoTile } from '../../components/trust';
import { Avatar, Banner, Body, Button, Card, Divider, Icon, Label, NavyGradient, Row } from '../../components/ui';
import { SERVICES } from '../../data/mock';
import { fmtLongDate, isVerified, missingChecks, priceText, ratingOf, sortChecks, useStore } from '../../store';
import { colors, fonts, radius, space } from '../../theme';

type Section = 'verification' | 'intro' | 'about' | 'photos' | 'services' | 'reviews';

export default function TrustProfile() {
  const { id, preview } = useLocalSearchParams<{ id: string; preview?: string }>();
  const r = useStore((s) => s.revivors.find((x) => x.id === id));
  const allReviews = useStore((s) => s.reviews);
  const startConversation = useStore((s) => s.startConversation);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [videoOpen, setVideoOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reported, setReported] = useState(false);

  // Scroll-depth tracking. Only touched in event handlers, never during render.
  const tracker = useRef({ y: {} as Partial<Record<Section, number>>, bodyY: 0, seen: new Set<Section>() });
  const isPreview = preview === '1';

  useEffect(() => {
    if (r && !isPreview) track('profile_viewed', { revivorId: r.id });
  }, [r?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!r) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <Body muted>Revivor not found.</Body>
      </View>
    );
  }

  const verified = isVerified(r);
  const reviews = allReviews.filter((x) => x.revivorId === r.id);
  const { avg, count } = ratingOf(allReviews, r.id);
  const first = r.name.split(' ')[0];
  const shown = sortChecks(r.verifications).filter((v) => v.status !== 'not_started');
  const pending = missingChecks(r);
  const contentWidth = Math.min(width, 560) - space.lg * 2 - space.lg * 2;
  const photoSize = (contentWidth - 16) / 3;

  const setSectionY = (key: Section, e: LayoutChangeEvent) => {
    tracker.current.y[key] = e.nativeEvent.layout.y;
  };
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isPreview) return;
    const bottom = e.nativeEvent.contentOffset.y + e.nativeEvent.layoutMeasurement.height;
    const t = tracker.current;
    (Object.keys(t.y) as Section[]).forEach((k) => {
      const y = t.bodyY + t.y[k]!;
      if (!t.seen.has(k) && bottom > y + 80) {
        t.seen.add(k);
        track('profile_section_seen', { revivorId: r.id, section: k });
      }
    });
  };

  const message = () => {
    const cid = startConversation(r.id);
    router.push(`/chat/${cid}`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="light" />
      <ScrollView onScroll={onScroll} scrollEventThrottle={100} contentContainerStyle={{ paddingBottom: 32 }}>
        <NavyGradient style={{ paddingTop: insets.top + 8, paddingBottom: 28, paddingHorizontal: space.lg }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
              <Icon name="chevron-left" size={30} color={colors.cream} />
            </Pressable>
            {!isPreview ? (
              <Pressable
                hitSlop={10}
                accessibilityLabel="Report"
                onPress={() => setReporting(true)}
              >
                <Icon name="flag-outline" size={22} color={colors.mutedOnNavy} />
              </Pressable>
            ) : null}
          </Row>
          <View style={{ alignItems: 'center', gap: 10, marginTop: 4 }}>
            <Avatar initials={r.initials} tone={r.avatarTone} uri={r.photoUri} size={96} ring />
            <Text style={styles.name}>{r.name.toUpperCase()}</Text>
            <Text style={styles.sub}>
              Revivor · {r.area}
              {r.distanceMiles ? ` · ${r.distanceMiles.toFixed(1)} mi away` : ''}
            </Text>
            <Row gap={6}>
              <VerifiedBadge verified={verified} onNavy />
              {r.confirmedJobs === 0 ? <NewBadge /> : null}
            </Row>
          </View>
          <Row style={styles.stats} gap={0}>
            <Stat big={count ? avg.toFixed(1) : 'New'} small={count ? `${count} verified review${count === 1 ? '' : 's'}` : 'No reviews yet'} icon="star" />
            <View style={styles.statDivider} />
            <Stat big={String(r.confirmedJobs)} small="Confirmed REVO jobs" icon="check-decagram" />
            <View style={styles.statDivider} />
            <Stat big={`${r.yearsExperience} yrs`} small="Experience" icon="wrench" />
          </Row>
        </NavyGradient>

        <View style={styles.body} onLayout={(e) => {
            tracker.current.bodyY = e.nativeEvent.layout.y;
          }}>
          {isPreview ? <Banner icon="eye-outline" text="This is exactly what drivers see on your profile." /> : null}
          {reported ? <Banner icon="flag-checkered" text="Thanks. The REVO team reviews every report within 24 hours." /> : null}

          {/* Verification: the core of MVP1 */}
          <Card onLayout={(e) => setSectionY('verification', e)} style={{ gap: 4 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Label>Verification</Label>
              <Text style={styles.levelTitle}>{verified ? 'ID + ASE VERIFIED' : 'NOT VERIFIED'}</Text>
            </Row>
            {shown.map((v, i) => (
              <VerificationRow
                key={`${v.type}-${i}`}
                v={v}
                onPress={
                  v.type === 'ase' && v.documentName && v.status === 'verified'
                    ? () => {
                        track('credential_opened', { revivorId: r.id, doc: v.documentName });
                        router.push({ pathname: '/credential', params: { revivorId: r.id, index: String(r.verifications.indexOf(v)) } });
                      }
                    : undefined
                }
              />
            ))}
            {pending.length ? (
              <Text style={styles.fine}>Not yet verified: {pending.map((t) => CHECK_META[t].title).join(', ')}. Hidden from drivers until both are verified.</Text>
            ) : null}
            <Divider style={{ marginVertical: 8 }} />
            <Row gap={8}>
              <Icon name="lock-outline" size={14} color={colors.muted} />
              <Text style={[styles.fine, { flex: 1 }]}>Checked by the REVO team. {first} can’t edit these badges.</Text>
            </Row>
          </Card>

          {r.hasIntroVideo ? (
            <Pressable
              onLayout={(e) => setSectionY('intro', e)}
              onPress={() => {
                track('intro_video_opened', { revivorId: r.id });
                setVideoOpen(!videoOpen);
              }}
              style={({ pressed }) => [styles.video, pressed && { opacity: 0.9 }]}
            >
              <View style={styles.play}>
                <Icon name={videoOpen ? 'pause' : 'play'} size={26} color={colors.ink} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.videoTitle}>MEET {first.toUpperCase()}</Text>
                <Text style={styles.videoSub}>{videoOpen ? 'Video playback connects in the next build.' : '30-second intro, recorded for REVO'}</Text>
              </View>
            </Pressable>
          ) : null}

          <Card onLayout={(e) => setSectionY('about', e)} style={{ gap: 10 }}>
            <Label>About {first}</Label>
            <Body>{r.bio}</Body>
            <Divider style={{ marginVertical: 4 }} />
            <Fact icon="map-marker-radius-outline" text={`Travels up to ${r.radiusMiles} mi around ${r.area}`} />
            {r.avgReplyMins ? <Fact icon="message-reply-text-outline" text={`Usually replies in about ${r.avgReplyMins} min`} /> : null}
            <Fact icon="calendar-check-outline" text={`On REVO since ${fmtLongDate(r.memberSince)}`} />
          </Card>

          {r.workPhotos.length ? (
            <Card onLayout={(e) => setSectionY('photos', e)} style={{ gap: 12 }}>
              <Label>Photos from past work</Label>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {r.workPhotos.map((p) => (
                  <Pressable key={p.id} onPress={() => track('work_photo_opened', { revivorId: r.id, photo: p.id })}>
                    <WorkPhotoTile caption={p.caption} service={p.service} size={photoSize} />
                  </Pressable>
                ))}
              </View>
            </Card>
          ) : null}

          <Card onLayout={(e) => setSectionY('services', e)} style={{ gap: 4 }}>
            <Label>Services {first} offers</Label>
            {r.listings.map((l, i) => (
              <View key={l.id}>
                {i ? <Divider /> : null}
                <Row style={{ paddingVertical: 12, alignItems: 'flex-start' }} gap={12}>
                  <Icon name={SERVICES[l.service].icon as never} size={22} color={colors.brick} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.svc}>{SERVICES[l.service].name}</Text>
                    {l.note ? <Text style={styles.fine}>{l.note}</Text> : null}
                  </View>
                  <Text style={styles.svcPrice}>{priceText(l)}</Text>
                </Row>
              </View>
            ))}
            <Text style={styles.fine}>Listed by {first}. You agree on the final price in chat and pay {first} directly.</Text>
          </Card>

          <Card onLayout={(e) => setSectionY('reviews', e)}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Label>Verified reviews</Label>
              {count ? <Text style={styles.levelTitle}>{avg.toFixed(1)} ★</Text> : null}
            </Row>
            <Text style={[styles.fine, { marginTop: 6 }]}>Only drivers with a job confirmed by both sides can leave a review.</Text>
            {reviews.length ? (
              reviews.map((rv, i) => (
                <View key={rv.id}>
                  {i ? <Divider /> : null}
                  <ReviewItem r={rv} />
                </View>
              ))
            ) : (
              <View style={styles.noReviews}>
                <Icon name="star-plus-outline" size={22} color={colors.brick} />
                <Text style={[styles.fine, { flex: 1, fontSize: 13 }]}>
                  {first} is new to REVO, so there are no reviews yet. Check the verification and past work above.
                </Text>
              </View>
            )}
          </Card>
        </View>
      </ScrollView>

      <ActionSheet
        visible={reporting}
        title={`Report ${first}`}
        message="What's wrong with this profile?"
        onClose={() => setReporting(false)}
        options={['Fake or misleading credentials', 'Photos are not their work', 'Asked me to pay outside REVO', 'Something else'].map((label) => ({
          label,
          onPress: () => {
            track('user_reported', { revivorId: r.id, reason: label });
            setReported(true);
          },
        }))}
      />

      {!isPreview ? (
        <StickyFooter>
          <Button title={`Message ${first}`} icon="message-outline" onPress={message} />
        </StickyFooter>
      ) : null}
    </View>
  );
}

function Stat({ big, small, icon }: { big: string; small: string; icon: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 3 }}>
      <Row gap={5}>
        <Icon name={icon as never} size={15} color={colors.cream} />
        <Text style={styles.statBig}>{big}</Text>
      </Row>
      <Text style={styles.statSmall}>{small}</Text>
    </View>
  );
}

function Fact({ icon, text }: { icon: string; text: string }) {
  return (
    <Row gap={10}>
      <Icon name={icon as never} size={18} color={colors.brick} />
      <Body style={{ fontSize: 14, flex: 1 }}>{text}</Body>
    </Row>
  );
}

const styles = StyleSheet.create({
  name: { fontFamily: fonts.display, fontSize: 22, color: colors.cream, letterSpacing: 0.5 },
  sub: { fontFamily: fonts.medium, fontSize: 13, color: colors.mutedOnNavy },
  stats: {
    marginTop: 22,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.lineOnNavy,
    paddingTop: 16,
    alignItems: 'flex-start',
  },
  statDivider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: colors.lineOnNavy },
  statBig: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.cream },
  statSmall: { fontFamily: fonts.medium, fontSize: 11, color: colors.mutedOnNavy, textAlign: 'center' },
  body: { padding: space.lg, gap: space.lg, marginTop: -14, maxWidth: 560, width: '100%', alignSelf: 'center' },
  levelTitle: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1, color: colors.brick },
  fine: { fontFamily: fonts.medium, fontSize: 12, color: colors.muted, lineHeight: 17 },
  video: {
    backgroundColor: colors.brick,
    borderRadius: radius.lg,
    padding: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  play: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' },
  videoTitle: { fontFamily: fonts.display, fontSize: 14, color: colors.cream, letterSpacing: 0.5 },
  videoSub: { fontFamily: fonts.medium, fontSize: 12.5, color: 'rgba(255,252,215,0.8)' },
  svc: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  svcPrice: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.ink },
  noReviews: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    backgroundColor: colors.creamDeep,
    borderRadius: radius.md,
    padding: space.md,
    marginTop: 12,
  },
});
