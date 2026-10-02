import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { TopBar } from '../../components/layout';
import { LevelBadge, StatusPill, CHECK_META } from '../../components/trust';
import { Avatar, Button, Card, Divider, Icon, Label, ListItem, Row } from '../../components/ui';
import { levelOf, ME_ID, sortChecks, useStore } from '../../store';
import { colors, fonts, space } from '../../theme';

export default function RevivorProfile() {
  const me = useStore((s) => s.revivors.find((r) => r.id === ME_ID));
  const signOut = useStore((s) => s.signOut);
  const setRole = useStore((s) => s.setRole);
  if (!me) return null;
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopBar title="Profile" />
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg, paddingBottom: 40 }}>
        <View style={{ alignItems: 'center', gap: 8, paddingVertical: space.md }}>
          <Avatar initials={me.initials} tone={me.avatarTone} uri={me.photoUri} size={92} />
          <Text style={styles.name}>{me.name.toUpperCase()}</Text>
          <Text style={styles.sub}>
            Revivor · {me.area} · {me.yearsExperience} yrs experience
          </Text>
          <LevelBadge level={levelOf(me)} />
        </View>

        <Card style={{ gap: 4 }}>
          <Label>Verification checks</Label>
          {sortChecks(me.verifications).map((v, i) => (
            <View key={i}>
              {i ? <Divider /> : null}
              <Row gap={12} style={{ paddingVertical: 10 }}>
                <Icon name={CHECK_META[v.type].icon} size={20} color={colors.brick} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{CHECK_META[v.type].title}</Text>
                  <Text style={styles.sub}>{v.label}</Text>
                </View>
                <StatusPill status={v.status} />
              </Row>
            </View>
          ))}
          <Row gap={8} style={{ marginTop: 6 }}>
            <Icon name="lock-outline" size={14} color={colors.muted} />
            <Text style={[styles.sub, { flex: 1 }]}>Set by the REVO team. Contact support to add a new certificate.</Text>
          </Row>
        </Card>

        <Card style={{ padding: 0 }}>
          <ListItem icon="account-eye-outline" title="Preview my profile" subtitle="What drivers see" onPress={() => router.push({ pathname: '/revivors/[id]', params: { id: ME_ID, preview: '1' } })} />
          <Divider />
          <ListItem icon="cash" title="Getting paid" subtitle="Drivers pay you directly after the job" />
          <Divider />
          <ListItem icon="cog-outline" title="Settings" onPress={() => {}} />
          <Divider />
          <ListItem
            icon="logout"
            title="Log out"
            danger
            onPress={() => {
              signOut();
              router.replace('/');
            }}
          />
        </Card>

        <Button
          title="Switch to Driver"
          variant="navy"
          icon="car-outline"
          onPress={() => {
            setRole('driver');
            router.replace('/driver');
          }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  name: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  title: { fontFamily: fonts.bold, fontSize: 14.5, color: colors.ink },
  sub: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.muted },
});
