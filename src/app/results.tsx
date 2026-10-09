import { Redirect, router } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scoreSession } from '../domain/session';
import { AppText } from '../ui/components/AppText';
import { BadgeCase } from '../ui/components/BadgeCase';
import { ControlRow } from '../ui/components/ControlRow';
import { CourseMap } from '../ui/components/CourseMap';
import { PixelBox } from '../ui/components/PixelBox';
import { PixelButton } from '../ui/components/PixelButton';
import { controlsFigure, formatElapsed, formatPoints, SCORING_RULE } from '../ui/model/format';
import { courseStore, useCourse } from '../ui/state/course';
import { services } from '../ui/state/services';
import { COLORS, SHAPE } from '../ui/theme/theme';

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export default function ResultsScreen() {
  const course = useCourse();
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
  const scoreLine = `${controlsFigure(score.visited, score.total)} visited · ${formatPoints(score.points)} points`;

  const newCourse = () => {
    courseStore.reset();
    router.replace('/');
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 24 }]}>
        <AppText variant="headline" accessibilityRole="header" maxFontSizeMultiplier={1.3}>
          {completed ? 'Course complete' : 'Course ended'}
        </AppText>
        <AppText variant="title" style={styles.figure} accessibilityLabel={scoreLine}>
          {scoreLine}
        </AppText>
        <AppText variant="body" style={styles.stats}>
          {plural(score.hintsUsed, 'hint')}, {formatElapsed(course.elapsedMs)}
        </AppText>
        <AppText variant="body" style={styles.rule}>
          {SCORING_RULE}
        </AppText>

        <AppText variant="label" style={styles.sectionLabel} maxFontSizeMultiplier={1.3}>
          Badges
        </AppText>
        <BadgeCase kinds={course.plan.checkpoints.map((c) => c.kind)} visited={visited} hinted={hinted} />

        <AppText variant="label" style={styles.sectionLabel} maxFontSizeMultiplier={1.3}>
          The map
        </AppText>
        <PixelBox fill={COLORS.ground} behind={COLORS.ground} double>
          <View style={styles.map}>
            <CourseMap
              style={styles.fill}
              start={course.start}
              controls={course.plan.checkpoints}
              visited={visited}
              padding={{ top: 40, right: 40, bottom: 72, left: 40 }}
            />
          </View>
        </PixelBox>

        <View style={styles.sheet}>
          {course.plan.checkpoints.map((landmark, index) => (
            <ControlRow
              key={landmark.id}
              number={index + 1}
              kind={landmark.kind}
              name={landmark.name}
              status={visited.has(index) ? (hinted.has(index) ? 'Punched with hint' : 'Punched') : 'Missed'}
            />
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) + 4 }]}>
        <PixelButton variant="primary" label="New course" onPress={newCourse} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.ground },
  fill: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 24 },
  figure: { marginTop: 14 },
  stats: { marginTop: 12 },
  rule: { marginTop: 2 },
  sectionLabel: { marginTop: 28, marginBottom: 10 },
  map: { height: 300 },
  sheet: { marginTop: 20 },
  footer: { paddingHorizontal: 16, paddingTop: 8, borderTopWidth: SHAPE.rule, borderTopColor: COLORS.ink },
});
