import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SERVICES } from '../data/mock';
import type { Review, Revivor, ServiceId, Verification, VerificationLevel } from '../data/types';
import { fmtLongDate, levelOf, priceText, ratingOf } from '../store';
import { colors, fonts, radius, space } from '../theme';
import { Avatar, Body, Card, Icon, Row, Stars, type IconName } from './ui';

export const LEVEL_COPY: Record<VerificationLevel, { title: string; detail: string }> = {
  0: { title: 'Not verified', detail: 'Hidden from search until REVO verifies ID' },
  1: { title: 'Level 1', detail: 'ID verified' },
  2: { title: 'Level 2', detail: 'ID + certification verified' },
  3: { title: 'Level 3', detail: 'ID + certification + background check' },
};

export const CHECK_META: Record<Verification['type'], { title: string; icon: IconName }> = {
  id: { title: 'Identity', icon: 'card-account-details-outline' },
  certification: { title: 'Certification', icon: 'certificate-outline' },
  background: { title: 'Background check', icon: 'shield-check-outline' },
  phone: { title: 'Phone', icon: 'cellphone-check' },
};

/** Compact pill used on cards: shield + "VERIFIED · LEVEL 3" */
export function LevelBadge({ level, onNavy }: { level: VerificationLevel; onNavy?: boolean }) {
  if (level === 0)
    return (
      <View style={[s.badge, { backgroundColor: colors.creamDeep }]}>
        <Icon name="shield-alert-outline" size={12} color={colors.muted} />
        <Text style={[s.badgeText, { color: colors.muted }]}>NOT VERIFIED</Text>
      </View>
    );
  const bg = onNavy ? colors.cream : colors.ink;
  const fg = onNavy ? colors.ink : colors.cream;
  return (
    <View style={[s.badge, { backgroundColor: bg }]}>
      <Icon name="shield-check" size={12} color={fg} />
      <Text style={[s.badgeText, { color: fg }]}>VERIFIED · LEVEL {level}</Text>
    </View>
  );
}

export function NewBadge() {
  return (
    <View style={[s.badge, { backgroundColor: colors.brick }]}>
      <Text style={[s.badgeText, { color: colors.cream }]}>NEW REVIVOR</Text>
    </View>
  );
}

/** Three-step meter of the verification levels. */
export function LevelMeter({ level, onNavy }: { level: VerificationLevel; onNavy?: boolean }) {
  return (
    <Row gap={4}>
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: 6,
            borderRadius: 3,
            backgroundColor: i <= level ? (onNavy ? colors.cream : colors.brick) : onNavy ? colors.lineOnNavy : colors.line,
          }}
        />
      ))}
    </Row>
  );
}

export function StatusPill({ status }: { status: Verification['status'] }) {
  const map = {
    verified: { t: 'VERIFIED', bg: colors.ink, fg: colors.cream },
    in_review: { t: 'IN REVIEW', bg: colors.creamDeep, fg: colors.ink },
    not_started: { t: 'NOT STARTED', bg: 'transparent', fg: colors.muted },
  }[status];
  return (
    <View style={[s.status, { backgroundColor: map.bg, borderColor: status === 'not_started' ? colors.line : map.bg }]}>
      <Text style={[s.badgeText, { color: map.fg }]}>{map.t}</Text>
    </View>
  );
}

export function VerificationRow({ v, onPress }: { v: Verification; onPress?: () => void }) {
  const meta = CHECK_META[v.type];
  const ok = v.status === 'verified';
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [s.vrow, pressed && { opacity: 0.7 }]}>
      <View style={[s.vicon, { backgroundColor: ok ? colors.ink : colors.creamDeep }]}>
        <Icon name={ok ? 'check-bold' : meta.icon} size={16} color={ok ? colors.cream : colors.muted} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={s.vtitle}>{meta.title}</Text>
        <Body style={{ fontSize: 13 }} muted={!ok}>
          {v.label}
        </Body>
        {ok && v.verifiedAt ? (
          <Text style={s.vmeta}>
            Checked by {v.verifiedBy} · {fmtLongDate(v.verifiedAt)}
          </Text>
        ) : null}
      </View>
      {onPress ? <Icon name="file-document-outline" size={20} color={colors.brick} /> : null}
    </Pressable>
  );
}

export function RevivorCard({
  r,
  reviews,
  service,
  onPress,
}: {
  r: Revivor;
  reviews: Review[];
  service: ServiceId | null;
  onPress: () => void;
}) {
  const level = levelOf(r);
  const { avg, count } = ratingOf(reviews, r.id);
  const listing = service ? r.listings.find((l) => l.service === service) : r.listings[0];
  const certs = r.verifications.filter((v) => v.type === 'certification' && v.status === 'verified');
  return (
    <Card onPress={onPress} style={{ gap: space.md }}>
      <Row gap={14} style={{ alignItems: 'flex-start' }}>
        <Avatar initials={r.initials} tone={r.avatarTone} uri={r.photoUri} size={60} />
        <View style={{ flex: 1, gap: 5 }}>
          <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Text style={s.name}>{r.name}</Text>
            {listing ? (
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.price}>{priceText(listing)}</Text>
                <Text style={s.priceSub}>{SERVICES[listing.service].short}</Text>
              </View>
            ) : null}
          </Row>
          <Row gap={6} style={{ flexWrap: 'wrap' }}>
            <LevelBadge level={level} />
            {r.confirmedJobs === 0 ? <NewBadge /> : null}
          </Row>
          {count ? (
            <Row gap={6}>
              <Stars value={avg} size={13} />
              <Text style={s.meta}>
                {avg.toFixed(1)} ({count} verified review{count === 1 ? '' : 's'})
              </Text>
            </Row>
          ) : (
            <Text style={s.meta}>No reviews yet</Text>
          )}
          <Text style={s.meta}>
            {r.confirmedJobs} confirmed REVO job{r.confirmedJobs === 1 ? '' : 's'} · {r.yearsExperience} yrs experience
          </Text>
        </View>
      </Row>
      <Row style={s.cardFoot} gap={12}>
        {certs[0] ? (
          <Row gap={5} style={{ flex: 1 }}>
            <Icon name="certificate-outline" size={14} color={colors.brick} />
            <Text numberOfLines={1} style={[s.meta, { flex: 1 }]}>
              {certs[0].label}
            </Text>
          </Row>
        ) : (
          <Row gap={5} style={{ flex: 1 }}>
            <Icon name="card-account-details-outline" size={14} color={colors.brick} />
            <Text style={s.meta}>Identity verified by REVO</Text>
          </Row>
        )}
        <Row gap={4}>
          <Icon name="map-marker-outline" size={14} color={colors.muted} />
          <Text style={s.meta}>{r.distanceMiles.toFixed(1)} mi</Text>
        </Row>
      </Row>
    </Card>
  );
}

/** Stand-in tile for a work photo when no real image is attached yet. */
export function WorkPhotoTile({ caption, service, size }: { caption: string; service: ServiceId; size: number }) {
  return (
    <View style={[s.photo, { width: size, height: size }]}>
      <Icon name={SERVICES[service].icon as IconName} size={size * 0.32} color={colors.cream} />
      <Text numberOfLines={2} style={s.photoCaption}>
        {caption}
      </Text>
    </View>
  );
}

export function ReviewItem({ r }: { r: Review }) {
  return (
    <View style={{ gap: 6, paddingVertical: space.md }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text style={s.vtitle}>{r.authorName}</Text>
        <Stars value={r.rating} size={12} />
      </Row>
      <Row gap={6}>
        <Icon name="check-decagram" size={13} color={colors.brick} />
        <Text style={s.vmeta}>
          Confirmed job · {SERVICES[r.service].short} · {r.vehicle}
        </Text>
      </Row>
      <Body style={{ fontSize: 14 }}>{r.text}</Body>
      {r.tags.length ? (
        <Row gap={6} style={{ flexWrap: 'wrap' }}>
          {r.tags.map((t) => (
            <View key={t} style={s.tag}>
              <Text style={s.tagText}>{t}</Text>
            </View>
          ))}
        </Row>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, height: 22, borderRadius: radius.pill, alignSelf: 'flex-start' },
  badgeText: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 0.8 },
  status: { paddingHorizontal: 8, height: 22, borderRadius: radius.pill, borderWidth: 1, justifyContent: 'center' },
  name: { fontFamily: fonts.bold, fontSize: 18, color: colors.ink },
  price: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.ink },
  priceSub: { fontFamily: fonts.medium, fontSize: 11, color: colors.muted },
  meta: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.muted },
  cardFoot: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line, paddingTop: space.md },
  vrow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 10 },
  vicon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  vtitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
  vmeta: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.muted },
  photo: {
    borderRadius: radius.md,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    gap: 6,
  },
  photoCaption: { fontFamily: fonts.semibold, fontSize: 10.5, color: colors.cream, textAlign: 'center' },
  tag: { backgroundColor: colors.creamDeep, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  tagText: { fontFamily: fonts.semibold, fontSize: 11, color: colors.ink },
});
