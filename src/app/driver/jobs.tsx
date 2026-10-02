import { useShallow } from 'zustand/react/shallow';
import { ScrollView, View } from 'react-native';
import { TopBar } from '../../components/layout';
import { HowJobsWork, JobCard } from '../../components/lists';
import { EmptyState, SectionHeader } from '../../components/ui';
import { ME_ID, needsAction, useStore } from '../../store';
import { colors, space } from '../../theme';

export default function DriverJobs() {
  const jobs = useStore(useShallow((s) => s.jobs.filter((j) => j.revivorId !== ME_ID)));
  const todo = jobs.filter((j) => needsAction(j, 'driver'));
  const rest = jobs.filter((j) => !needsAction(j, 'driver'));
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopBar title="My jobs" />
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg, paddingBottom: 40 }}>
        {todo.length ? (
          <View style={{ gap: space.md }}>
            <SectionHeader title="Needs you" />
            {todo.map((j) => (
              <JobCard key={j.id} j={j} role="driver" />
            ))}
          </View>
        ) : null}
        {rest.length ? (
          <View style={{ gap: space.md }}>
            <SectionHeader title="History" />
            {rest.map((j) => (
              <JobCard key={j.id} j={j} role="driver" />
            ))}
          </View>
        ) : null}
        {!jobs.length ? <EmptyState icon="wrench-outline" title="No jobs yet" body="Jobs show up here once you and a Revivor mark one in chat." /> : null}
        <HowJobsWork role="driver" />
      </ScrollView>
    </View>
  );
}
