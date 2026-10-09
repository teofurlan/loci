import { PixelSprite } from './PixelSprite';

type Props = { scale?: number };

/**
 * The app's mark on the loading screen. For now it is the "you" sprite; the logo being designed separately
 * replaces this one component and every place that shows the mark follows.
 */
export function AppMark({ scale = 8 }: Props) {
  return <PixelSprite name="you" scale={scale} />;
}
