import { router } from 'expo-router';
import { useStore } from '../store';
import { fetchMyRevivor } from './verification';

/**
 * Sends a signed-in user to the Revivor side based on Supabase, not app memory:
 * no profile -> onboarding; profile -> Dashboard (which shows in review / verified / rejected).
 */
export async function enterRevivorSide(): Promise<void> {
  const mine = await fetchMyRevivor();
  if (mine) {
    useStore.getState().hydrateMe(mine);
    router.replace('/revivor');
  } else {
    router.replace('/onboarding');
  }
}
