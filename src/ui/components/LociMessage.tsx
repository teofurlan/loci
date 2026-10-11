import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { CHAT } from '../theme/theme';
import { AppText } from './AppText';
import { PixelBox } from './PixelBox';

type Props = {
  /** What went wrong, in one short line. */
  problem: string;
  /** What to do next. */
  recovery?: string;
  /** Recovery actions, e.g. chips. */
  children?: ReactNode;
};

/** A short message from Loci in a rounded pixel panel: the problem and the way out. Read aloud politely. */
export function LociMessage({ problem, recovery, children }: Props) {
  return (
    <View accessibilityLiveRegion="polite">
      <PixelBox fill={CHAT.ground} border={CHAT.line} behind={CHAT.ground} corners="round">
        <View style={styles.body}>
          <AppText variant="body" color={CHAT.text} maxFontSizeMultiplier={1.3}>
            {problem}
          </AppText>
          {recovery ? (
            <AppText variant="bodySmall" color={CHAT.text} maxFontSizeMultiplier={1.3}>
              {recovery}
            </AppText>
          ) : null}
          {children ? <View style={styles.actions}>{children}</View> : null}
        </View>
      </PixelBox>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 12, paddingVertical: 10, gap: 4 },
  actions: { marginTop: 6, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
