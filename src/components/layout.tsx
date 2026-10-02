import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store';
import { colors, fonts, radius, space } from '../theme';
import { Icon, Row, Wordmark, type IconName } from './ui';

export function Screen({
  children,
  scroll = true,
  style,
  contentStyle,
  footer,
}: {
  children: ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  footer?: ReactNode;
}) {
  return (
    <View style={[{ flex: 1, backgroundColor: colors.bg }, style]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[{ padding: space.lg, gap: space.lg, paddingBottom: 40 }, contentStyle]}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, contentStyle]}>{children}</View>
      )}
      {footer}
    </View>
  );
}

/** White top bar used across tabs: title on the left, "Switch to ..." pill on the right (as in the deck mockups). */
export function TopBar({
  title,
  subtitle,
  back,
  showWordmark,
  right,
  hideSwitch,
}: {
  title?: string;
  subtitle?: string;
  back?: boolean;
  showWordmark?: boolean;
  right?: ReactNode;
  hideSwitch?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Row gap={10} style={{ flex: 1 }}>
          {back ? (
            <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
              <Icon name="chevron-left" size={28} />
            </Pressable>
          ) : null}
          {showWordmark ? <Wordmark height={22} /> : null}
          {title ? (
            <View style={{ flex: 1 }}>
              <Text style={styles.title} numberOfLines={1}>
                {title.toUpperCase()}
              </Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
          ) : null}
        </Row>
        {right ?? (hideSwitch ? null : <SwitchPill />)}
      </Row>
    </View>
  );
}

export function SwitchPill() {
  const role = useStore((s) => s.role);
  const setRole = useStore((s) => s.setRole);
  const meOnboarded = useStore((s) => s.meOnboarded);
  const next = role === 'driver' ? 'revivor' : 'driver';
  return (
    <Pressable
      onPress={() => {
        setRole(next);
        if (next === 'driver') router.replace('/driver');
        else router.replace(meOnboarded ? '/revivor' : '/onboarding');
      }}
      style={({ pressed }) => [styles.switch, pressed && { opacity: 0.7 }]}
      accessibilityRole="button"
    >
      <Text style={styles.switchText}>Switch to {next === 'driver' ? 'Driver' : 'Revivor'}</Text>
    </Pressable>
  );
}

const TAB_META: Record<string, { label: string; icon: IconName; iconOn: IconName }> = {
  index: { label: 'Home', icon: 'home-outline', iconOn: 'home' },
  messages: { label: 'Messages', icon: 'message-outline', iconOn: 'message' },
  jobs: { label: 'Jobs', icon: 'wrench-outline', iconOn: 'wrench' },
  profile: { label: 'Profile', icon: 'account-outline', iconOn: 'account' },
};

/** Bottom bar matching the mockups: white, ink top rule, uppercase labels, brick active state. */
export function TabBar({ state, navigation, badges }: BottomTabBarProps & { badges?: Record<string, number> }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {state.routes.map((route, i) => {
        const meta = TAB_META[route.name];
        if (!meta) return null;
        const focused = state.index === i;
        const color = focused ? colors.brick : colors.muted;
        const badge = badges?.[route.name] ?? 0;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            onPress={() => {
              const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !e.defaultPrevented) navigation.navigate(route.name);
            }}
            style={styles.tab}
          >
            <View>
              <Icon name={focused ? meta.iconOn : meta.icon} size={24} color={color} />
              {badge ? (
                <View style={styles.dot}>
                  <Text style={styles.dotText}>{badge}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.tabLabel, { color }]}>{meta.label.toUpperCase()}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function StickyFooter({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>{children}</View>;
}

const styles = StyleSheet.create({
  topBar: {
    backgroundColor: colors.bg,
    paddingHorizontal: space.lg,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  title: { fontFamily: fonts.display, fontSize: 17, color: colors.ink, letterSpacing: 0.5 },
  subtitle: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.muted, marginTop: 2 },
  switch: { backgroundColor: colors.creamDeep, paddingHorizontal: 12, height: 28, borderRadius: radius.pill, justifyContent: 'center' },
  switchText: { fontFamily: fonts.semibold, fontSize: 11.5, color: colors.muted },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.bg,
    borderTopWidth: 2,
    borderTopColor: colors.ink,
    paddingTop: 10,
  },
  tab: { flex: 1, alignItems: 'center', gap: 4 },
  tabLabel: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 0.8 },
  dot: {
    position: 'absolute',
    top: -4,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.brick,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  dotText: { fontFamily: fonts.bold, fontSize: 10, color: colors.cream },
  footer: {
    backgroundColor: colors.bg,
    paddingHorizontal: space.lg,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
});
