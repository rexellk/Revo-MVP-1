import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { StickyFooter, TopBar } from '../components/layout';
import { Banner, Body, Button, Display, Field, MarkTile } from '../components/ui';
import type { Role } from '../data/types';
import { useStore } from '../store';
import { colors, fonts, space } from '../theme';

export default function SignIn() {
  const { role = 'driver' } = useLocalSearchParams<{ role?: Role }>();
  const signIn = useStore((s) => s.signIn);
  const meOnboarded = useStore((s) => s.meOnboarded);
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const digits = phone.replace(/\D/g, '');
  const phoneOk = digits.length === 10;
  const codeOk = code.replace(/\D/g, '').length === 6;

  const formatted = digits.length === 10 ? `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}` : phone;

  function next() {
    if (step === 'phone') {
      setLoading(true);
      // Supabase: supabase.auth.signInWithOtp({ phone: '+1' + digits })
      setTimeout(() => {
        setLoading(false);
        setStep('code');
      }, 500);
      return;
    }
    setLoading(true);
    // Supabase: supabase.auth.verifyOtp({ phone, token: code, type: 'sms' })
    setTimeout(() => {
      setLoading(false);
      signIn(role);
      if (role === 'driver') router.replace('/driver');
      else router.replace(meOnboarded ? '/revivor' : '/onboarding');
    }, 500);
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
            <Banner icon="information-outline" tone="cream" text="Prototype: any 6 digits will work." />
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
