import { Redirect, router } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scoreSession } from '../domain/session';
import { AppText } from '../ui/components/AppText';
import { ControlRow } from '../ui/components/ControlRow';
import { CourseMap } from '../ui/components/CourseMap';
import { FlagButton } from '../ui/components/FlagButton';
import { PunchCard } from '../ui/components/PunchCard';
import { formatElapsed } from '../ui/model/format';
import { courseStore, useCourse } from '../ui/state/course';
import { services } from '../ui/state/services';
import { SHAPE, useTheme } from '../ui/theme/theme';

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
const formatPoints = (points: number) => (Number.isInteger(points) ? String(points) : points.toFixed(1));

export default function ResultsScreen() {
  const course = useCourse();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const saved = useRef(false);

  const visited = useMemo(
    () => new Set(course.phase === 'empty' ? [] : course.session.run.visits.map((v) => v.checkpointIndex)),
    [course],
  );
  const hinted = useMemo(() => new Set(course.phase === 'empty' ? [] : course.session.hinted), [course]);

  const ids = course.phase === 'empty' ? [] : [...visited].map((i) => course.plan.checkpoints[i].id);
  const idsKey = ids.join('|');
  useEffect(() => {
    if (saved.current || course.phase !== 'results') return;
    saved.current = true;
    services.history.add(idsKey ? idsKey.split('|') : []).catch(() => {
      // History is a nicety: a failed write must never block the results.
    });
  }, [course.phase, idsKey]);

  if (course.phase !== 'results') return <Redirect href="/" />;

  const score = scoreSession(course.session);
  const completed = course.session.status === 'completed';

  const newCourse = () => {
    courseStore.reset();
    router.replace('/');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 24 }]}>
        <AppText variant="headline" accessibilityRole="header">
          {completed ? 'Course complete' : 'Course ended'}
        </AppText>
        <AppText variant="display" tabular style={styles.points}>
          {formatPoints(score.points)} pts
        </AppText>
        <AppText variant="body" color={colors.onSurfaceVariant} tabular>
          {score.visited} of {score.total} visited, {plural(score.hintsUsed, 'hint')}, {formatElapsed(course.elapsedMs)}
        </AppText>

        <View style={styles.card}>
          <PunchCard total={score.total} visited={visited} hinted={hinted} />
        </View>

        <AppText variant="label" style={styles.sectionLabel}>
          The map
        </AppText>
        <View style={[styles.map, { borderColor: colors.outline }]}>
          <CourseMap
            style={styles.fill}
            start={course.start}
            controls={course.plan.checkpoints}
            visited={visited}
            padding={{ top: 40, right: 40, bottom: 40, left: 40 }}
          />
        </View>

        <View style={[styles.sheet, { borderColor: colors.outline }]}>
          {course.plan.checkpoints.map((landmark, index) => (
            <ControlRow
              key={landmark.id}
              number={index + 1}
              kind={landmark.kind}
              name={landmark.name}
              minutes={0}
              status={visited.has(index) ? (hinted.has(index) ? 'Punched with hint' : 'Punched') : 'Missed'}
            />
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) + 4 }]}>
        <FlagButton label="New course" onPress={newCourse} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 24 },
  points: { marginTop: 4 },
  card: { marginTop: 20 },
  sectionLabel: { marginTop: 28, marginBottom: 8 },
  map: { height: 300, borderWidth: SHAPE.rule, borderRadius: SHAPE.radius, overflow: 'hidden' },
  sheet: { marginTop: 20, borderTopWidth: SHAPE.rule },
  footer: { paddingHorizontal: 16, paddingTop: 10 },
});
