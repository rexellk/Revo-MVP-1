import { useRef } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, space } from '../theme';
import { Icon, type IconName } from './ui';

export interface SheetOption {
  label: string;
  icon?: IconName;
  destructive?: boolean;
  onPress: () => void;
}

/** Brand-styled action sheet. Used instead of Alert so it works the same on iOS, Android and web. */
export function ActionSheet({
  visible,
  title,
  message,
  options,
  onClose,
}: {
  visible: boolean;
  title?: string;
  message?: string;
  options: SheetOption[];
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  // iOS can't present another screen (image picker, next sheet) while this modal is still
  // closing, so the chosen action waits for onDismiss there. Elsewhere it runs right away.
  const pending = useRef<(() => void) | null>(null);
  const runPending = () => {
    const fn = pending.current;
    pending.current = null;
    fn?.();
  };
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} onDismiss={runPending}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {title ? <Text style={styles.title}>{title.toUpperCase()}</Text> : null}
        {message ? <Text style={styles.message}>{message}</Text> : null}
        <View style={styles.group}>
          {options.map((o, i) => (
            <Pressable
              key={o.label}
              onPress={() => {
                pending.current = o.onPress;
                onClose();
                if (Platform.OS !== 'ios') runPending();
              }}
              style={({ pressed }) => [styles.option, i > 0 && styles.sep, pressed && { backgroundColor: colors.creamSoft }]}
            >
              {o.icon ? <Icon name={o.icon} size={20} color={o.destructive ? colors.brick : colors.ink} /> : null}
              <Text style={[styles.optionText, o.destructive && { color: colors.brick }]}>{o.label}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable onPress={onClose} style={({ pressed }) => [styles.cancel, pressed && { opacity: 0.8 }]}>
          <Text style={styles.cancelText}>CANCEL</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay },
  sheet: { backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: space.lg, gap: space.md },
  title: { fontFamily: fonts.display, fontSize: 15, color: colors.ink, textAlign: 'center', marginTop: 6 },
  message: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 20 },
  group: { backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden' },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: space.lg, paddingVertical: 16 },
  sep: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  optionText: { fontFamily: fonts.semibold, fontSize: 15.5, color: colors.ink },
  cancel: { backgroundColor: colors.ink, borderRadius: radius.md, height: 52, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontFamily: fonts.display, fontSize: 13, letterSpacing: 1, color: colors.cream },
});
