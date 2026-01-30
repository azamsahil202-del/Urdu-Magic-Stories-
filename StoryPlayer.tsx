
import React, { useState, useEffect, useRef } from 'react';
import { StoryContent } from '../types';
import { generateSpeech, decodeAudioData } from '../services/geminiService';

interface StoryPlayerProps {
  story: StoryContent;
  onStop: () => void;
}

const StoryPlayer: React.FC<StoryPlayerProps> = ({ story, onStop }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioCache = useRef<Map<number, AudioBuffer>>(new Map());
  const prefetchingRef = useRef<Set<number>>(new Set());
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);

  const totalPages = story.pages.length;

  const initAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  const stopAudio = () => {
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
      } catch (e) { /* already stopped */ }
      currentSourceRef.current = null;
    }
    setIsSpeaking(false);
    setIsPaused(false);
    startTimeRef.current = 0;
    pauseTimeRef.current = 0;
  };

  const preloadPage = async (pageIndex: number) => {
    if (pageIndex < 0 || pageIndex >= totalPages) return;
    if (audioCache.current.has(pageIndex)) return;
    if (prefetchingRef.current.has(pageIndex)) return;

    prefetchingRef.current.add(pageIndex);
    try {
      initAudioContext();
      const audioData = await generateSpeech(story.pages[pageIndex]);
      const audioBuffer = await decodeAudioData(audioData, audioContextRef.current!);
      audioCache.current.set(pageIndex, audioBuffer);
      console.log(`Preloaded page ${pageIndex}`);
    } catch (e) {
      console.error(`Failed to preload page ${pageIndex}:`, e);
    } finally {
      prefetchingRef.current.delete(pageIndex);
    }
  };

  const playNarration = (pageIndex: number, offset = 0) => {
    stopAudio();
    initAudioContext();

    const buffer = audioCache.current.get(pageIndex);
    if (!buffer) {
      // If not preloaded, fetch and play immediately
      setIsSpeaking(true);
      generateSpeech(story.pages[pageIndex]).then(data => {
        return decodeAudioData(data, audioContextRef.current!);
      }).then(audioBuffer => {
        audioCache.current.set(pageIndex, audioBuffer);
        startBuffer(audioBuffer, 0);
      }).catch(err => {
        console.error("Narration failed:", err);
        setIsSpeaking(false);
      });
      return;
    }

    startBuffer(buffer, offset);
  };

  const startBuffer = (buffer: AudioBuffer, offset: number) => {
    if (!audioContextRef.current) return;
    
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    
    source.onended = () => {
      if (!isPaused) {
        setIsSpeaking(false);
      }
    };

    currentSourceRef.current = source;
    startTimeRef.current = audioContextRef.current.currentTime - offset;
    source.start(0, offset);
    setIsSpeaking(true);
    setIsPaused(false);

    // Preload next 2 pages aggressively
    preloadPage(currentPage + 1);
    preloadPage(currentPage + 2);
  };

  const toggleNarration = () => {
    if (isPaused) {
      // Resume
      playNarration(currentPage, pauseTimeRef.current);
    } else if (isSpeaking) {
      // Pause
      if (currentSourceRef.current && audioContextRef.current) {
        pauseTimeRef.current = audioContextRef.current.currentTime - startTimeRef.current;
        currentSourceRef.current.stop();
        currentSourceRef.current = null;
        setIsPaused(true);
        setIsSpeaking(false);
      }
    } else {
      // Start from beginning
      playNarration(currentPage, 0);
    }
  };

  useEffect(() => {
    // Auto-play when page changes
    playNarration(currentPage);
    // Preload next one
    if (currentPage + 1 < totalPages) preloadPage(currentPage + 1);
    
    return () => stopAudio();
  }, [currentPage]);

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#2D0A4E] flex flex-col items-center overflow-hidden z-20">
      {/* Header */}
      <div className="w-full bg-black/60 backdrop-blur-xl p-4 border-b border-[#FFD700]/30 flex justify-between items-center z-30">
        <h2 className="text-xl font-bold text-[#FFD700] truncate max-w-[60%] drop-shadow-md urdu-text">
          {story.title}
        </h2>
        <button 
          onClick={onStop}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full font-black shadow-[0_4px_10px_rgba(255,0,0,0.3)] transition-all active:scale-95 border-2 border-red-400"
        >
          باہر نکلیں
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 w-full max-w-2xl px-6 pt-10 pb-32 overflow-y-auto flex flex-col items-center">
        <div className="relative w-full bg-white/10 backdrop-blur-2xl rounded-[45px] p-10 gold-border shadow-[0_0_50px_rgba(0,0,0,0.6)] min-h-[480px] flex flex-col justify-center overflow-hidden group">
           {/* Visual Flourishes */}
           <div className="absolute top-4 left-4 opacity-10 text-5xl animate-spin-slow">⭐</div>
           <div className="absolute bottom-4 right-4 opacity-10 text-5xl animate-spin-slow-reverse">⭐</div>
           
           <p className="text-2xl md:text-3xl leading-[2.6] text-white urdu-text mb-12 text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] font-semibold">
             {story.pages[currentPage]}
           </p>
           
           {/* Inner Controls: Start / Stop narration */}
           <div className="flex flex-col items-center space-y-6">
              <div className="flex items-center space-x-6 rtl:space-x-reverse">
                <button 
                  onClick={() => { stopAudio(); playNarration(currentPage, 0); }}
                  className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-500 hover:bg-red-500/40 transition-all"
                  title="Stop Narration"
                >
                  <span className="text-xl">⏹</span>
                </button>

                <button 
                  onClick={toggleNarration}
                  className="w-20 h-20 rounded-full bg-[#FFD700] text-[#2D0A4E] flex items-center justify-center shadow-[0_0_20px_rgba(255,215,0,0.4)] hover:scale-110 active:scale-90 transition-all"
                >
                  {isSpeaking ? (
                    <span className="text-3xl">⏸</span>
                  ) : (
                    <span className="text-3xl ml-1">▶</span>
                  )}
                </button>

                <div className="w-12 h-12 flex items-center justify-center">
                  {isSpeaking && (
                    <div className="flex items-end space-x-1 h-6">
                      <div className="w-1 bg-[#FFD700] animate-[bounce_0.6s_infinite]"></div>
                      <div className="w-1 bg-[#FFD700] animate-[bounce_0.8s_infinite] delay-100"></div>
                      <div className="w-1 bg-[#FFD700] animate-[bounce_1s_infinite] delay-200"></div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-[#FFD700] font-bold urdu-text text-lg opacity-80">
                {isSpeaking ? 'کہانی سنائی جا رہی ہے...' : isPaused ? 'کہانی رکی ہوئی ہے' : 'کہانی سننے کے لیے کلک کریں'}
              </div>
           </div>
        </div>
        
        <div className="mt-8 px-8 py-2 bg-black/40 rounded-full text-[#FFD700] font-black border border-[#FFD700]/30 backdrop-blur-md shadow-lg">
          صفحہ {currentPage + 1} از {totalPages}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-[#2D0A4E] via-[#2D0A4E] to-transparent flex justify-between items-center gap-6 z-30">
        <button
          onClick={handlePrev}
          disabled={currentPage === 0}
          className={`flex-1 py-5 rounded-3xl font-black border-2 transition-all flex items-center justify-center space-x-3 rtl:space-x-reverse ${
            currentPage === 0 
              ? 'opacity-20 border-gray-600 grayscale cursor-not-allowed' 
              : 'bg-white/5 border-[#FFD700]/40 text-[#FFD700] active:scale-95 hover:bg-[#FFD700]/20'
          }`}
        >
          <span className="text-2xl">◀</span>
          <span className="urdu-text text-xl">پیچھے</span>
        </button>
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages - 1}
          className={`flex-1 py-5 rounded-3xl font-black border-2 transition-all flex items-center justify-center space-x-3 rtl:space-x-reverse ${
            currentPage === totalPages - 1 
              ? 'opacity-20 border-gray-600 grayscale cursor-not-allowed' 
              : 'bg-gradient-to-r from-[#FFD700] to-[#E6B800] border-[#FFD700] text-[#2D0A4E] shadow-[0_10px_30px_rgba(255,215,0,0.4)] active:scale-95'
          }`}
        >
          <span className="urdu-text text-xl">{currentPage === totalPages - 1 ? 'ختم' : 'اگلا صفحہ'}</span>
          <span className="text-2xl">▶</span>
        </button>
      </div>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-slow-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }
        .animate-spin-slow-reverse {
          animation: spin-slow-reverse 15s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default StoryPlayer;
