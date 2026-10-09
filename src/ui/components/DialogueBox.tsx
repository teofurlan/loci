import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { COLORS } from '../theme/theme';
import { AppText } from './AppText';
import { PixelBox } from './PixelBox';

type Props = {
  /** The speaker: a landmark name, or a short heading. */
  title?: string;
  /** `lit` is for tappable boxes on the ground; `dark` is for the ink field of the run screen. */
  tone?: 'lit' | 'ground' | 'dark';
  children: ReactNode;
  /** Bottom-right slot, e.g. the blinking advance cursor. */
  corner?: ReactNode;
};

/** The double-bordered handheld dialogue box, headed with the speaker's name. */
export function DialogueBox({ title, tone = 'ground', children, corner }: Props) {
  const dark = tone === 'dark';
  const fill = dark ? COLORS.field : tone === 'lit' ? COLORS.lit : COLORS.ground;
  const line = dark ? COLORS.lit : COLORS.ink;
  const behind = dark ? COLORS.field : COLORS.ground;
  return (
    <View style={styles.root}>
      <PixelBox fill={fill} border={line} behind={behind} double>
        <View style={styles.body}>
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
  body: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 10, gap: 6 },
  title: { marginBottom: 2 },
  corner: { position: 'absolute', right: 4, bottom: 4 },
});
