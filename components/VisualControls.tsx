
import React from 'react';

interface VisualControlsProps {
  setKeys: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

const VisualControls: React.FC<VisualControlsProps> = ({ setKeys }) => {
  const handleAction = (code: string, active: boolean) => {
    setKeys(prev => ({ ...prev, [code]: active }));
  };

  const ControlButton = ({ code, label, icon, className = "" }: { code: string, label: string, icon: string, className?: string }) => (
    <button
      onMouseDown={() => handleAction(code, true)}
      onMouseUp={() => handleAction(code, false)}
      onMouseLeave={() => handleAction(code, false)}
      onTouchStart={(e) => { e.preventDefault(); handleAction(code, true); }}
      onTouchEnd={(e) => { e.preventDefault(); handleAction(code, false); }}
      className={`w-12 h-12 flex flex-col items-center justify-center bg-white/80 border border-slate-200 rounded active:bg-blue-100 hover:bg-slate-50 transition-colors pointer-events-auto shadow-sm ${className}`}
      title={label}
    >
      <i className={`fa-solid ${icon} text-slate-700 text-sm mb-1`}></i>
      <span className="text-[8px] text-slate-400 uppercase font-bold">{label}</span>
    </button>
  );

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-end gap-12 pointer-events-none select-none">
      {/* Left Pad: Pitch and Roll */}
      <div className="grid grid-cols-3 gap-1">
        <div />
        <ControlButton code="KeyW" label="Down" icon="fa-arrow-up" />
        <div />
        <ControlButton code="KeyA" label="Left" icon="fa-arrow-rotate-left" />
        <ControlButton code="KeyS" label="Up" icon="fa-arrow-down" />
        <ControlButton code="KeyD" label="Right" icon="fa-arrow-rotate-right" />
      </div>

      {/* Middle Pad: Yaw and Restart */}
      <div className="flex flex-col items-center gap-2">
        <button
          onMouseDown={() => handleAction('KeyR', true)}
          onMouseUp={() => handleAction('KeyR', false)}
          className="px-6 py-2 bg-slate-800 border border-slate-900 rounded text-[10px] text-white font-orbitron uppercase tracking-widest hover:bg-slate-700 active:bg-black transition-colors pointer-events-auto shadow-md"
        >
          Restart Engine [R]
        </button>
        <div className="flex gap-2">
          <ControlButton code="KeyQ" label="Yaw L" icon="fa-chevron-left" />
          <ControlButton code="KeyE" label="Yaw R" icon="fa-chevron-right" />
        </div>
      </div>

      {/* Right Pad: Throttle */}
      <div className="flex flex-col gap-1">
        <ControlButton code="ShiftLeft" label="THR +" icon="fa-plus" className="h-16" />
        <ControlButton code="ControlLeft" label="THR -" icon="fa-minus" className="h-16" />
      </div>
    </div>
  );
};

export default VisualControls;
