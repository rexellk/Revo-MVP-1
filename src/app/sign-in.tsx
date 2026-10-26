import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { StickyFooter, TopBar } from '../components/layout';
import { Banner, Body, Button, Display, Field, MarkTile, Row } from '../components/ui';
import type { Role } from '../data/types';
import { AUTH_MODE, currentPhone, DEMO_CODE, sendCode, toE164, verifyCode } from '../lib/auth';
import { enterRevivorSide } from '../lib/session';
import { useStore } from '../store';
import { colors, fonts, space } from '../theme';

// Supabase limits code requests to about one a minute per number; 30s keeps taps from erroring.
const RESEND_SECONDS = 30;
const RESTORE_TIMEOUT_MS = 6000;

export default function SignIn() {
  const { role = 'driver' } = useLocalSearchParams<{ role?: Role }>();
  const signIn = useStore((s) => s.signIn);
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(true);
  const [cooldown, setCooldown] = useState(0); // seconds until "Resend code" is allowed

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const digits = phone.replace(/\D/g, '');
  const phoneOk = digits.length === 10;
  const codeOk = code.replace(/\D/g, '').length === 6;

  const formatted = digits.length === 10 ? `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}` : phone;

  // After the phone is verified: drivers go to Browse; Revivors are routed from Supabase data.
  async function finish(e164: string) {
    signIn(role, e164);
    if (role === 'driver') router.replace('/driver');
    else await enterRevivorSide();
  }

  // Still signed in from last time (the session is kept on the device): skip the code.
  // On a bad connection the check can hang, so after RESTORE_TIMEOUT_MS show the phone screen instead.
  useEffect(() => {
    let settled = false;
    const giveUp = setTimeout(() => {
      settled = true;
      setRestoring(false);
    }, RESTORE_TIMEOUT_MS);
    currentPhone()
      .then(async (p) => {
        if (!settled && p) await finish(p);
      })
      .catch(() => {})
      .finally(() => {
        clearTimeout(giveUp);
        if (!settled) setRestoring(false);
        settled = true;
      });
    return () => {
      settled = true;
      clearTimeout(giveUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function next() {
    setLoading(true);
    try {
      if (step === 'phone') {
        await sendCode(toE164(digits));
        setStep('code');
        setCooldown(RESEND_SECONDS);
      } else {
        await verifyCode(toE164(digits), code.replace(/\D/g, ''));
        await finish(toE164(digits));
      }
    } catch (e) {
      Alert.alert(step === 'phone' ? 'Could not send the code' : 'Could not sign in', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    try {
      await sendCode(toE164(digits));
      setCode('');
      setCooldown(RESEND_SECONDS);
      Alert.alert('Code sent', AUTH_MODE === 'demo' ? `Prototype: no text is sent. The code is ${DEMO_CODE}.` : `We sent a new code to +1 ${formatted}.`);
    } catch (e) {
      Alert.alert('Could not resend the code', e instanceof Error ? e.message : 'Try again in a minute.');
    }
  }

  if (restoring) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.brick} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TopBar back hideSwitch title={role === 'driver' ? 'Sign in' : 'Revivor sign in'} />
      <View style={{ flex: 1, padding: space.lg, gap: space.xl }}>
        <MarkTile size={88} />
        {step === 'phone' ? (
          <>
            <View style={{ gap: 8 }}>
              <Display>WHAT’S YOUR NUMBER?</Display>
              <Body muted>
                {role === 'driver'
                  ? 'We text you a code. Your number stays hidden from Revivors unless you choose to share it.'
                  : 'We text you a code. Drivers never see your number unless you choose to share it.'}
              </Body>
            </View>
            <Field
              label="Mobile number"
              placeholder="(734) 555-0142"
              keyboardType="phone-pad"
              value={formatted}
              onChangeText={(t) => setPhone(t.replace(/\D/g, '').slice(0, 10))}
              autoFocus
            />
          </>
        ) : (
          <>
            <View style={{ gap: 8 }}>
              <Display>ENTER THE CODE</Display>
              <Body muted>
                Sent to <Text style={{ fontFamily: fonts.bold, color: colors.ink }}>+1 {formatted}</Text>
              </Body>
            </View>
            <Field
              label="6-digit code"
              placeholder="000000"
              keyboardType="number-pad"
              value={code}
              onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
              autoFocus
              maxLength={6}
            />
            <Banner
              icon="information-outline"
              tone="cream"
              text={AUTH_MODE === 'demo' ? `Prototype: no text is sent. The code is ${DEMO_CODE}.` : 'Codes can take up to a minute to arrive.'}
            />
            <Row style={{ justifyContent: 'space-between' }}>
              <Pressable onPress={resend} disabled={cooldown > 0} hitSlop={8} accessibilityRole="button">
                <Text style={[styles.link, cooldown > 0 && { color: colors.muted }]}>
                  {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setStep('phone');
                  setCode('');
                }}
                hitSlop={8}
                accessibilityRole="button"
              >
                <Text style={styles.link}>Change number</Text>
              </Pressable>
            </Row>
          </>
        )}
      </View>
      <StickyFooter>
        <Button
          title={step === 'phone' ? 'Send code' : 'Verify'}
          disabled={step === 'phone' ? !phoneOk : !codeOk}
          loading={loading}
          onPress={next}
        />
      </StickyFooter>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  link: { fontFamily: fonts.bold, fontSize: 14, color: colors.brick },
});
