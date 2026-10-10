import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SERVICES } from '../data/mock';
import type { Conversation, Job, Role } from '../data/types';
import { fmtDate, fmtLongDate, jobRef, useStore } from '../store';
import { colors, fonts, radius, space } from '../theme';
import { Avatar, Button, Card, Icon, Row } from './ui';

export function ConversationRow({ c, role }: { c: Conversation; role: Role }) {
  const r = useStore((s) => s.revivors.find((x) => x.id === c.revivorId));
  if (!r) return null;
  const last = c.messages[c.messages.length - 1];
  const name = role === 'driver' ? r.name : c.driverName;
  const initials = role === 'driver' ? r.initials : c.driverName.split(' ').map((p) => p[0]).join('').slice(0, 2);
  const preview = !last
    ? 'Say hi and describe the job'
    : last.kind === 'system'
      ? last.text
      : `${last.from === role ? 'You: ' : ''}${last.text}`;
  return (
    <Pressable onPress={() => router.push(`/chat/${c.id}`)} style={({ pressed }) => [styles.conv, pressed && { backgroundColor: colors.creamSoft }]}>
      <Avatar initials={initials} tone={role === 'driver' ? r.avatarTone : colors.navyRoyal} size={52} />
      <View style={{ flex: 1, gap: 3 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Row gap={6} style={{ flex: 1 }}>
            <Text style={styles.convName} numberOfLines={1}>
              {name}
            </Text>
            {role === 'driver' ? (
              <View style={styles.miniBadge} accessibilityLabel="Verified: ID and ASE">
                <Icon name="shield-check" size={10} color={colors.cream} />
                <Text style={styles.miniBadgeText}>ASE</Text>
              </View>
            ) : null}
            {c.blocked ? <Text style={styles.blocked}>BLOCKED</Text> : null}
          </Row>
          {last ? <Text style={styles.time}>{fmtDate(last.at)}</Text> : null}
        </Row>
        <Row style={{ justifyContent: 'space-between' }} gap={10}>
          <Text numberOfLines={1} style={[styles.preview, c.unread ? { color: colors.ink, fontFamily: fonts.semibold } : null]}>
            {preview}
          </Text>
          {c.unread ? (
            <View style={styles.unread}>
              <Text style={styles.unreadText}>{c.unread}</Text>
            </View>
          ) : null}
        </Row>
      </View>
    </Pressable>
  );
}

export function JobCard({ j, role }: { j: Job; role: Role }) {
  const r = useStore((s) => s.revivors.find((x) => x.id === j.revivorId));
  const confirmJob = useStore((s) => s.confirmJob);
  if (!r) return null;
  const other = role === 'driver' ? r.name : j.driverName;
  const otherFirst = other.split(' ')[0];
  const awaiting = j.status === 'awaiting_confirmation';
  const theyMarked = awaiting && j.proposedBy !== role;

  return (
    <View style={styles.job}>
      <View style={styles.jobHead}>
        <Text style={styles.jobHeadText}>{awaiting ? 'NEEDS CONFIRMATION' : 'CONFIRMED JOB'}</Text>
        <Text style={styles.jobId}>#{jobRef(j.id)}</Text>
      </View>
      <View style={{ padding: space.lg, gap: 10 }}>
        <Text style={styles.jobTitle}>{SERVICES[j.service].name}</Text>
        <Text style={styles.jobSub}>{j.vehicle}</Text>
        <Row gap={10}>
          <Icon name="account-wrench-outline" size={18} color={colors.brick} />
          <Text style={styles.jobLine}>{role === 'driver' ? `Revivor: ${other}` : `Driver: ${other}`}</Text>
        </Row>
        <Row gap={10}>
          <Icon name="calendar-outline" size={18} color={colors.brick} />
          <Text style={styles.jobLine}>{fmtLongDate(j.date)}</Text>
        </Row>

        {theyMarked ? (
          <>
            <Text style={styles.jobNote}>
              {otherFirst} marked this job as done. Confirm only if it really happened.
            </Text>
            <Row gap={10}>
              <Button title="Not us" variant="outline" small style={{ flex: 1 }} onPress={() => router.push(`/chat/${j.conversationId}`)} />
              <Button title="Confirm job" small style={{ flex: 1 }} onPress={() => confirmJob(j.id, role)} />
            </Row>
          </>
        ) : awaiting ? (
          <Text style={styles.jobNote}>Waiting for {otherFirst} to confirm.</Text>
        ) : role === 'driver' && !j.reviewed ? (
          <Button title={`Review ${otherFirst}`} icon="star-outline" onPress={() => router.push(`/review/${j.id}`)} />
        ) : role === 'driver' ? (
          <Row gap={6}>
            <Icon name="check-circle" size={16} color={colors.ink} />
            <Text style={styles.jobLine}>You reviewed this job</Text>
          </Row>
        ) : (
          <Row gap={6}>
            <Icon name="check-circle" size={16} color={colors.ink} />
            <Text style={styles.jobLine}>Counts toward your confirmed jobs</Text>
          </Row>
        )}
      </View>
    </View>
  );
}

export function HowJobsWork({ role }: { role: Role }) {
  return (
    <Card style={{ gap: 10 }}>
      <Text style={styles.howTitle}>HOW CONFIRMED JOBS WORK</Text>
      {[
        ['message-outline', 'Agree on the job and price in chat.'],
        ['cash', role === 'driver' ? 'Pay your Revivor directly when the work is done.' : 'Get paid directly by the driver.'],
        ['handshake-outline', 'One of you taps "We did a job", the other confirms.'],
        ['star-outline', role === 'driver' ? 'That unlocks one verified review.' : 'The driver can then leave one verified review.'],
      ].map(([icon, text]) => (
        <Row key={text} gap={10}>
          <Icon name={icon as never} size={18} color={colors.brick} />
          <Text style={[styles.jobLine, { flex: 1 }]}>{text}</Text>
        </Row>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  conv: { flexDirection: 'row', gap: 14, alignItems: 'center', paddingHorizontal: space.lg, paddingVertical: 14 },
  convName: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink, flexShrink: 1 },
  time: { fontFamily: fonts.medium, fontSize: 12, color: colors.muted },
  preview: { flex: 1, fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  unread: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: colors.brick, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  unreadText: { fontFamily: fonts.bold, fontSize: 11, color: colors.cream },
  miniBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: colors.ink, borderRadius: radius.pill, paddingHorizontal: 5, height: 16 },
  miniBadgeText: { fontFamily: fonts.bold, fontSize: 9, color: colors.cream },
  blocked: { fontFamily: fonts.bold, fontSize: 9, letterSpacing: 0.8, color: colors.brick },
  job: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.white, borderWidth: 2, borderColor: colors.ink },
  jobHead: { backgroundColor: colors.ink, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: space.lg, paddingVertical: 12 },
  jobHeadText: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 1.2, color: colors.cream },
  jobId: { fontFamily: fonts.medium, fontSize: 11, color: colors.mutedOnNavy },
  jobTitle: { fontFamily: fonts.bold, fontSize: 19, color: colors.ink },
  jobSub: { fontFamily: fonts.medium, fontSize: 13, color: colors.muted, marginTop: -6 },
  jobLine: { fontFamily: fonts.medium, fontSize: 14, color: colors.ink },
  jobNote: { fontFamily: fonts.medium, fontSize: 13, color: colors.muted, lineHeight: 18 },
  howTitle: { fontFamily: fonts.display, fontSize: 12, color: colors.ink, letterSpacing: 0.5 },
});
