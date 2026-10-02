import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Body, Button, Icon, MarkTile, NavyGradient, Row, Wordmark } from '../components/ui';
import { colors, fonts, space } from '../theme';

const mechanic = require('../../assets/brand/mechanic.png');

export default function Welcome() {
  const insets = useSafeAreaInsets();
  return (
    <NavyGradient style={{ flex: 1 }}>
      <StatusBar style="light" />
      <View style={[styles.wrap, { paddingTop: insets.top + 24, paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={{ alignItems: 'center', gap: 22 }}>
          <Wordmark height={40} color={colors.cream} />
          <MarkTile size={104} />
        </View>

        <View style={{ gap: 12 }}>
          <Text style={styles.headline}>VERIFIED MECHANICS WHO COME TO YOU</Text>
          <Body onNavy muted style={{ textAlign: 'center', fontSize: 15.5 }}>
            Every Revivor is ID-checked by the REVO team before they appear in your search.
          </Body>
        </View>

        <View style={styles.illo}>
          <Image source={mechanic} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        </View>

        <View style={{ gap: 12 }}>
          <Button title="Find a Revivor" variant="cream" onPress={() => router.push({ pathname: '/sign-in', params: { role: 'driver' } })} />
          <Button title="I'm a mechanic" variant="primary" icon="wrench" onPress={() => router.push({ pathname: '/sign-in', params: { role: 'revivor' } })} />
          <Pressable onPress={() => router.push({ pathname: '/sign-in', params: { role: 'driver' } })} hitSlop={8}>
            <Row gap={6} style={{ justifyContent: 'center', marginTop: 4 }}>
              <Icon name="shield-check-outline" size={14} color={colors.mutedOnNavy} />
              <Text style={styles.fine}>Chat in the app. Pay your Revivor directly.</Text>
            </Row>
          </Pressable>
        </View>
      </View>
    </NavyGradient>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: space.xl, justifyContent: 'space-between', gap: space.lg, maxWidth: 520, width: '100%', alignSelf: 'center' },
  headline: { fontFamily: fonts.display, fontSize: 24, lineHeight: 32, color: colors.cream, textAlign: 'center', letterSpacing: 0.5 },
  illo: { aspectRatio: 674 / 361, maxHeight: 200, alignSelf: 'center', width: '100%', borderRadius: 20, overflow: 'hidden', backgroundColor: '#151A45' },
  fine: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.mutedOnNavy },
});
