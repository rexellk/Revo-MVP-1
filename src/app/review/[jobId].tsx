import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StickyFooter, TopBar } from '../../components/layout';
import { Avatar, Banner, Button, Card, Chip, EmptyState, Field, Icon, Label, Row } from '../../components/ui';
import { SERVICES } from '../../data/mock';
import { fmtLongDate, useStore } from '../../store';
import { colors, fonts, space } from '../../theme';

const TAGS = ['Explained the work', 'On time', 'Price matched chat', 'Clean work', 'No upsell', 'Friendly'];
const RATING_WORDS = ['', 'Poor', 'Below expectations', 'OK', 'Good', 'Excellent'];

export default function ReviewJob() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const job = useStore((s) => s.jobs.find((j) => j.id === jobId));
  const r = useStore((s) => s.revivors.find((x) => x.id === job?.revivorId));
  const submit = useStore((s) => s.submitReview);
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [text, setText] = useState('');

  if (!job || !r) return null;
  const first = r.name.split(' ')[0];

  if (job.status !== 'confirmed' || job.reviewed) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <TopBar title="Review" back hideSwitch />
        <EmptyState
          icon="star-off-outline"
          title={job.reviewed ? 'Already reviewed' : 'Not confirmed yet'}
          body={job.reviewed ? 'Each confirmed job gets one review.' : `Reviews unlock once both you and ${first} confirm the job.`}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TopBar title={`Review ${first}`} hideSwitch right={
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Close">
          <Icon name="close" size={24} />
        </Pressable>
      } />
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
        <Card>
          <Row gap={12}>
            <Avatar initials={r.initials} tone={r.avatarTone} uri={r.photoUri} size={48} />
            <View style={{ flex: 1 }}>
              <Text style={styles.job}>{SERVICES[job.service].name}</Text>
              <Text style={styles.meta}>
                {job.vehicle} · {fmtLongDate(job.date)}
              </Text>
            </View>
            <Icon name="check-decagram" size={22} color={colors.brick} />
          </Row>
        </Card>

        <View style={{ alignItems: 'center', gap: 10 }}>
          <Label>How did {first} do?</Label>
          <Row gap={8}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Pressable key={i} onPress={() => setRating(i)} hitSlop={4} accessibilityLabel={`${i} stars`}>
                <Icon name={i <= rating ? 'star' : 'star-outline'} size={44} color={i <= rating ? colors.brick : colors.ink} />
              </Pressable>
            ))}
          </Row>
          <Text style={styles.word}>{RATING_WORDS[rating] || ' '}</Text>
        </View>

        <View style={{ gap: 10 }}>
          <Label>What stood out?</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {TAGS.map((t) => (
              <Chip key={t} label={t} selected={tags.includes(t)} onPress={() => setTags(tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t])} />
            ))}
          </View>
        </View>

        <Field label="Your review" placeholder={`What should other drivers know about ${first}?`} multiline value={text} onChangeText={setText} />

        <Banner icon="check-decagram" tone="cream" text={`Your review shows on ${first}'s profile with a "Confirmed job" tag, since you both confirmed this job.`} />
      </ScrollView>
      <StickyFooter>
        <Button
          title="Post review"
          disabled={!rating}
          onPress={() => {
            submit(job.id, rating, tags, text.trim());
            router.back();
          }}
        />
      </StickyFooter>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  job: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  meta: { fontFamily: fonts.medium, fontSize: 13, color: colors.muted },
  word: { fontFamily: fonts.bold, fontSize: 14, color: colors.brick, height: 20 },
});
