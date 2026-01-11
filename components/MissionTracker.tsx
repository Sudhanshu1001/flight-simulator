
import React from 'react';
import { Mission } from '../types';

interface MissionTrackerProps {
  mission: Mission | null;
  onRefresh: () => void;
  isLoading: boolean;
}

const MissionTracker: React.FC<MissionTrackerProps> = ({ mission, onRefresh, isLoading }) => {
  return (
    <div className="absolute top-6 right-6 w-80 p-4 bg-white/85 border border-blue-200 rounded-lg backdrop-blur-sm shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-orbitron font-bold uppercase tracking-widest text-blue-800">Mission Intel</h3>
        <button 
          onClick={onRefresh}
          disabled={isLoading}
          className="text-[10px] px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50 font-bold"
        >
          {isLoading ? 'SYNCING...' : 'NEW ORDERS'}
        </button>
      </div>
      
      {mission ? (
        <div className="space-y-2">
          <h4 className="text-slate-900 font-bold text-sm">{mission.title}</h4>
          <p className="text-slate-600 text-xs leading-relaxed">"{mission.description}"</p>
          <div className="pt-2 border-t border-blue-100">
            <span className="text-[10px] uppercase text-blue-700 font-bold">Primary Objective:</span>
            <p className="text-slate-800 text-xs font-medium">{mission.objective}</p>
          </div>
        </div>
      ) : (
        <p className="text-slate-400 text-xs italic">Connecting to secure frequency...</p>
      )}
    </div>
  );
};

export default MissionTracker;
