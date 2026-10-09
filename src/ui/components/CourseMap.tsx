import { Camera, GeoJSONSource, Layer, Map, ViewAnnotation } from '@maplibre/maplibre-react-native';
import { memo, useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import type { Landmark, LatLng } from '../../domain/types';
import { useTheme } from '../theme/theme';
import { AppText } from './AppText';

const STYLE_LIGHT = 'https://tiles.openfreemap.org/styles/positron';
const STYLE_NIGHT = 'https://tiles.openfreemap.org/styles/dark';

const RING_RADIUS = 15;
const RING_WIDTH = 3;
const MIN_SPAN_DEGREES = 0.004;
/** Required by the OpenStreetMap and OpenFreeMap licences. Drawn by us in ink, so the stock teal button is off. */
export const ATTRIBUTION = '© OpenStreetMap contributors, OpenFreeMap';

type Props = {
  start: LatLng;
  controls: readonly Landmark[];
  /** Indexes of punched controls. When given, punched controls print filled and missed ones stay open. */
  visited?: ReadonlySet<number>;
  /** 0 = full overprint, 1 = circles collapsed into their numbers. */
  collapse?: number;
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

/**
 * Score-O overprint on a muted basemap: a purple start triangle and numbered control
 * circles, with no legs because the order is free.
 */
function CourseMapView({ start, controls, visited, collapse = 0, style, padding }: Props) {
  const { colors, dark } = useTheme();

  const data = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: controls.map((control, index) => ({
        type: 'Feature' as const,
        id: index,
        properties: { n: String(index + 1), punched: visited?.has(index) ?? false },
        geometry: { type: 'Point' as const, coordinates: [control.position.lng, control.position.lat] },
      })),
    }),
    [controls, visited],
  );

  const bounds = useMemo(() => boundsOf([start, ...controls.map((c) => c.position)]), [start, controls]);
  const radius = RING_RADIUS * (1 - collapse) + 2 * collapse;
  // The map ground: pure black at night, pure white by day. Unpunched rings are filled with it so
  // basemap labels never run through the numerals, and the stroke thins to nothing as the rings collapse.
  const ground = dark ? '#000000' : '#FFFFFF';
  const ringWidth = RING_WIDTH * (1 - collapse);

  return (
    <View style={style}>
    <Map
      style={styles.map}
      mapStyle={dark ? STYLE_NIGHT : STYLE_LIGHT}
      androidView="texture"
      compass={false}
      logo={false}
      attribution={false}
      touchRotate={false}
      touchPitch={false}
    >
      <Camera initialViewState={{ bounds, padding: padding ?? { top: 48, right: 40, bottom: 40, left: 40 } }} />
      <GeoJSONSource id="controls" data={data}>
        <Layer
          id="control-rings"
          type="circle"
          paint={{
            'circle-radius': radius,
            'circle-color': ['case', ['get', 'punched'], colors.overprint, ground],
            'circle-stroke-color': colors.overprint,
            'circle-stroke-width': ringWidth,
          }}
        />
        <Layer
          id="control-numbers"
          type="symbol"
          layout={{
            'text-field': ['get', 'n'],
            'text-font': ['Noto Sans Bold'],
            'text-size': 15,
            'text-allow-overlap': true,
            'text-ignore-placement': true,
          }}
          paint={{
            'text-color': ['case', ['get', 'punched'], ground, colors.overprint],
            'text-halo-color': ['case', ['get', 'punched'], colors.overprint, ground],
            'text-halo-width': 1.5,
          }}
        />
      </GeoJSONSource>
      <ViewAnnotation id="start" lngLat={[start.lng, start.lat]} anchor="center">
        <Svg width={34} height={34} viewBox="0 0 34 34" accessible={false}>
          <Polygon
            points="17,4 31,29 3,29"
            fill="none"
            stroke={colors.overprint}
            strokeWidth={RING_WIDTH}
            strokeLinejoin="miter"
          />
        </Svg>
      </ViewAnnotation>
    </Map>
    <View pointerEvents="none" style={[styles.attribution, { backgroundColor: colors.background }]}>
      <AppText variant="label" color={colors.onSurfaceVariant} style={styles.attributionText} maxFontSizeMultiplier={1.2}>
        {ATTRIBUTION}
      </AppText>
    </View>
    </View>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  attribution: { position: 'absolute', left: 6, bottom: 6, paddingHorizontal: 4, paddingVertical: 1 },
  attributionText: { fontSize: 12, lineHeight: 15, letterSpacing: 0.2, textTransform: 'none' },
});

export const CourseMap = memo(CourseMapView);
