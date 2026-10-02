import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { StickyFooter, TopBar } from '../../components/layout';
import { StepHeader } from '../../components/onboarding';
import { CHECK_META, StatusPill } from '../../components/trust';
import { Button, Card, Divider, Icon, Label, Row } from '../../components/ui';
import { ME_ID, sortChecks, useStore } from '../../store';
import { colors, fonts, space } from '../../theme';

export default function Submitted() {
  const me = useStore((s) => s.revivors.find((r) => r.id === ME_ID));
  if (!me) return null;
  const checks = sortChecks(me.verifications);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopBar title="Become a Revivor" hideSwitch />
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.xl, paddingBottom: 40 }}>
        <StepHeader
          step={3}
          total={3}
          title="YOU'RE IN THE QUEUE"
          body="The REVO team reviews new Revivors within 2 business days. You show up in driver search as soon as your ID is verified."
        />
        <Card style={{ gap: 4 }}>
          <Label>Your checks</Label>
          {checks.map((v, i) => (
            <View key={i}>
              {i ? <Divider /> : null}
              <Row gap={12} style={{ paddingVertical: 12 }}>
                <Icon name={CHECK_META[v.type].icon} size={22} color={colors.brick} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{CHECK_META[v.type].title}</Text>
                  <Text style={styles.sub}>{v.label}</Text>
                </View>
                <StatusPill status={v.status} />
              </Row>
            </View>
          ))}
        </Card>
        <Card style={{ gap: 10 }}>
          <Label>While you wait</Label>
          {[
            ['tag-outline', 'Set prices for the services you offer.'],
            ['account-eye-outline', 'Preview your profile the way drivers see it.'],
            ['bell-outline', "We'll notify you the moment you're verified."],
          ].map(([icon, t]) => (
            <Row key={t} gap={10}>
              <Icon name={icon as never} size={18} color={colors.ink} />
              <Text style={[styles.sub, { color: colors.ink, fontSize: 14, flex: 1 }]}>{t}</Text>
            </Row>
          ))}
        </Card>
      </ScrollView>
      <StickyFooter>
        <Button title="Go to my dashboard" onPress={() => router.replace('/revivor')} />
      </StickyFooter>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  sub: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.muted },
});
