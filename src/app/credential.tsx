import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { StickyFooter, TopBar } from '../components/layout';
import { Banner, Button, Card, Icon, Label, Row } from '../components/ui';
import { fmtLongDate, useStore } from '../store';
import { colors, fonts, radius, space } from '../theme';

export default function Credential() {
  const { revivorId, index } = useLocalSearchParams<{ revivorId: string; index: string }>();
  const r = useStore((s) => s.revivors.find((x) => x.id === revivorId));
  const v = r?.verifications[Number(index)];
  if (!r || !v) return null;
  const first = r.name.split(' ')[0];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopBar title="Credential" subtitle={r.name} hideSwitch right={null} />
      <View style={{ padding: space.lg, gap: space.lg, flex: 1 }}>
        <Card style={{ gap: space.md, alignItems: 'center', paddingVertical: space.xxl }}>
          <View style={styles.doc}>
            <Icon name="certificate" size={44} color={colors.brick} />
            <View style={styles.line} />
            <View style={[styles.line, { width: '60%' }]} />
            <View style={[styles.line, { width: '75%' }]} />
          </View>
          <Text style={styles.title}>{v.label}</Text>
          <Row gap={6}>
            <Icon name="file-pdf-box" size={16} color={colors.muted} />
            <Text style={styles.meta}>{v.documentName}</Text>
          </Row>
        </Card>

        <Card style={{ gap: 10 }}>
          <Label>Verification record</Label>
          <Row gap={10}>
            <Icon name="check-decagram" size={20} color={colors.ink} />
            <Text style={styles.row}>Status: verified</Text>
          </Row>
          <Row gap={10}>
            <Icon name="account-check-outline" size={20} color={colors.ink} />
            <Text style={styles.row}>Checked by {v.verifiedBy}</Text>
          </Row>
          {v.verifiedAt ? (
            <Row gap={10}>
              <Icon name="calendar-outline" size={20} color={colors.ink} />
              <Text style={styles.row}>{fmtLongDate(v.verifiedAt)}</Text>
            </Row>
          ) : null}
        </Card>

        <Banner
          icon="information-outline"
          tone="cream"
          text={`The REVO team reviewed the original document and matched the name on it to ${first}'s verified ID.`}
        />
      </View>
      <StickyFooter>
        <Button title="Done" variant="navy" onPress={() => router.back()} />
      </StickyFooter>
    </View>
  );
}

const styles = StyleSheet.create({
  doc: {
    width: 150,
    height: 190,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: colors.creamSoft,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 16,
  },
  line: { height: 6, width: '85%', borderRadius: 3, backgroundColor: colors.line },
  title: { fontFamily: fonts.bold, fontSize: 17, color: colors.ink, textAlign: 'center' },
  meta: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.muted },
  row: { fontFamily: fonts.medium, fontSize: 14.5, color: colors.ink },
});
