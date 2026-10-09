import { Camera, Map, ViewAnnotation } from '@maplibre/maplibre-react-native';
import { memo, useMemo, type ComponentProps } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { Landmark, LatLng } from '../../domain/types';
import { ATTRIBUTION } from '../model/format';
import { BASE_STYLE_URL, usePixelStyle } from '../state/use-pixel-style';
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
            const active = index === selected;
            return (
              <ViewAnnotation
                key={control.id}
                id={`control-${index}`}
                lngLat={[control.position.lng, control.position.lat]}
                anchor="center"
                selected={active}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Control ${index + 1}, ${control.name}`}
                  accessibilityState={{ selected: active }}
                  disabled={!onSelect}
                  onPress={() => onSelect?.(index)}
                  hitSlop={6}
                >
                  <PixelBox fill={missed ? COLORS.ground : COLORS.lit} behind={COLORS.ground} double={active}>
                    <View style={styles.plate}>
                      <PixelSprite name={control.kind} scale={2} />
                    </View>
                  </PixelBox>
                  <View style={[styles.tag, found && styles.tagFound]}>
                    <AppText variant="label" allowFontScaling={false} color={found ? COLORS.lit : COLORS.ink} style={styles.tagText}>
                      {index + 1}
                    </AppText>
                  </View>
                </Pressable>
              </ViewAnnotation>
            );
          })}
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
  root: { backgroundColor: COLORS.ground, overflow: 'hidden' },
  map: { flex: 1 },
  plate: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  tag: {
    position: 'absolute',
    right: -6,
    bottom: -6,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 2,
    backgroundColor: COLORS.lit,
    borderWidth: SHAPE.rule,
    borderColor: COLORS.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagFound: { backgroundColor: COLORS.ink },
  tagText: { fontSize: 9, lineHeight: 12 },
  attribution: {
    position: 'absolute',
    left: 6,
    bottom: 6,
    paddingHorizontal: 4,
    backgroundColor: COLORS.lit,
    borderWidth: SHAPE.rule,
    borderColor: COLORS.ink,
  },
  attributionText: { fontSize: 13, lineHeight: 16 },
});

export const CourseMap = memo(CourseMapView);
