import { useShallow } from 'zustand/react/shallow';
import { FlatList, View } from 'react-native';
import { TopBar } from '../../components/layout';
import { ConversationRow } from '../../components/lists';
import { Banner, Divider, EmptyState } from '../../components/ui';
import { convsFor, useStore } from '../../store';
import { colors, space } from '../../theme';

export default function DriverMessages() {
  const convs = useStore(useShallow((s) => convsFor(s.conversations, 'driver')));
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopBar title="Messages" />
      <FlatList
        data={convs}
        keyExtractor={(c) => c.id}
        ListHeaderComponent={
          <View style={{ padding: space.lg, paddingBottom: space.sm }}>
            <Banner icon="lock-outline" tone="cream" text="Keep chats in REVO. Your phone number stays hidden until you both choose to share." />
          </View>
        }
        ItemSeparatorComponent={() => <Divider style={{ marginLeft: 82 }} />}
        renderItem={({ item }) => <ConversationRow c={item} role="driver" />}
        ListEmptyComponent={
          <EmptyState icon="message-outline" title="No messages yet" body="Open a verified Revivor's profile and message them about your car." />
        }
      />
    </View>
  );
}
