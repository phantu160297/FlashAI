import React, { useState, useCallback } from 'react';
import { Deck } from '../types';
import FlashcardItem from './FlashcardItem';
import MatchGame from './MatchGame';
import { IconChevronLeft, IconChevronRight, IconRotate, IconX, IconBrain, IconGamepad } from './Icons';

interface StudyViewProps {
  deck: Deck;
  onExit: () => void;
}

type StudyMode = 'flashcards' | 'match';

const StudyView: React.FC<StudyViewProps> = ({ deck, onExit }) => {
  const [mode, setMode] = useState<StudyMode>('flashcards');
  
  // --- Flashcard Logic ---
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const nextCard = useCallback(() => {
    if (currentIndex < deck.cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, deck.cards.length]);

  const prevCard = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  const resetDeck = () => {
    setCurrentIndex(0);
  };

  // Keyboard navigation for Flashcards
  React.useEffect(() => {
    if (mode !== 'flashcards') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        nextCard();
      } else if (e.key === 'ArrowLeft') {
        prevCard();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextCard, prevCard, mode]);

  const progress = ((currentIndex + 1) / deck.cards.length) * 100;
  const isFinished = currentIndex === deck.cards.length - 1;

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto px-4 py-4">
      {/* Header & Tabs */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
           <button 
            onClick={onExit}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors flex items-center gap-2"
          >
            <IconX size={24} />
            <span className="hidden sm:inline font-medium">Back to Library</span>
          </button>
          
          <h2 className="text-xl font-bold text-slate-800 hidden sm:block truncate max-w-md">{deck.title}</h2>
          
          <div className="w-10 sm:hidden"></div> {/* Spacer for mobile */}
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex p-1 bg-slate-100 rounded-xl mx-auto max-w-md">
          <button
            onClick={() => setMode('flashcards')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all
              ${mode === 'flashcards' 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
              }
            `}
          >
            <IconBrain size={18} />
            Flashcards
          </button>
          <button
            onClick={() => setMode('match')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all
              ${mode === 'match' 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
              }
            `}
          >
            <IconGamepad size={18} />
            Match Game
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white rounded-3xl sm:border border-slate-100 sm:shadow-sm sm:p-8 min-h-[500px]">
        
        {mode === 'match' ? (
          <MatchGame deck={deck} />
        ) : (
          <div className="flex flex-col items-center h-full">
            {/* Flashcard Progress Bar */}
            <div className="w-full max-w-2xl mb-6 flex items-center justify-between text-sm text-slate-400 font-medium">
               <span>Card {currentIndex + 1} of {deck.cards.length}</span>
               <div className="w-32 h-1.5 bg-slate-100 rounded-full ml-4">
                 <div className="h-full bg-indigo-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
               </div>
            </div>

            <div className="flex-1 w-full flex flex-col items-center justify-center">
              <FlashcardItem 
                card={deck.cards[currentIndex]} 
                isActive={true} 
              />
            </div>
            
            {/* Navigation Controls */}
            <div className="flex items-center gap-6 sm:gap-12 mt-10">
              <button
                onClick={prevCard}
                disabled={currentIndex === 0}
                className="p-4 rounded-full bg-white border-2 border-slate-100 text-slate-700 shadow-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-indigo-50 hover:border-indigo-100 hover:text-indigo-600 transition-all"
              >
                <IconChevronLeft size={24} />
              </button>

              <button
                onClick={isFinished ? resetDeck : nextCard}
                className={`
                  px-8 py-3 rounded-full font-bold shadow-lg transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2
                  ${isFinished 
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white' 
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }
                `}
              >
                {isFinished ? (
                  <>
                    <IconRotate size={20} />
                    Start Over
                  </>
                ) : (
                  <>
                    Next
                    <IconChevronRight size={20} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyView;