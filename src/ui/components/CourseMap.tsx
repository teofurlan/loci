import { Camera, GeoJSONSource, Layer, Map, ViewAnnotation } from '@maplibre/maplibre-react-native';
import { memo, useMemo } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import type { Landmark, LatLng } from '../../domain/types';
import { useTheme } from '../theme/theme';

const STYLE_LIGHT = 'https://tiles.openfreemap.org/styles/positron';
const STYLE_NIGHT = 'https://tiles.openfreemap.org/styles/dark';

const RING_RADIUS = 15;
const RING_WIDTH = 3;
const MIN_SPAN_DEGREES = 0.004;

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
  const ink = dark ? '#000000' : '#FFFFFF';

  return (
    <Map
      style={style}
      mapStyle={dark ? STYLE_NIGHT : STYLE_LIGHT}
      androidView="texture"
      compass={false}
      logo={false}
      attribution
      attributionPosition={{ bottom: 6, left: 6 }}
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
            'circle-color': ['case', ['get', 'punched'], colors.overprint, 'rgba(255,255,255,0)'],
            'circle-stroke-color': colors.overprint,
            'circle-stroke-width': RING_WIDTH,
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
            'text-color': ['case', ['get', 'punched'], ink, colors.overprint],
            'text-halo-color': ['case', ['get', 'punched'], colors.overprint, ink],
            'text-halo-width': 0.6,
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
  );
}

export const CourseMap = memo(CourseMapView);
