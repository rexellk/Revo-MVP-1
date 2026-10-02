import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type LayoutChangeEvent,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { colors, fonts, gradient, radius, shadow, space } from '../theme';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export function Icon({ name, size = 20, color = colors.ink }: { name: IconName; size?: number; color?: string }) {
  return <MaterialCommunityIcons name={name} size={size} color={color} />;
}

// ---------- Type ----------

export function Display({ children, style, onNavy }: { children: ReactNode; style?: StyleProp<TextStyle>; onNavy?: boolean }) {
  return <Text style={[styles.display, { color: onNavy ? colors.cream : colors.ink }, style]}>{children}</Text>;
}

export function Heading({ children, style, onNavy }: { children: ReactNode; style?: StyleProp<TextStyle>; onNavy?: boolean }) {
  return <Text style={[styles.heading, { color: onNavy ? colors.cream : colors.ink }, style]}>{children}</Text>;
}

/** Small uppercase tracked label, like "CONFIRMED BOOKING" in the deck mockups. */
export function Label({ children, style, onNavy }: { children: ReactNode; style?: StyleProp<TextStyle>; onNavy?: boolean }) {
  return <Text style={[styles.label, { color: onNavy ? colors.mutedOnNavy : colors.muted }, style]}>{children}</Text>;
}

export function Body({
  children,
  style,
  muted,
  onNavy,
  numberOfLines,
}: {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
  muted?: boolean;
  onNavy?: boolean;
  numberOfLines?: number;
}) {
  const color = onNavy ? (muted ? colors.mutedOnNavy : colors.cream) : muted ? colors.muted : colors.ink;
  return (
    <Text numberOfLines={numberOfLines} style={[styles.body, { color }, style]}>
      {children}
    </Text>
  );
}

// ---------- Brand ----------

const wordmark = require('../../assets/brand/wordmark-cream.png');
const mark = require('../../assets/brand/mark.png');
const WORDMARK_RATIO = 1156 / 209;
const MARK_RATIO = 256 / 267;

export function Wordmark({ height = 22, color = colors.ink }: { height?: number; color?: string }) {
  return (
    <Image
      source={wordmark}
      style={{ height, width: height * WORDMARK_RATIO, tintColor: color }}
      resizeMode="contain"
      accessibilityLabel="REVO"
    />
  );
}

/** The REVO tag + R mark. Only ever placed on cream, as in the deck. */
export function Mark({ size = 40 }: { size?: number }) {
  return <Image source={mark} style={{ height: size, width: size * MARK_RATIO }} resizeMode="contain" accessibilityLabel="REVO logo" />;
}

export function MarkTile({ size = 120 }: { size?: number }) {
  return (
    <View style={[styles.markTile, { width: size, height: size, borderRadius: size * 0.2 }]}>
      <Mark size={size * 0.52} />
    </View>
  );
}

export function NavyGradient({ children, style }: { children?: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <LinearGradient colors={gradient.navy} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={style}>
      {children}
    </LinearGradient>
  );
}

// ---------- Controls ----------

type ButtonVariant = 'primary' | 'navy' | 'outline' | 'cream' | 'ghost';

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  loading,
  style,
  small,
}: {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  small?: boolean;
}) {
  const v = buttonVariants[variant];
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        { backgroundColor: v.bg, borderColor: v.border },
        (disabled || loading) && { opacity: 0.45 },
        pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={small ? 16 : 18} color={v.fg} /> : null}
          <Text style={[styles.buttonText, small && { fontSize: 12 }, { color: v.fg }]}>{title.toUpperCase()}</Text>
        </>
      )}
    </Pressable>
  );
}

const buttonVariants: Record<ButtonVariant, { bg: string; fg: string; border: string }> = {
  primary: { bg: colors.brick, fg: colors.cream, border: colors.brick },
  navy: { bg: colors.ink, fg: colors.cream, border: colors.ink },
  outline: { bg: 'transparent', fg: colors.ink, border: colors.ink },
  cream: { bg: colors.cream, fg: colors.ink, border: colors.cream },
  ghost: { bg: 'transparent', fg: colors.brick, border: 'transparent' },
};

export function Chip({
  label,
  selected,
  onPress,
  icon,
  style,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.chip, selected ? styles.chipOn : styles.chipOff, style]}
    >
      {icon ? <Icon name={icon} size={14} color={selected ? colors.cream : colors.ink} /> : null}
      <Text style={[styles.chipText, { color: selected ? colors.cream : colors.ink }]}>{label.toUpperCase()}</Text>
    </Pressable>
  );
}

export function Field({
  label,
  hint,
  style,
  ...props
}: TextInputProps & { label?: string; hint?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ gap: 6 }, style]}>
      {label ? <Label>{label}</Label> : null}
      <TextInput
        placeholderTextColor={colors.placeholder}
        {...props}
        style={[styles.input, props.multiline && { minHeight: 96, textAlignVertical: 'top', paddingTop: 12 }]}
      />
      {hint ? <Body muted style={{ fontSize: 12 }}>{hint}</Body> : null}
    </View>
  );
}

// ---------- Surfaces ----------

export function Card({
  children,
  style,
  onPress,
  onLayout,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  onLayout?: (e: LayoutChangeEvent) => void;
}) {
  if (onPress)
    return (
      <Pressable onLayout={onLayout} onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }, style]}>
        {children}
      </Pressable>
    );
  return (
    <View onLayout={onLayout} style={[styles.card, style]}>
      {children}
    </View>
  );
}

/** Navy card, like "Verification Status" and "Confirmed Booking" in the mockups. */
export function NavyCard({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.navyCard, style]}>{children}</View>;
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: colors.line }, style]} />;
}

export function Row({ children, style, gap = 8 }: { children: ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <Row style={{ justifyContent: 'space-between', marginBottom: space.sm }}>
      <Label>{title}</Label>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.link}>{action}</Text>
        </Pressable>
      ) : null}
    </Row>
  );
}

export function ListItem({
  icon,
  title,
  subtitle,
  onPress,
  right,
  danger,
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  right?: ReactNode;
  danger?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.listItem, pressed && { backgroundColor: colors.creamSoft }]}>
      <Icon name={icon} size={20} color={danger ? colors.brick : colors.ink} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.listTitle, danger && { color: colors.brick }]}>{title}</Text>
        {subtitle ? <Body muted style={{ fontSize: 12 }}>{subtitle}</Body> : null}
      </View>
      {right ?? (onPress && !danger ? <Icon name="chevron-right" size={20} color={colors.muted} /> : null)}
    </Pressable>
  );
}

// ---------- People ----------

export function Avatar({ initials, tone, size = 56, uri, ring }: { initials: string; tone: string; size?: number; uri?: string; ring?: boolean }) {
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: tone,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        },
        ring && { borderWidth: 3, borderColor: colors.cream },
      ]}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size }} />
      ) : (
        <Text style={{ fontFamily: fonts.display, color: colors.cream, fontSize: size * 0.3 }}>{initials}</Text>
      )}
    </View>
  );
}

export function Stars({ value, size = 14, color = colors.ink }: { value: number; size?: number; color?: string }) {
  return (
    <Row gap={1}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon key={i} name={value >= i - 0.25 ? 'star' : value >= i - 0.75 ? 'star-half-full' : 'star-outline'} size={size} color={color} />
      ))}
    </Row>
  );
}

export function EmptyState({ icon, title, body, children }: { icon: IconName; title: string; body: string; children?: ReactNode }) {
  return (
    <View style={{ alignItems: 'center', padding: space.xxl, gap: space.sm }}>
      <View style={styles.emptyIcon}>
        <Icon name={icon} size={28} color={colors.cream} />
      </View>
      <Heading style={{ textAlign: 'center' }}>{title}</Heading>
      <Body muted style={{ textAlign: 'center' }}>
        {body}
      </Body>
      {children}
    </View>
  );
}

export function Banner({ icon, text, tone = 'navy' }: { icon: IconName; text: string; tone?: 'navy' | 'brick' | 'cream' }) {
  const bg = tone === 'navy' ? colors.navy : tone === 'brick' ? colors.brick : colors.creamDeep;
  const fg = tone === 'cream' ? colors.ink : colors.cream;
  return (
    <Row style={{ backgroundColor: bg, padding: space.md, borderRadius: radius.md }} gap={10}>
      <Icon name={icon} size={18} color={fg} />
      <Text style={{ flex: 1, color: fg, fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 }}>{text}</Text>
    </Row>
  );
}

export const styles = StyleSheet.create({
  display: { fontFamily: fonts.display, fontSize: 22, letterSpacing: 0.5, lineHeight: 30 },
  heading: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 24 },
  label: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase' },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21 },
  link: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 0.8, color: colors.brick, textTransform: 'uppercase' },
  markTile: { backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' },
  button: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 2,
    paddingHorizontal: space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonSmall: { minHeight: 38, paddingHorizontal: space.md, borderRadius: radius.sm },
  buttonText: { fontFamily: fonts.display, fontSize: 13, letterSpacing: 1 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 34,
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
  chipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipOff: { backgroundColor: 'transparent', borderColor: colors.ink },
  chipText: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 0.8 },
  input: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.line,
    paddingHorizontal: 14,
    minHeight: 50,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.ink,
  },
  card: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: space.lg, ...shadow.card },
  navyCard: { backgroundColor: colors.navy, borderRadius: radius.lg, padding: space.lg },
  listItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: space.lg },
  listTitle: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.sm,
  },
});
