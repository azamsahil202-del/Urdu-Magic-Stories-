
import React, { useState } from 'react';
import { AppState, StoryTheme, StoryContent } from './types';
import { 
  THEMES, 
  APP_TITLE_URDU, 
  CUSTOM_STORY_QUESTION, 
  CUSTOM_STORY_LABEL, 
  START_MAGIC_BUTTON 
} from './constants';
import { generateStory } from './services/geminiService';
import LoadingScreen from './components/LoadingScreen';
import StoryPlayer from './components/StoryPlayer';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.HOME);
  const [currentStory, setCurrentStory] = useState<StoryContent | null>(null);
  const [customTopic, setCustomTopic] = useState('');

  const startStory = async (theme: StoryTheme | string) => {
    let prompt = typeof theme === 'string' ? `Generate an immersive Urdu magic story about: ${theme}` : theme.prompt;
    
    setState(AppState.LOADING);
    try {
      const story = await generateStory(prompt);
      setCurrentStory(story);
      setState(AppState.STORY_PLAYER);
    } catch (error) {
      console.error("Error generating story:", error);
      alert("معذرت، کہانی لکھتے وقت کچھ غلطی ہو گئی۔ دوبارہ کوشش کریں۔");
      setState(AppState.HOME);
    }
  };

  const handleStop = () => {
    setState(AppState.HOME);
    setCurrentStory(null);
  };

  return (
    <div className="min-h-screen w-full bg-[#2D0A4E] bg-gradient-to-b from-[#2D0A4E] via-[#1a062e] to-black flex flex-col items-center overflow-x-hidden relative">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[10%] left-[5%] w-1 h-1 bg-white rounded-full animate-pulse"></div>
        <div className="absolute top-[30%] right-[10%] w-1.5 h-1.5 bg-[#FFD700] rounded-full animate-pulse delay-500"></div>
        <div className="absolute bottom-[20%] left-[15%] w-1 h-1 bg-white rounded-full animate-pulse delay-1000"></div>
        <div className="absolute top-[50%] left-[50%] w-2 h-2 bg-[#FFD700] rounded-full blur-[1px] opacity-10"></div>
      </div>

      {state === AppState.HOME && (
        <div className="w-full max-w-lg px-6 py-12 flex flex-col items-center z-10">
          {/* Header Section */}
          <div className="mb-10 text-center">
            <h1 className="text-6xl md:text-8xl font-bold text-[#FFD700] mb-6 animate-float drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] urdu-text">
              {APP_TITLE_URDU}
            </h1>
            <p className="text-white text-2xl md:text-3xl font-bold mb-8 urdu-text drop-shadow-[0_0_8px_rgba(255,215,0,0.3)]">
              {CUSTOM_STORY_QUESTION}
            </p>
          </div>

          {/* Dashing & Fancy Custom Input Area */}
          <div className="w-full relative group mb-12">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#FFD700] via-purple-500 to-[#FFD700] rounded-[40px] blur opacity-25 group-hover:opacity-60 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
            
            <div className="relative w-full bg-black/60 backdrop-blur-2xl rounded-[38px] p-8 border border-[#FFD700]/30 shadow-2xl">
               <div className="absolute -top-4 right-8 bg-[#FFD700] text-[#2D0A4E] px-6 py-1.5 rounded-full text-lg font-black shadow-[0_4px_10px_rgba(0,0,0,0.5)] urdu-text transform rotate-2">
                 {CUSTOM_STORY_LABEL}
               </div>
               
               <textarea
                 value={customTopic}
                 onChange={(e) => setCustomTopic(e.target.value)}
                 placeholder="مثال: ایک بہادر شہزادہ اور اس کا جادوئی گھوڑا جو آسمان میں اڑتا تھا..."
                 dir="rtl"
                 className="w-full bg-transparent text-[#FFD700] text-2xl p-4 urdu-text focus:outline-none min-h-[140px] placeholder:text-white/20 placeholder:italic resize-none leading-relaxed"
               />
               
               <div className="flex justify-center mt-6">
                  <button
                    onClick={() => customTopic.trim() && startStory(customTopic)}
                    disabled={!customTopic.trim()}
                    className={`px-12 py-4 rounded-2xl font-black transition-all transform flex items-center space-x-3 rtl:space-x-reverse ${
                      customTopic.trim() 
                      ? 'bg-[#FFD700] text-[#2D0A4E] shadow-[0_0_20px_rgba(255,215,0,0.5)] hover:scale-105 active:scale-95' 
                      : 'bg-white/10 text-white/30 cursor-not-allowed'
                    }`}
                  >
                    <span className="text-2xl animate-spin-slow">✨</span>
                    <span className="urdu-text text-xl">{START_MAGIC_BUTTON}</span>
                  </button>
               </div>
            </div>
          </div>

          {/* Quick Theme Selection Grid */}
          <div className="w-full grid grid-cols-2 gap-6">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => startStory(theme)}
                className="flex flex-col items-center justify-center p-6 bg-white/5 border-2 border-[#FFD700]/20 rounded-[35px] transition-all hover:bg-[#FFD700]/20 hover:border-[#FFD700]/70 hover:scale-[1.05] active:scale-95 group relative overflow-hidden shadow-lg"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-[#FFD700]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="text-5xl mb-3 transform group-hover:rotate-12 transition-transform drop-shadow-md">{theme.icon}</span>
                <span className="text-xl font-bold text-white urdu-text group-hover:text-[#FFD700] transition-colors">{theme.titleUrdu}</span>
                <span className="text-[11px] text-[#FFD700] font-black uppercase tracking-widest mt-2 opacity-30 group-hover:opacity-100">{theme.titleEnglish}</span>
              </button>
            ))}
          </div>

          <div className="mt-16 py-4 px-10 bg-black/40 rounded-full border border-white/5 text-purple-300/40 text-xs font-bold tracking-[0.3em] uppercase backdrop-blur-sm">
            Magic Pen Studio
          </div>
        </div>
      )}

      {state === AppState.LOADING && <LoadingScreen />}

      {state === AppState.STORY_PLAYER && currentStory && (
        <StoryPlayer story={currentStory} onStop={handleStop} />
      )}
    </div>
  );
};

export default App;
