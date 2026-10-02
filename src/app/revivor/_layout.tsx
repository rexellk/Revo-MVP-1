import { Tabs } from 'expo-router/js-tabs';
import { TabBar } from '../../components/layout';
import { convsFor, needsAction, useStore } from '../../store';

export default function RevivorTabs() {
  const unread = useStore((s) => convsFor(s.conversations, 'revivor').filter((c) => c.unread > 0).length);
  const todo = useStore((s) => s.jobs.filter((j) => needsAction(j, 'revivor')).length);
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(p) => <TabBar {...p} badges={{ messages: unread, jobs: todo }} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="messages" />
      <Tabs.Screen name="jobs" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
