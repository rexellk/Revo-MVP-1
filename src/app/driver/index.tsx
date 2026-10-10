import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { TopBar } from '../../components/layout';
import { RevivorCard } from '../../components/trust';
import { Chip, Icon, Label, NavyCard, Row, type IconName } from '../../components/ui';
import { DRIVER, SERVICES, SERVICE_ORDER } from '../../data/mock';
import { isSearchable, ratingOf, useStore } from '../../store';
import { colors, fonts, radius, space } from '../../theme';

type Sort = 'recommended' | 'nearest' | 'price';
const SORT_LABEL: Record<Sort, string> = { recommended: 'Recommended', nearest: 'Nearest', price: 'Lowest price' };

export default function Browse() {
  const revivors = useStore((s) => s.revivors);
  const reviews = useStore((s) => s.reviews);
  const service = useStore((s) => s.selectedService);
  const setService = useStore((s) => s.setSelectedService);
  const [query, setQuery] = useState('');
  const [thisWeek, setThisWeek] = useState(false);
  const [sort, setSort] = useState<Sort>('recommended');
  const [showExplainer, setShowExplainer] = useState(true);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const minPrice = (id: string) => {
      const r = revivors.find((x) => x.id === id)!;
      const l = service ? r.listings.find((x) => x.service === service) : r.listings[0];
      return l ? l.priceMin : Infinity;
    };
    return revivors
      .filter(isSearchable) // unverified Revivors never show up
      .filter((r) => (service ? r.listings.some((l) => l.service === service) : true))
      .filter((r) => (thisWeek ? r.availability === 'this_week' : true))
      .filter((r) =>
        q
          ? r.name.toLowerCase().includes(q) ||
            r.listings.some((l) => SERVICES[l.service].name.toLowerCase().includes(q)) ||
            r.verifications.some((v) => v.label.toLowerCase().includes(q))
          : true,
      )
      .sort((a, b) => {
        if (sort === 'nearest') return a.distanceMiles - b.distanceMiles;
        if (sort === 'price') return minPrice(a.id) - minPrice(b.id);
        const ra = ratingOf(reviews, a.id);
        const rb = ratingOf(reviews, b.id);
        return rb.avg * Math.log(rb.count + 1) - ra.avg * Math.log(ra.count + 1);
      });
  }, [revivors, reviews, service, query, thisWeek, sort]);

  const cycleSort = () => setSort((s) => (s === 'recommended' ? 'nearest' : s === 'nearest' ? 'price' : 'recommended'));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopBar showWordmark />
      <FlatList
        data={list}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: 32 }}
        ListHeaderComponent={
          <View style={{ gap: space.md, marginBottom: space.xs }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text style={styles.hello}>Hi {DRIVER.firstName}</Text>
              <Row gap={6} style={styles.car}>
                <Icon name="car-outline" size={16} />
                <Text style={styles.carText}>{DRIVER.vehicle}</Text>
              </Row>
            </Row>

            <Row style={styles.search} gap={10}>
              <Icon name="magnify" size={20} color={colors.muted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="What service do you need?"
                placeholderTextColor={colors.muted}
                style={styles.searchInput}
                returnKeyType="search"
              />
              {query ? (
                <Pressable onPress={() => setQuery('')} hitSlop={8}>
                  <Icon name="close-circle" size={18} color={colors.muted} />
                </Pressable>
              ) : null}
            </Row>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              <ServiceTile label="All" icon="view-grid-outline" on={service === null} onPress={() => setService(null)} />
              {SERVICE_ORDER.map((id) => (
                <ServiceTile key={id} label={SERVICES[id].short} icon={SERVICES[id].icon} on={service === id} onPress={() => setService(id)} />
              ))}
            </ScrollView>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              <Chip label="Within a week" selected={thisWeek} onPress={() => setThisWeek(!thisWeek)} />
              <Chip label="Flexible" selected={!thisWeek} onPress={() => setThisWeek(false)} />
            </ScrollView>

            {showExplainer ? <Explainer onClose={() => setShowExplainer(false)} /> : null}

            <Row style={{ justifyContent: 'space-between', marginTop: 4 }}>
              <Label>
                {list.length} verified Revivor{list.length === 1 ? '' : 's'} near Ann Arbor
              </Label>
              <Pressable onPress={cycleSort} hitSlop={8}>
                <Row gap={4}>
                  <Text style={styles.sort}>Sorted by: {SORT_LABEL[sort]}</Text>
                  <Icon name="swap-vertical" size={14} color={colors.muted} />
                </Row>
              </Pressable>
            </Row>
          </View>
        }
        renderItem={({ item }) => (
          <RevivorCard r={item} reviews={reviews} service={service} onPress={() => router.push(`/revivors/${item.id}`)} />
        )}
        ListEmptyComponent={
          <View style={{ padding: space.xl, alignItems: 'center', gap: 8 }}>
            <Icon name="account-search-outline" size={32} color={colors.muted} />
            <Text style={styles.sort}>No verified Revivors match these filters yet.</Text>
          </View>
        }
      />
    </View>
  );
}

function ServiceTile({ label, icon, on, onPress }: { label: string; icon: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.tile, on && styles.tileOn]} accessibilityRole="button" accessibilityState={{ selected: on }}>
      <Icon name={icon as never} size={22} color={on ? colors.cream : colors.ink} />
      <Text style={[styles.tileText, on && { color: colors.cream }]}>{label}</Text>
    </Pressable>
  );
}

const EXPLAINER_CHECKS: [IconName, string, string][] = [
  ['card-account-details-outline', 'ID VERIFIED', 'Government ID matched to a selfie'],
  ['certificate-outline', 'ASE CERTIFIED', 'ASE certificate reviewed by the REVO team'],
];

function Explainer({ onClose }: { onClose: () => void }) {
  return (
    <NavyCard style={{ gap: 12 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Row gap={8}>
          <Icon name="shield-check" size={18} color={colors.cream} />
          <Text style={styles.explTitle}>EVERY REVIVOR IS VERIFIED</Text>
        </Row>
        <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Dismiss">
          <Icon name="close" size={18} color={colors.mutedOnNavy} />
        </Pressable>
      </Row>
      {EXPLAINER_CHECKS.map(([icon, title, detail]) => (
        <Row key={title} gap={10}>
          <Icon name={icon} size={20} color={colors.cream} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.explLevel}>{title}</Text>
            <Text style={styles.explDetail}>{detail}</Text>
          </View>
        </Row>
      ))}
      <Text style={styles.explDetail}>Checks are done by the REVO team. Revivors cannot edit their own badges.</Text>
    </NavyCard>
  );
}

const styles = StyleSheet.create({
  hello: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  car: { backgroundColor: colors.creamDeep, borderRadius: radius.pill, paddingHorizontal: 10, height: 30 },
  carText: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.ink },
  search: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.ink,
    paddingHorizontal: 14,
    height: 50,
  },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 15.5, color: colors.ink, height: '100%' },
  tile: {
    width: 84,
    height: 76,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  tileOn: { backgroundColor: colors.brick, borderColor: colors.brick },
  tileText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.ink },
  sort: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.muted },
  explTitle: { fontFamily: fonts.display, fontSize: 13, color: colors.cream, letterSpacing: 0.5 },
  explLevel: { fontFamily: fonts.bold, fontSize: 11, color: colors.cream, letterSpacing: 1 },
  explDetail: { fontFamily: fonts.medium, fontSize: 12, color: colors.mutedOnNavy },
});
