export type LatLng = { lat: number; lng: number };

export type Rng = () => number;

export type Fix = {
  position: LatLng;
  accuracyMeters: number;
  timestamp: number;
};

export type RunConfig = {
  hitRadiusMeters: number;
  maxAccuracyMeters: number;
};

export type Visit = {
  checkpointIndex: number;
  timestamp: number;
};

export type RunState = {
  checkpoints: readonly LatLng[];
  config: RunConfig;
  visits: readonly Visit[];
};

export type RecordFixResult = {
  state: RunState;
  newlyHit: readonly number[];
};

export type RunScore = {
  visited: number;
  total: number;
  ratio: number;
  order: readonly number[];
};
