
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { AircraftState, Mission, EngineStatus } from './types';
import { GRAVITY, DRAG_COEFFICIENT, LIFT_COEFFICIENT, THRUST_POWER, ROTATION_SPEED, COLORS } from './constants';
import ControlsOverlay from './components/ControlsOverlay';
import MissionTracker from './components/MissionTracker';
import RadioControl from './components/RadioControl';
import VisualControls from './components/VisualControls';
import { generateMission } from './services/geminiService';

const INITIAL_STATE: AircraftState = {
  position: { x: 0, y: 1000, z: 0 },
  velocity: { x: 50, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 }, // pitch, yaw, roll
  throttle: 0.5,
  airspeed: 50,
  altitude: 1000,
  fuel: 100,
  engineStatus: 'running',
  engineStress: 0
};

interface Landmark {
  x: number;
  z: number;
  type: 'mountain' | 'building' | 'forest';
  size: number;
  height: number;
  color: string;
}

const App: React.FC = () => {
  const [state, setState] = useState<AircraftState>(INITIAL_STATE);
  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const [isLoadingMission, setIsLoadingMission] = useState(false);
  const [keys, setKeys] = useState<Record<string, boolean>>({});
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(INITIAL_STATE);
  const lastTimeRef = useRef(performance.now());

  const landmarks = useMemo(() => {
    const list: Landmark[] = [];
    const worldExtent = 10000;
    const count = 300;
    
    for (let i = 0; i < count; i++) {
      const typeRoll = Math.random();
      let type: Landmark['type'] = 'forest';
      let size = 100 + Math.random() * 200;
      let height = 10;
      let color = '#99c1b9'; // Light sage

      if (typeRoll > 0.7) {
        type = 'mountain';
        size = 400 + Math.random() * 800;
        height = 300 + Math.random() * 1200;
        color = '#ced4da'; // Pale slate
      } else if (typeRoll > 0.4) {
        type = 'building';
        size = 40 + Math.random() * 80;
        height = 100 + Math.random() * 400;
        color = '#adb5bd'; // Muted concrete
      }

      list.push({
        x: (Math.random() - 0.5) * worldExtent,
        z: (Math.random() - 0.5) * worldExtent,
        type,
        size,
        height,
        color
      });
    }
    return list;
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => setKeys(prev => ({ ...prev, [e.code]: true }));
    const handleKeyUp = (e: KeyboardEvent) => setKeys(prev => ({ ...prev, [e.code]: false }));
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const refreshMission = useCallback(async () => {
    setIsLoadingMission(true);
    try {
      const mission = await generateMission(stateRef.current);
      setActiveMission(mission);
    } catch (e) {
      console.error("Failed to fetch mission", e);
    } finally {
      setIsLoadingMission(false);
    }
  }, []);

  useEffect(() => {
    refreshMission();
  }, [refreshMission]);

  useEffect(() => {
    const update = (time: number) => {
      const deltaTime = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;
      
      const s = { ...stateRef.current };
      
      if (keys['KeyW']) s.rotation.x -= ROTATION_SPEED;
      if (keys['KeyS']) s.rotation.x += ROTATION_SPEED;
      if (keys['KeyA']) s.rotation.z += ROTATION_SPEED;
      if (keys['KeyD']) s.rotation.z -= ROTATION_SPEED;
      if (keys['KeyQ']) s.rotation.y += ROTATION_SPEED;
      if (keys['KeyE']) s.rotation.y -= ROTATION_SPEED;

      if (keys['KeyR'] && s.engineStatus !== 'running') {
        if (s.throttle < 0.2) {
            s.engineStatus = 'running';
            s.engineStress = Math.max(0, s.engineStress - 40);
        }
      }

      s.rotation.x *= 0.95;
      s.rotation.z *= 0.95;
      s.rotation.y *= 0.98;

      if (keys['ShiftLeft']) s.throttle = Math.min(1, s.throttle + 0.01);
      if (keys['ControlLeft']) s.throttle = Math.max(0, s.throttle - 0.01);

      if (s.engineStatus === 'running') {
        if (s.throttle > 0.85) {
          s.engineStress += deltaTime * (s.throttle * 5);
        } else {
          s.engineStress = Math.max(0, s.engineStress - deltaTime * 2);
        }
        if (s.engineStress > 40) s.engineStatus = 'warning';
        if (s.engineStress > 20 && Math.random() < (s.engineStress / 5000)) s.engineStatus = 'failed';
      } else if (s.engineStatus === 'warning') {
        if (s.engineStress > 90 && Math.random() < 0.01) s.engineStatus = 'failed';
        if (s.engineStress < 30) s.engineStatus = 'running';
        if (s.throttle > 0.85) s.engineStress += deltaTime * 5;
        else s.engineStress = Math.max(0, s.engineStress - deltaTime * 2);
      }

      const lift = Math.max(0, s.airspeed * LIFT_COEFFICIENT * Math.cos(s.rotation.x));
      const drag = s.airspeed * s.airspeed * DRAG_COEFFICIENT * 0.01;
      let actualThrust = s.throttle * THRUST_POWER;
      if (s.engineStatus === 'failed') actualThrust = 0;
      else if (s.engineStatus === 'warning' && Math.random() < 0.1) actualThrust *= 0.3;
      
      const acceleration = actualThrust - drag;
      s.airspeed = Math.max(10, s.airspeed + acceleration * deltaTime);

      const verticalVel = (lift - GRAVITY) * Math.cos(s.rotation.z);
      const pitchComponent = Math.sin(s.rotation.x) * s.airspeed;
      s.velocity.y = verticalVel + pitchComponent;
      
      s.position.y += s.velocity.y * deltaTime;
      s.altitude = s.position.y;

      const turnRate = Math.sin(s.rotation.z) * 0.5;
      s.rotation.y += turnRate * deltaTime;

      const headingX = Math.cos(s.rotation.y);
      const headingZ = Math.sin(s.rotation.y);
      s.position.x += headingX * s.airspeed * deltaTime;
      s.position.z += headingZ * s.airspeed * deltaTime;

      if (s.position.y < 0) {
        s.position.y = 0;
        s.airspeed *= 0.5;
      }

      stateRef.current = s;
      setState(s);
      requestAnimationFrame(update);
    };

    const animId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animId);
  }, [keys]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const s = stateRef.current;
      const { width, height } = canvas;
      
      // Sky - Light Gradient
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, COLORS.skyTop);
      grad.addColorStop(0.5, COLORS.skyBottom);
      grad.addColorStop(1, '#ffffff');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate(s.rotation.z);
      
      const horizonY = s.rotation.x * 300;
      const viewDist = 1200;
      const planeX = s.position.x;
      const planeZ = s.position.z;
      const planeY = s.position.y;
      const planeYaw = s.rotation.y;

      // Ground Plane - Light Tone
      ctx.fillStyle = COLORS.ground;
      ctx.fillRect(-width * 2, horizonY, width * 4, height * 2);

      // Grid Lines
      ctx.strokeStyle = COLORS.grid;
      ctx.lineWidth = 1;
      
      // Landmarks
      const sortedLandmarks = [...landmarks].map(l => {
        const dx = l.x - planeX;
        const dz = l.z - planeZ;
        const rx = dx * Math.cos(-planeYaw) - dz * Math.sin(-planeYaw);
        const rz = dx * Math.sin(-planeYaw) + dz * Math.cos(-planeYaw);
        return { ...l, rx, rz };
      }).filter(l => l.rz > 10).sort((a, b) => b.rz - a.rz);

      sortedLandmarks.forEach(l => {
        const scale = viewDist / l.rz;
        const screenX = l.rx * scale;
        const screenY = horizonY + (planeY * -scale);
        const drawSize = l.size * scale;
        const drawHeight = l.height * scale;

        if (Math.abs(screenX) < width * 1.5) {
          if (l.type === 'mountain') {
            ctx.fillStyle = l.color;
            ctx.beginPath();
            ctx.moveTo(screenX - drawSize, screenY);
            ctx.lineTo(screenX, screenY - drawHeight);
            ctx.lineTo(screenX + drawSize, screenY);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = 'rgba(0,0,0,0.05)';
            ctx.stroke();
          } else if (l.type === 'building') {
            ctx.fillStyle = '#dee2e6';
            ctx.fillRect(screenX - drawSize / 2, screenY - drawHeight, drawSize, drawHeight);
            ctx.fillStyle = l.color;
            ctx.fillRect(screenX - drawSize / 2, screenY - drawHeight, drawSize * 0.8, drawHeight);
            ctx.fillStyle = '#ffffff';
            for (let wy = 0; wy < 5; wy++) {
              for (let wx = 0; wx < 2; wx++) {
                if (scale > 0.4) {
                   ctx.globalAlpha = 0.6;
                   ctx.fillRect(screenX - drawSize / 2 + 5 * scale + wx * 15 * scale, screenY - drawHeight + 10 * scale + wy * 30 * scale, 5 * scale, 10 * scale);
                   ctx.globalAlpha = 1.0;
                }
              }
            }
          } else {
            ctx.fillStyle = l.color;
            ctx.beginPath();
            ctx.ellipse(screenX, screenY, drawSize, drawSize / 2, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });

      ctx.restore();

      renderHUD(ctx, width, height, s);
      requestAnimationFrame(render);
    };

    const renderHUD = (ctx: CanvasRenderingContext2D, w: number, h: number, s: AircraftState) => {
      ctx.strokeStyle = COLORS.hud;
      ctx.fillStyle = COLORS.hud;
      ctx.lineWidth = 2;
      ctx.font = 'bold 14px Orbitron';

      // Center Reticle
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 40, 0, Math.PI * 2);
      ctx.moveTo(w / 2 - 60, h / 2); ctx.lineTo(w / 2 - 20, h / 2);
      ctx.moveTo(w / 2 + 20, h / 2); ctx.lineTo(w / 2 + 60, h / 2);
      ctx.moveTo(w / 2, h / 2 - 60); ctx.lineTo(w / 2, h / 2 - 20);
      ctx.moveTo(w / 2, h / 2 + 20); ctx.lineTo(w / 2, h / 2 + 60);
      ctx.stroke();

      const altX = w - 100;
      ctx.strokeRect(altX, h / 2 - 150, 60, 300);
      ctx.fillText('ALT', altX + 15, h / 2 - 160);
      ctx.fillText(`${s.altitude.toFixed(0)} FT`, altX - 10, h / 2 + 175);
      
      const speedX = 40;
      ctx.strokeRect(speedX, h / 2 - 150, 60, 300);
      ctx.fillText('SPD', speedX + 15, h / 2 - 160);
      ctx.fillText(`${s.airspeed.toFixed(1)} KTS`, speedX - 10, h / 2 + 175);

      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate(s.rotation.z);
      const pitchOffset = -s.rotation.x * 200;
      ctx.lineWidth = 1;
      for (let p = -90; p <= 90; p += 10) {
        const y = pitchOffset + p * 20;
        if (Math.abs(y) < 150) {
          ctx.beginPath();
          ctx.moveTo(-30, y); ctx.lineTo(30, y);
          ctx.stroke();
          ctx.font = '10px Orbitron';
          ctx.fillText(p.toString(), 35, y + 4);
          ctx.fillText(p.toString(), -50, y + 4);
        }
      }
      ctx.restore();

      ctx.font = 'bold 14px Orbitron';
      ctx.fillText('PWR', 40, h - 100);
      ctx.strokeRect(40, h - 90, 20, 50);
      ctx.fillRect(40, h - 40, 20, -s.throttle * 50);

      const engX = 40;
      const engY = 120;
      ctx.font = 'bold 12px Orbitron';
      ctx.fillText('ENGINE STATUS', engX, engY);
      let statusColor = COLORS.hud;
      if (s.engineStatus === 'warning') statusColor = COLORS.warning;
      if (s.engineStatus === 'failed') statusColor = COLORS.danger;
      ctx.fillStyle = statusColor;
      ctx.fillText(s.engineStatus.toUpperCase(), engX, engY + 20);
      ctx.strokeStyle = 'rgba(0,0,0,0.1)';
      ctx.strokeRect(engX, engY + 30, 100, 8);
      ctx.fillStyle = s.engineStress > 70 ? COLORS.danger : (s.engineStress > 40 ? COLORS.warning : COLORS.primary);
      ctx.fillRect(engX, engY + 30, s.engineStress, 8);

      ctx.fillStyle = COLORS.hud;
      const hdg = ((s.rotation.y * 180 / Math.PI) % 360 + 360) % 360;
      ctx.fillText(`HDG: ${hdg.toFixed(0)}°`, w / 2 - 40, 40);
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();
    const animId = requestAnimationFrame(render);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, [landmarks]);

  return (
    <div className="relative w-full h-screen bg-white overflow-hidden font-jetbrains cursor-crosshair">
      <canvas ref={canvasRef} className="w-full h-full block" />
      
      <div className="absolute inset-0 pointer-events-none select-none">
        <div className="p-8 flex justify-between items-start">
          <h1 className="text-2xl font-orbitron font-black text-slate-800 tracking-tighter italic">
            GEMINI SKY PILOT <span className="text-[10px] bg-slate-800 text-white px-1 ml-2 not-italic align-middle">LIGHT V1.0</span>
          </h1>
          
          {state.engineStatus === 'failed' && (
            <div className="bg-red-500 text-white px-4 py-2 rounded shadow-lg animate-pulse pointer-events-auto">
                <span className="font-orbitron text-sm font-bold">ENGINE FAILURE - PRESS [R] TO RESTART</span>
            </div>
          )}
        </div>
      </div>

      <ControlsOverlay />
      <VisualControls setKeys={setKeys} />
      
      <div className="pointer-events-auto">
        <MissionTracker mission={activeMission} onRefresh={refreshMission} isLoading={isLoadingMission} />
        <RadioControl flightStatus={state} />
      </div>

      {state.altitude < 100 && state.altitude > 10 && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-600 font-orbitron font-bold text-5xl animate-bounce pointer-events-none drop-shadow-md">
          PULL UP!
        </div>
      )}

      {state.altitude <= 0 && state.airspeed > 5 && (
        <div className="absolute inset-0 bg-red-600/20 backdrop-blur-sm flex items-center justify-center pointer-events-none">
           <div className="text-red-700 font-orbitron font-bold text-6xl drop-shadow-xl bg-white/90 px-10 py-5 rounded-lg border-4 border-red-700">CRITICAL IMPACT</div>
        </div>
      )}
    </div>
  );
};

export default App;
