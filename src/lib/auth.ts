import { supabase } from './supabase';

// Phone login. One flow for everyone: a new number signs up, a known number signs in.
//
// EXPO_PUBLIC_AUTH_MODE=demo (default until an SMS provider is set up): no text is sent and the
// code is always 123456. DEMO ONLY: anyone who knows a phone number can sign in as it.
// Each phone number maps to its own Supabase account, so the same number always gets the same
// account on any device. Needs "Confirm email" turned off in Supabase (no emails are ever sent).
//
// EXPO_PUBLIC_AUTH_MODE=sms: real SMS codes through Supabase phone OTP (Twilio in the dashboard).

export const AUTH_MODE: 'demo' | 'sms' = process.env.EXPO_PUBLIC_AUTH_MODE === 'sms' ? 'sms' : 'demo';
export const DEMO_CODE = '123456';

// Placeholder address per phone number. Never emailed, because confirmations are off.
const demoEmail = (phone: string) => `${phone.replace(/\D/g, '')}@phone.revo-mvp1.app`;
const demoPassword = (phone: string) => `revo-demo-${phone.replace(/\D/g, '')}`;

/** "7345550142" -> "+17345550142". MVP1 is US-only. */
export const toE164 = (tenDigits: string) => `+1${tenDigits}`;

export async function sendCode(phone: string): Promise<void> {
  if (AUTH_MODE === 'demo') return;
  const { error } = await supabase.auth.signInWithOtp({ phone });
  if (error) throw new Error(error.message);
}

export async function verifyCode(phone: string, token: string): Promise<void> {
  if (AUTH_MODE === 'sms') {
    const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
    if (error || !data.session) throw new Error(error?.message ?? 'That code did not work. Try again.');
    return;
  }

  if (token !== DEMO_CODE) throw new Error(`That code did not work. In this prototype the code is ${DEMO_CODE}.`);
  const email = demoEmail(phone);
  const password = demoPassword(phone);
  const signIn = await supabase.auth.signInWithPassword({ email, password });
  if (!signIn.error) return;
  if (signIn.error.code !== 'invalid_credentials') throw new Error(signIn.error.message);

  // First time for this number: create its account.
  const signUp = await supabase.auth.signUp({ email, password, options: { data: { phone } } });
  if (signUp.error) throw new Error(signUp.error.message);
  if (!signUp.data.session) throw new Error('Sign-up needs "Confirm email" turned off in Supabase (Authentication > Sign In / Providers > Email).');
}

/** Phone of the signed-in user (E.164), or null when nobody is signed in. */
export async function currentPhone(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user || user.is_anonymous) return null;
  const phone = user.phone || (user.user_metadata?.phone as string | undefined);
  return phone ? `+${phone.replace(/^\+/, '')}` : null;
}

export async function signOutBackend(): Promise<void> {
  await supabase.auth.signOut();
}
