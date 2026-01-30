
import React from 'react';
import { LOADING_TEXT_URDU } from '../constants';

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-[#2D0A4E] flex flex-col items-center justify-center z-50 p-6 text-center">
      <div className="relative mb-8">
        <div className="w-24 h-24 border-4 border-gold border-t-transparent rounded-full animate-spin border-[#FFD700]"></div>
        <div className="absolute inset-0 flex items-center justify-center">
           <span className="text-4xl animate-pulse">✍️</span>
        </div>
      </div>
      <h2 className="text-3xl font-bold text-[#FFD700] mb-4 urdu-text" style={{ textShadow: '0 0 10px rgba(255,215,0,0.5)' }}>
        {LOADING_TEXT_URDU}
      </h2>
      <p className="text-purple-200 opacity-70 animate-bounce">ستارے سج رہے ہیں...</p>
    </div>
  );
};

export default LoadingScreen;
