import { router } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TopBar } from '../../components/layout';
import { Avatar, Button, Card, Divider, Label, ListItem } from '../../components/ui';
import { DRIVER } from '../../data/mock';
import { signOutBackend } from '../../lib/auth';
import { enterRevivorSide } from '../../lib/session';
import { useStore } from '../../store';
import { colors, fonts, space } from '../../theme';

export default function DriverProfile() {
  const signOut = useStore((s) => s.signOut);
  const setRole = useStore((s) => s.setRole);
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopBar title="Profile" />
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg, paddingBottom: 40 }}>
        <View style={{ alignItems: 'center', gap: 8, paddingVertical: space.md }}>
          <Avatar initials={DRIVER.initials} tone={colors.navyRoyal} size={92} />
          <Text style={styles.name}>{DRIVER.name.toUpperCase()}</Text>
          <Text style={styles.sub}>Driver · {DRIVER.city}</Text>
        </View>

        <View style={{ gap: space.sm }}>
          <Label>My garage</Label>
          <Card style={{ padding: 0 }}>
            <ListItem icon="car-outline" title="My vehicles" subtitle={DRIVER.vehicle} onPress={() => {}} />
          </Card>
        </View>

        <View style={{ gap: space.sm }}>
          <Label>Safety</Label>
          <Card style={{ padding: 0 }}>
            <ListItem icon="shield-check-outline" title="How REVO verifies Revivors" onPress={() => router.push('/driver')} />
            <Divider />
            <ListItem icon="account-cancel-outline" title="Blocked users" onPress={() => {}} />
          </Card>
        </View>

        <View style={{ gap: space.sm }}>
          <Label>Account</Label>
          <Card style={{ padding: 0 }}>
            <ListItem icon="cog-outline" title="Settings" onPress={() => {}} />
            <Divider />
            <ListItem
              icon="logout"
              title="Log out"
              danger
              onPress={async () => {
                await signOutBackend();
                signOut();
                router.replace('/');
              }}
            />
          </Card>
        </View>

        <Button
          title="Earn as a Revivor"
          variant="navy"
          icon="wrench"
          onPress={async () => {
            setRole('revivor');
            try {
              await enterRevivorSide();
            } catch (e) {
              Alert.alert('Could not open the Revivor side', e instanceof Error ? e.message : 'Try again.');
            }
          }}
        />
        <Text style={styles.version}>VERSION 0.1.0 · MVP1 PROTOTYPE</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  name: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  sub: { fontFamily: fonts.medium, fontSize: 13, color: colors.muted },
  version: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1.2, color: colors.muted, textAlign: 'center' },
});
