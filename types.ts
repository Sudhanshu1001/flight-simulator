
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export type EngineStatus = 'running' | 'warning' | 'failed';

export interface AircraftState {
  position: Vector3;
  velocity: Vector3;
  rotation: Vector3; // pitch, yaw, roll in radians
  throttle: number; // 0 to 1
  airspeed: number;
  altitude: number;
  fuel: number;
  engineStatus: EngineStatus;
  engineStress: number; // 0 to 100
}

export interface TerrainPoint {
  x: number;
  y: number;
  z: number;
  height: number;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  objective: string;
  isCompleted: boolean;
}

export interface Message {
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
}
