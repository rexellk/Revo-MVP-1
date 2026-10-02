import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActionSheet, type SheetOption } from '../../components/sheet';
import { LevelBadge } from '../../components/trust';
import { Avatar, Banner, Button, Chip, Icon, Label, Row } from '../../components/ui';
import { SERVICES, SERVICE_ORDER } from '../../data/mock';
import type { Message, ServiceId } from '../../data/types';
import { fmtTime, levelOf, useStore } from '../../store';
import { colors, fonts, radius, space } from '../../theme';

export default function Chat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const role = useStore((s) => s.role);
  const conv = useStore((s) => s.conversations.find((c) => c.id === id));
  const r = useStore((s) => s.revivors.find((x) => x.id === conv?.revivorId));
  const jobs = useStore((s) => s.jobs);
  const send = useStore((s) => s.sendMessage);
  const markRead = useStore((s) => s.markRead);
  const sharePhone = useStore((s) => s.sharePhone);
  const block = useStore((s) => s.blockConversation);
  const report = useStore((s) => s.report);
  const confirmJob = useStore((s) => s.confirmJob);
  const markJob = useStore((s) => s.markJob);
  const insets = useSafeAreaInsets();
  const scroll = useRef<ScrollView>(null);
  const [text, setText] = useState('');
  const [sheet, setSheet] = useState(false);
  const [menu, setMenu] = useState<null | 'main' | 'report'>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (id) markRead(id);
  }, [id, conv?.messages.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!conv || !r) return null;

  const otherName = role === 'driver' ? r.name : conv.driverName;
  const otherFirst = otherName.split(' ')[0];
  const initials = role === 'driver' ? r.initials : conv.driverName.split(' ').map((p) => p[0]).join('').slice(0, 2);
  const iShared = conv.phoneShared[role];
  const theyShared = conv.phoneShared[role === 'driver' ? 'revivor' : 'driver'];
  const openJob = jobs.find((j) => j.conversationId === conv.id && j.status === 'awaiting_confirmation');

  const onSend = () => {
    const t = text.trim();
    if (!t) return;
    send(conv.id, role, t);
    setText('');
  };

  const mainOptions: SheetOption[] = [
    ...(!iShared ? [{ label: 'Share my phone number', icon: 'phone-outline' as const, onPress: () => sharePhone(conv.id, role) }] : []),
    ...(role === 'driver' ? [{ label: 'View profile', icon: 'account-outline' as const, onPress: () => router.push(`/revivors/${r.id}`) }] : []),
    { label: 'Report', icon: 'flag-outline', onPress: () => setMenu('report') },
    { label: `Block ${otherFirst}`, icon: 'account-cancel-outline', destructive: true, onPress: () => block(conv.id) },
  ];
  const reportOptions: SheetOption[] = [
    { label: 'Asked to pay or chat outside REVO', onPress: () => onReport('off_platform') },
    { label: 'Rude or unsafe behavior', onPress: () => onReport('unsafe') },
    { label: 'Not who they say they are', onPress: () => onReport('identity') },
  ];
  function onReport(reason: string) {
    report(conv!.id, reason);
    setNotice('Thanks. The REVO team reviews every report within 24 hours.');
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Row gap={10}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
            <Icon name="chevron-left" size={28} />
          </Pressable>
          <Pressable
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}
            onPress={() => role === 'driver' && router.push(`/revivors/${r.id}`)}
          >
            <Avatar initials={initials} tone={role === 'driver' ? r.avatarTone : colors.navyRoyal} size={40} />
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={styles.headerName} numberOfLines={1}>
                {otherName}
              </Text>
              {role === 'driver' ? <LevelBadge level={levelOf(r)} /> : <Text style={styles.headerSub}>Driver · phone verified</Text>}
            </View>
          </Pressable>
          <Pressable onPress={() => setMenu('main')} hitSlop={10} accessibilityLabel="More options">
            <Icon name="dots-horizontal" size={26} />
          </Pressable>
        </Row>
      </View>

      <ScrollView
        ref={scroll}
        contentContainerStyle={{ padding: space.lg, gap: 10 }}
        onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
      >
        <View style={styles.safety}>
          <Icon name={iShared && theyShared ? 'phone-check-outline' : 'lock-outline'} size={16} color={colors.ink} />
          <Text style={styles.safetyText}>
            {iShared && theyShared
              ? `You both shared numbers. ${otherFirst}: (734) 555-0187`
              : iShared
                ? `You shared your number. It shows once ${otherFirst} shares too.`
                : 'Phone numbers stay hidden until you both choose to share. Pay your Revivor directly, never in advance.'}
          </Text>
        </View>

        {notice ? <Banner icon="flag-checkered" text={notice} /> : null}

        {conv.messages.map((m) => (
          <MessageView
            key={m.id}
            m={m}
            mine={m.kind === 'text' && m.from === role}
            role={role}
            onConfirm={(jobId) => confirmJob(jobId, role)}
          />
        ))}
      </ScrollView>

      {conv.blocked ? (
        <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Text style={[styles.safetyText, { textAlign: 'center', flex: 1 }]}>You blocked {otherFirst}. They can’t message you.</Text>
        </View>
      ) : (
        <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          {!openJob ? (
            <Pressable onPress={() => setSheet(true)} style={styles.didJob}>
              <Icon name="handshake-outline" size={16} color={colors.brick} />
              <Text style={styles.didJobText}>WE DID A JOB</Text>
            </Pressable>
          ) : null}
          <Row gap={10}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={`Message ${otherFirst}`}
              placeholderTextColor={colors.muted}
              style={styles.input}
              onSubmitEditing={onSend}
              returnKeyType="send"
              multiline
            />
            <Pressable onPress={onSend} disabled={!text.trim()} style={[styles.send, !text.trim() && { opacity: 0.4 }]} accessibilityLabel="Send">
              <Icon name="send" size={20} color={colors.cream} />
            </Pressable>
          </Row>
        </View>
      )}

      <ActionSheet visible={menu === 'main'} title={otherName} options={mainOptions} onClose={() => setMenu(null)} />
      <ActionSheet
        visible={menu === 'report'}
        title={`Report ${otherFirst}`}
        message="What happened?"
        options={reportOptions}
        onClose={() => setMenu(null)}
      />

      <MarkJobSheet
        visible={sheet}
        onClose={() => setSheet(false)}
        services={role === 'driver' ? r.listings.map((l) => l.service) : SERVICE_ORDER}
        otherFirst={otherFirst}
        onSubmit={(service, date) => {
          markJob(conv.id, role, service, date);
          setSheet(false);
        }}
      />
    </KeyboardAvoidingView>
  );
}

function MessageView({ m, mine, role, onConfirm }: { m: Message; mine: boolean; role: 'driver' | 'revivor'; onConfirm: (jobId: string) => void }) {
  const job = useStore((s) => (m.kind === 'system' && m.jobId ? s.jobs.find((j) => j.id === m.jobId) : undefined));
  if (m.kind === 'system') {
    const canConfirm = job && job.status === 'awaiting_confirmation' && job.proposedBy !== role && m.text.includes('marked');
    const canReview = job && job.status === 'confirmed' && role === 'driver' && !job.reviewed && m.text.startsWith('Job confirmed');
    return (
      <View style={styles.system}>
        <Row gap={8} style={{ alignItems: 'flex-start' }}>
          <Icon name="handshake-outline" size={18} color={colors.cream} />
          <Text style={styles.systemText}>{m.text}</Text>
        </Row>
        {canConfirm ? (
          <Row gap={8} style={{ marginTop: 10 }}>
            <Button title="Confirm job" variant="cream" small style={{ flex: 1 }} onPress={() => onConfirm(job.id)} />
          </Row>
        ) : null}
        {canReview ? (
          <Button title="Leave a review" variant="primary" icon="star-outline" small style={{ marginTop: 10 }} onPress={() => router.push(`/review/${job.id}`)} />
        ) : null}
      </View>
    );
  }
  return (
    <View style={{ alignItems: mine ? 'flex-end' : 'flex-start' }}>
      <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
        <Text style={[styles.bubbleText, { color: mine ? colors.cream : colors.ink }]}>{m.text}</Text>
      </View>
      <Text style={styles.time}>{fmtTime(m.at)}</Text>
    </View>
  );
}

function MarkJobSheet({
  visible,
  onClose,
  services,
  otherFirst,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  services: ServiceId[];
  otherFirst: string;
  onSubmit: (s: ServiceId, date: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const [service, setService] = useState<ServiceId | null>(null);
  const [dayOffset, setDayOffset] = useState(0);
  const days = [0, 1, 2, 3].map((o) => {
    const d = new Date();
    d.setDate(d.getDate() - o);
    return { o, iso: d.toISOString().slice(0, 10), label: o === 0 ? 'Today' : o === 1 ? 'Yesterday' : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) };
  });
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.grabber} />
        <Text style={styles.sheetTitle}>WE DID A JOB</Text>
        <Text style={styles.sheetSub}>
          {otherFirst} will be asked to confirm. A confirmed job counts on the Revivor’s profile and unlocks one verified review.
        </Text>
        <Label style={{ marginTop: space.lg }}>Service</Label>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
          {services.map((s) => (
            <Chip key={s} label={SERVICES[s].short} selected={service === s} onPress={() => setService(s)} icon={SERVICES[s].icon as never} />
          ))}
        </View>
        <Label style={{ marginTop: space.lg }}>When</Label>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
          {days.map((d) => (
            <Chip key={d.o} label={d.label} selected={dayOffset === d.o} onPress={() => setDayOffset(d.o)} />
          ))}
        </View>
        <Button
          title="Send for confirmation"
          style={{ marginTop: space.xl }}
          disabled={!service}
          onPress={() => {
            if (service) onSubmit(service, days[dayOffset].iso);
            setService(null);
            setDayOffset(0);
          }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.bg,
    paddingHorizontal: space.md,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: colors.ink,
  },
  headerName: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  headerSub: { fontFamily: fonts.medium, fontSize: 12, color: colors.muted },
  safety: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.creamDeep,
    padding: space.md,
    borderRadius: radius.md,
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  safetyText: { flex: 1, fontFamily: fonts.medium, fontSize: 12.5, lineHeight: 17, color: colors.ink },
  bubble: { maxWidth: '82%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  mine: { backgroundColor: colors.ink, borderBottomRightRadius: 6 },
  theirs: { backgroundColor: colors.surface, borderBottomLeftRadius: 6 },
  bubbleText: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21 },
  time: { fontFamily: fonts.medium, fontSize: 10.5, color: colors.muted, marginTop: 3, marginHorizontal: 6 },
  system: { backgroundColor: colors.navy, borderRadius: radius.md, padding: space.md, marginVertical: 4 },
  systemText: { flex: 1, fontFamily: fonts.semibold, fontSize: 13.5, lineHeight: 19, color: colors.cream },
  composer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    backgroundColor: colors.bg,
    paddingHorizontal: space.md,
    paddingTop: 10,
    gap: 10,
  },
  didJob: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderColor: colors.brick,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    height: 30,
  },
  didJobText: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 0.8, color: colors.brick },
  input: {
    flex: 1,
    minHeight: 46,
    maxHeight: 120,
    backgroundColor: colors.white,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: colors.line,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.ink,
  },
  send: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.brick, alignItems: 'center', justifyContent: 'center' },
  backdrop: { flex: 1, backgroundColor: colors.overlay },
  sheet: { backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: space.xl, paddingTop: 10 },
  grabber: { width: 44, height: 5, borderRadius: 3, backgroundColor: colors.line, alignSelf: 'center', marginBottom: space.lg },
  sheetTitle: { fontFamily: fonts.display, fontSize: 18, color: colors.ink },
  sheetSub: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.muted, marginTop: 6 },
});
