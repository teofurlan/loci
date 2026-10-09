import { Camera, Map, ViewAnnotation } from '@maplibre/maplibre-react-native';
import { memo, useMemo, type ComponentProps } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { Landmark, LatLng } from '../../domain/types';
import { ATTRIBUTION } from '../model/format';
import { BASE_STYLE_URL, usePixelStyle } from '../state/use-pixel-style';
import { PALETTE } from '../theme/palettes';
import { COLORS, SHAPE } from '../theme/theme';
import { AppText } from './AppText';
import { PixelBox } from './PixelBox';
import { PixelSprite } from './PixelSprite';

const MIN_SPAN_DEGREES = 0.004;

type Props = {
  start: LatLng;
  controls: readonly Landmark[];
  /** Indexes of punched controls. When given, found places print lit and missed ones stay dim. */
  visited?: ReadonlySet<number>;
  /** The control whose sprite is highlighted. */
  selected?: number;
  onSelect?: (index: number) => void;
  style?: StyleProp<ViewStyle>;
  /** Space reserved around the course when framing it, in dp. */
  padding?: { top: number; right: number; bottom: number; left: number };
};

function boundsOf(points: readonly LatLng[]): [number, number, number, number] {
  const lngs = points.map((p) => p.lng);
  const lats = points.map((p) => p.lat);
  let west = Math.min(...lngs);
  let east = Math.max(...lngs);
  let south = Math.min(...lats);
  let north = Math.max(...lats);
  if (east - west < MIN_SPAN_DEGREES) {
    west -= MIN_SPAN_DEGREES / 2;
    east += MIN_SPAN_DEGREES / 2;
  }
  if (north - south < MIN_SPAN_DEGREES) {
    south -= MIN_SPAN_DEGREES / 2;
    north += MIN_SPAN_DEGREES / 2;
  }
  return [west, south, east, north];
}

type MapStyle = ComponentProps<typeof Map>['mapStyle'];

/**
 * The overworld: the OpenFreeMap terrain recolored to four greens, a pixel "you" at the start and one
 * kind sprite per control with its number tag. No legs, because the order is free.
 */
function CourseMapView({ start, controls, visited, selected, onSelect, style, padding }: Props) {
  const { style: pixelStyle, failed } = usePixelStyle();
  const bounds = useMemo(() => boundsOf([start, ...controls.map((c) => c.position)]), [start, controls]);
  const mapStyle = (pixelStyle as unknown as MapStyle | null) ?? (failed ? BASE_STYLE_URL : null);

  return (
    <View style={[styles.root, style]}>
      {mapStyle && (
        <Map
          style={styles.map}
          mapStyle={mapStyle}
          androidView="texture"
          compass={false}
          logo={false}
          attribution={false}
          touchRotate={false}
          touchPitch={false}
        >
          <Camera initialViewState={{ bounds, padding: padding ?? { top: 48, right: 40, bottom: 40, left: 40 } }} />
          {controls.map((control, index) => {
            const found = visited?.has(index) ?? false;
            const missed = visited !== undefined && !found;
            return (
              <ViewAnnotation
                key={control.id}
                id={`control-${index}`}
                lngLat={[control.position.lng, control.position.lat]}
                anchor="center"
                offset={[-4, -4]}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Control ${index + 1}, ${control.name}`}
                  disabled={!onSelect}
                  onPress={() => onSelect?.(index)}
                  hitSlop={6}
                  style={styles.marker}
                >
                  <PixelBox fill={missed ? COLORS.ground : COLORS.panel} behind={COLORS.ground}>
                    <View style={styles.plate}>
                      <PixelSprite name={control.kind} scale={2} />
                    </View>
                  </PixelBox>
                  <View style={[styles.tag, found && styles.tagFound]}>
                    <AppText variant="label" allowFontScaling={false} color={COLORS.ink} style={styles.tagText}>
                      {index + 1}
                    </AppText>
                  </View>
                </Pressable>
              </ViewAnnotation>
            );
          })}
          {selected !== undefined && controls[selected] && (
            // Highlight by moving one cursor, never by redrawing a sprite: annotations render once to a bitmap.
            <ViewAnnotation
              id="cursor"
              lngLat={[controls[selected].position.lng, controls[selected].position.lat]}
              anchor="bottom"
              offset={[0, -22]}
            >
              <View accessible={false} pointerEvents="none" style={styles.cursor}>
                <PixelSprite name="glyph:down" scale={4} />
              </View>
            </ViewAnnotation>
          )}
          <ViewAnnotation id="start" lngLat={[start.lng, start.lat]} anchor="center">
            <View accessible accessibilityLabel="You are here, the start">
              <PixelSprite name="you" scale={2} />
            </View>
          </ViewAnnotation>
        </Map>
      )}
      <View pointerEvents="none" style={styles.attribution}>
        <AppText variant="bodySmall" allowFontScaling={false} style={styles.attributionText}>
          {ATTRIBUTION}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: PALETTE.map.land, overflow: 'hidden' },
  map: { flex: 1 },
  marker: { paddingRight: 8, paddingBottom: 8 },
  plate: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  tag: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 2,
    backgroundColor: COLORS.panel,
    borderWidth: SHAPE.rule,
    borderColor: COLORS.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cursor: { padding: 2, backgroundColor: COLORS.panel, borderWidth: SHAPE.rule, borderColor: COLORS.ink },
  tagFound: { backgroundColor: COLORS.found },
  tagText: { fontSize: 9, lineHeight: 12 },
  attribution: {
    position: 'absolute',
    left: 6,
    bottom: 6,
    paddingHorizontal: 4,
    backgroundColor: COLORS.panel,
    borderWidth: SHAPE.rule,
    borderColor: COLORS.ink,
  },
  attributionText: { fontSize: 13, lineHeight: 16 },
});

export const CourseMap = memo(CourseMapView);
