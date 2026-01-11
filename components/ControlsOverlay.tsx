
import React from 'react';

const ControlsOverlay: React.FC = () => {
  return (
    <div className="absolute bottom-6 left-6 p-4 bg-white/85 border border-slate-200 rounded-lg text-xs text-slate-700 backdrop-blur-sm select-none pointer-events-none shadow-sm">
      <h3 className="font-orbitron font-bold mb-2 uppercase tracking-widest text-slate-900">Flight Manual</h3>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <div className="flex justify-between"><span>Pitch Down</span> <span className="font-bold text-slate-900">[W]</span></div>
        <div className="flex justify-between"><span>Pitch Up</span> <span className="font-bold text-slate-900">[S]</span></div>
        <div className="flex justify-between"><span>Roll Left</span> <span className="font-bold text-slate-900">[A]</span></div>
        <div className="flex justify-between"><span>Roll Right</span> <span className="font-bold text-slate-900">[D]</span></div>
        <div className="flex justify-between"><span>Yaw Left</span> <span className="font-bold text-slate-900">[Q]</span></div>
        <div className="flex justify-between"><span>Yaw Right</span> <span className="font-bold text-slate-900">[E]</span></div>
        <div className="flex justify-between"><span>Throttle Up</span> <span className="font-bold text-slate-900">[SHIFT]</span></div>
        <div className="flex justify-between"><span>Throttle Down</span> <span className="font-bold text-slate-900">[CTRL]</span></div>
        <div className="flex justify-between col-span-2 pt-1 border-t border-slate-200 mt-1">
          <span>Engine Restart</span> <span className="font-bold text-slate-900">[R]</span>
        </div>
      </div>
    </div>
  );
};

export default ControlsOverlay;
