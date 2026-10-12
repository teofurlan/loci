import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { COLORS } from '../theme/theme';
import { AppText } from './AppText';
import { PixelBox } from './PixelBox';

type Props = {
  /** The speaker: a landmark name, or a short heading. */
  title?: string;
  children: ReactNode;
  /** A line under the speaker's name, e.g. "Control 1 of 4 · 5 min". */
  subtitle?: string;
  /** The speaker's portrait, drawn left of the name and subtitle (Loci "speaking"). Decorative: the name already reads. */
  portrait?: ReactNode;
  /** Bottom-right slot, e.g. the blinking advance cursor. */
  corner?: ReactNode;
  /** Fill the available height; the children then own their scrolling. */
  stretch?: boolean;
};

/** The handheld dialogue box: a line on black with rounded pixel corners, headed with the speaker's name. */
export function DialogueBox({ title, subtitle, portrait, children, corner, stretch }: Props) {
  return (
    <View style={[styles.root, stretch && styles.stretch]}>
      <PixelBox fill={COLORS.ground} behind={COLORS.ground} corners="round" stretch={stretch}>
        <View style={[styles.body, stretch && styles.stretch]}>
          {portrait ? (
            <View style={styles.speaker}>
              <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                {portrait}
              </View>
              <View style={styles.speakerText}>
                {title ? (
                  <AppText variant="label" accessibilityRole="header" maxFontSizeMultiplier={1.3}>
                    {title}
                  </AppText>
                ) : null}
                {subtitle ? <AppText variant="bodySmall">{subtitle}</AppText> : null}
              </View>
            </View>
          ) : title ? (
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
  speaker: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  speakerText: { flex: 1 },
  corner: { position: 'absolute', right: 4, bottom: 4 },
});
