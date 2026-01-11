
import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { getControlResponse } from '../services/geminiService';

interface RadioControlProps {
  flightStatus: any;
}

const RadioControl: React.FC<RadioControlProps> = ({ flightStatus }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: 'Gemini Control established. Ready for telemetry. Over.', timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg: Message = { role: 'user', content: input, timestamp: Date.now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    try {
      const response = await getControlResponse(newMessages, flightStatus);
      setMessages(prev => [...prev, { role: 'model', content: response, timestamp: Date.now() }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'system', content: 'Interference detected. Signal lost.', timestamp: Date.now() }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="absolute bottom-6 right-6 w-80 flex flex-col h-64 bg-white/85 border border-slate-200 rounded-lg overflow-hidden backdrop-blur-sm shadow-sm">
      <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[10px] font-orbitron uppercase tracking-tighter text-slate-700">COMMS: 121.5</span>
        </div>
      </div>
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-white/50">
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <span className="text-[8px] uppercase font-bold text-slate-400 mb-1 px-1">
              {msg.role === 'user' ? 'Pilot' : msg.role === 'model' ? 'Control' : 'Sys'}
            </span>
            <div className={`max-w-[90%] px-3 py-2 rounded text-[11px] leading-tight shadow-sm ${
              msg.role === 'user' ? 'bg-blue-600 text-white' : 
              msg.role === 'model' ? 'bg-slate-100 text-slate-800 border border-slate-200' : 
              'bg-red-50 text-red-600 border border-red-100'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex items-center gap-1 text-[10px] text-blue-500">
            <span className="animate-bounce">.</span>
            <span className="animate-bounce delay-75">.</span>
            <span className="animate-bounce delay-150">.</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-2 bg-slate-50 flex border-t border-slate-200">
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Transmit message..."
          className="flex-1 bg-transparent text-[11px] text-slate-800 focus:outline-none placeholder:text-slate-400"
        />
        <button type="submit" className="text-blue-600 hover:text-blue-800 px-2 transition-colors">
          <i className="fa-solid fa-arrow-up text-xs" />
        </button>
      </form>
    </div>
  );
};

export default RadioControl;
