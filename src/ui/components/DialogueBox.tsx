import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { COLORS } from '../theme/theme';
import { AppText } from './AppText';
import { PixelBox } from './PixelBox';

type Props = {
  /** The speaker: a landmark name, or a short heading. */
  title?: string;
  children: ReactNode;
  /** Bottom-right slot, e.g. the blinking advance cursor. */
  corner?: ReactNode;
  /** Fill the available height; the children then own their scrolling. */
  stretch?: boolean;
};

/** The handheld dialogue box: a line on black with rounded pixel corners, headed with the speaker's name. */
export function DialogueBox({ title, children, corner, stretch }: Props) {
  return (
    <View style={[styles.root, stretch && styles.stretch]}>
      <PixelBox fill={COLORS.ground} behind={COLORS.ground} corners="round" stretch={stretch}>
        <View style={[styles.body, stretch && styles.stretch]}>
          {title ? (
            <AppText variant="label" accessibilityRole="header" maxFontSizeMultiplier={1.3} style={styles.title}>
              {title}
            </AppText>
          ) : null}
          {children}
        </View>
        {corner ? <View style={styles.corner}>{corner}</View> : null}
      </PixelBox>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignSelf: 'stretch' },
  stretch: { flex: 1 },
  body: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 10, gap: 6 },
  title: { marginBottom: 2 },
  corner: { position: 'absolute', right: 4, bottom: 4 },
});
