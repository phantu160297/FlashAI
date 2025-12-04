import React, { useState, useEffect } from 'react';
import { Flashcard } from '../types';
import { IconVolume } from './Icons';

interface FlashcardItemProps {
  card: Flashcard;
  isActive: boolean;
  onFlip?: () => void;
}

const FlashcardItem: React.FC<FlashcardItemProps> = ({ card, isActive, onFlip }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Reset flip state when the active card changes
  useEffect(() => {
    setIsFlipped(false);
  }, [card.id]);

  const handleCardClick = () => {
    setIsFlipped(!isFlipped);
    if (onFlip) onFlip();
  };

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card flip when clicking speaker
    
    if ('speechSynthesis' in window) {
      // Cancel any current speaking
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(card.word);
      utterance.lang = 'en-GB'; // Cambridge dictionary style (British English default, or use en-US)
      utterance.rate = 0.9; // Slightly slower for learning
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div 
      className="w-full max-w-2xl h-80 sm:h-96 perspective-1000 cursor-pointer group"
      onClick={handleCardClick}
    >
      <div 
        className={`
          relative w-full h-full duration-500 transform-style-3d transition-transform
          ${isFlipped ? 'rotate-y-180' : 'rotate-y-0'}
        `}
      >
        {/* Front Face */}
        <div className="absolute top-0 left-0 w-full h-full backface-hidden bg-white rounded-3xl shadow-lg border-2 border-indigo-50 flex flex-col items-center justify-center p-8">
          <span className="absolute top-6 left-6 text-xs font-semibold text-indigo-400 uppercase tracking-widest">
            Term
          </span>
          
          {/* Audio Button */}
          <button 
            onClick={handleSpeak}
            className={`
              absolute top-6 right-6 p-3 rounded-full transition-all duration-200
              ${isSpeaking 
                ? 'bg-indigo-100 text-indigo-600 scale-110' 
                : 'bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 hover:scale-110'
              }
            `}
            title="Listen to pronunciation"
          >
            <IconVolume size={24} className={isSpeaking ? 'animate-pulse' : ''} />
          </button>

          <h2 className="text-4xl sm:text-5xl font-bold text-slate-800 text-center break-words max-w-full mb-2">
            {card.word}
          </h2>
          
          {card.pronunciation && (
            <div className="flex items-center justify-center bg-slate-100 px-4 py-1.5 rounded-full mt-2">
              <span className="text-slate-600 text-lg font-serif tracking-wide">
                {card.pronunciation}
              </span>
            </div>
          )}
          
          <p className="absolute bottom-6 text-slate-400 text-sm animate-pulse">
            Tap to flip
          </p>
        </div>

        {/* Back Face */}
        <div className="absolute top-0 left-0 w-full h-full backface-hidden rotate-y-180 bg-indigo-50 rounded-3xl shadow-lg border-2 border-indigo-100 flex flex-col items-center justify-center p-8 text-center">
          <span className="absolute top-6 left-6 text-xs font-semibold text-indigo-500 uppercase tracking-widest">
            Vietnamese Meaning
          </span>
          
          <p className="text-2xl sm:text-3xl font-medium text-slate-800 leading-relaxed">
            {card.definition}
          </p>
          
          <div className="mt-8 pt-6 border-t border-indigo-100 w-full">
             <span className="block text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-2">Example</span>
            <p className="text-indigo-700 italic text-lg font-serif">
              "{card.example}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlashcardItem;