import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { CHAT } from '../theme/theme';
import { AppText } from './AppText';

type Props = {
  /** What went wrong, in one short line. */
  problem: string;
  /** What to do next. */
  recovery?: string;
  /** Recovery actions, e.g. chips. */
  children?: ReactNode;
};

/** What Loci says when something went wrong: centred under it in the body font, with the way out. Read aloud politely. */
export function LociMessage({ problem, recovery, children }: Props) {
  return (
    <View accessibilityLiveRegion="polite" style={styles.root}>
      <AppText variant="body" color={CHAT.text} maxFontSizeMultiplier={1.3} style={styles.text}>
        {problem}
      </AppText>
      {recovery ? (
        <AppText variant="bodySmall" color={CHAT.text} maxFontSizeMultiplier={1.3} style={styles.text}>
          {recovery}
        </AppText>
      ) : null}
      {children ? <View style={styles.actions}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', gap: 4, paddingHorizontal: 24 },
  text: { textAlign: 'center' },
  actions: { marginTop: 6, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
});
