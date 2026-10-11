import { Camera, Map, ViewAnnotation } from '@maplibre/maplibre-react-native';
import { memo, useMemo, useState, type ComponentProps } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import type { Landmark, LatLng } from '../../domain/types';
import { ATTRIBUTION } from '../model/format';
import { fitZoom, projectPx, separateMarkers } from '../model/marker-layout';
import { BASE_STYLE_URL, usePixelStyle } from '../state/use-pixel-style';
import { PALETTE } from '../theme/palettes';
import { COLORS, SHAPE } from '../theme/theme';
import { AppText } from './AppText';
import { PixelBox } from './PixelBox';
import { PixelSprite } from './PixelSprite';

/** About 130 m: tight courses still fill the map instead of floating in a mostly empty one. */
const MIN_SPAN_DEGREES = 0.0012;
/** Plates are 32 dp with a number tag: keep their centers at least this far apart. */
const MARKER_GAP = 46;
const DEFAULT_PADDING = { top: 48, right: 40, bottom: 40, left: 40 };

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

type BoundsTuple = [number, number, number, number];

function boundsOf(points: readonly LatLng[]): BoundsTuple {
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
  const [viewport, setViewport] = useState<{ width: number; height: number } | null>(null);
  const framing = padding ?? DEFAULT_PADDING;

  // Framing and marker spreading need the real size, so the map mounts after layout: the camera then
  // fits the course once, at the right zoom, instead of guessing before the view has a size.
  const offsets = useMemo(() => {
    if (!viewport) return null;
    const [west, south, east, north] = bounds;
    const zoom = fitZoom({ west, south, east, north }, viewport, framing);
    const points = [...controls.map((c) => c.position), start].map((p) => projectPx(p, zoom));
    return separateMarkers(points, MARKER_GAP);
  }, [viewport, bounds, controls, start, framing]);
  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setViewport((old) => (old && old.width === width && old.height === height ? old : { width, height }));
  };

  return (
    <View style={[styles.root, style]} onLayout={onLayout}>
      {mapStyle && offsets && (
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
          <Camera initialViewState={{ bounds, padding: framing }} />
          {controls.map((control, index) => {
            const found = visited?.has(index) ?? false;
            const missed = visited !== undefined && !found;
            return (
              <ViewAnnotation
                key={control.id}
                id={`control-${index}`}
                lngLat={[control.position.lng, control.position.lat]}
                anchor="center"
                offset={[offsets[index].dx - 4, offsets[index].dy - 4]}
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
              offset={[offsets[selected].dx - 4, offsets[selected].dy - 24]}
            >
              <View accessible={false} pointerEvents="none">
                <PixelSprite name="glyph:pointer" scale={3} />
              </View>
            </ViewAnnotation>
          )}
          <ViewAnnotation
            id="start"
            lngLat={[start.lng, start.lat]}
            anchor="center"
            offset={[offsets[controls.length].dx, offsets[controls.length].dy]}
          >
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
  attributionText: { fontSize: 18, lineHeight: 20 },
});

export const CourseMap = memo(CourseMapView);
