import { FlatList, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';
import { TopBar } from '../../components/layout';
import { ConversationRow } from '../../components/lists';
import { Banner, Divider, EmptyState } from '../../components/ui';
import { convsFor, isVerified, ME_ID, useStore } from '../../store';
import { colors, space } from '../../theme';

export default function RevivorMessages() {
  const convs = useStore(useShallow((s) => convsFor(s.conversations, 'revivor')));
  const verified = useStore((s) => {
    const me = s.revivors.find((r) => r.id === ME_ID);
    return me ? isVerified(me) : false;
  });
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopBar title="Messages" />
      <FlatList
        data={convs}
        keyExtractor={(c) => c.id}
        ListHeaderComponent={
          <View style={{ padding: space.lg, paddingBottom: space.sm }}>
            <Banner icon="lock-outline" tone="cream" text="Keep chats in REVO. Never ask drivers to pay before the work is done." />
          </View>
        }
        ItemSeparatorComponent={() => <Divider style={{ marginLeft: 82 }} />}
        renderItem={({ item }) => <ConversationRow c={item} role="revivor" />}
        ListEmptyComponent={
          !verified ? (
            <EmptyState icon="shield-lock-outline" title="Not visible yet" body="Drivers can message you once the REVO team verifies your ID and ASE certification." />
          ) : (
            <EmptyState icon="message-outline" title="No messages yet" body="Drivers who find you in search will message you here." />
          )
        }
      />
    </View>
  );
}
