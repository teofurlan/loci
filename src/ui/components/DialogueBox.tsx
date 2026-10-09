import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { COLORS } from '../theme/theme';
import { AppText } from './AppText';
import { PixelBox } from './PixelBox';

type Props = {
  /** The speaker: a landmark name, or a short heading. */
  title?: string;
  /** `panel` is the paper box on the ground; `dark` is for the run screen's field. */
  tone?: 'panel' | 'dark';
  children: ReactNode;
  /** Bottom-right slot, e.g. the blinking advance cursor. */
  corner?: ReactNode;
  /** Fill the available height; the children then own their scrolling. */
  stretch?: boolean;
};

/** The double-bordered handheld dialogue box, headed with the speaker's name. */
export function DialogueBox({ title, tone = 'panel', children, corner, stretch }: Props) {
  const dark = tone === 'dark';
  const fill = dark ? COLORS.runField : COLORS.panel;
  const line = dark ? COLORS.runText : COLORS.ink;
  const behind = dark ? COLORS.runField : COLORS.ground;
  return (
    <View style={[styles.root, stretch && styles.stretch]}>
      <PixelBox fill={fill} border={line} behind={behind} double stretch={stretch}>
        <View style={[styles.body, stretch && styles.stretch]}>
          {title ? (
            <AppText variant="label" color={line} accessibilityRole="header" maxFontSizeMultiplier={1.3} style={styles.title}>
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
