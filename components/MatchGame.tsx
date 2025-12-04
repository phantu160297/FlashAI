import React, { useState, useEffect, useRef } from 'react';
import { Deck, Flashcard } from '../types';
import { IconTimer, IconTrophy, IconRefresh } from './Icons';

interface MatchGameProps {
  deck: Deck;
  onRestart?: () => void;
}

interface GameCard {
  id: string; // Unique ID for the tile
  content: string;
  pronunciation?: string; // Add optional pronunciation field
  type: 'word' | 'definition';
  pairId: string; // ID of the original flashcard to check matches
}

const MatchGame: React.FC<MatchGameProps> = ({ deck, onRestart }) => {
  const [gameCards, setGameCards] = useState<GameCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<GameCard[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]); // Stores pairIds
  const [isWon, setIsWon] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [wrongPair, setWrongPair] = useState<GameCard[]>([]);
  
  const timerRef = useRef<number | null>(null);

  // Initialize Game
  useEffect(() => {
    startNewGame();
    return () => stopTimer();
  }, [deck]);

  const stopTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startNewGame = () => {
    stopTimer();
    setIsWon(false);
    setTimeElapsed(0);
    setMatchedPairs([]);
    setSelectedCards([]);
    setWrongPair([]);
    setGameStarted(true);

    // 1. Select up to 6 random cards from the deck to prevent overcrowding
    // If deck has fewer than 6, take all.
    const numPairs = Math.min(deck.cards.length, 6);
    const shuffledDeck = [...deck.cards].sort(() => 0.5 - Math.random());
    const selectedPairs = shuffledDeck.slice(0, numPairs);

    // 2. Split into terms and definitions
    const tiles: GameCard[] = [];
    selectedPairs.forEach(card => {
      tiles.push({
        id: `${card.id}-word`,
        content: card.word,
        pronunciation: card.pronunciation,
        type: 'word',
        pairId: card.id
      });
      tiles.push({
        id: `${card.id}-def`,
        content: card.definition,
        type: 'definition',
        pairId: card.id
      });
    });

    // 3. Shuffle tiles
    setGameCards(tiles.sort(() => 0.5 - Math.random()));

    // 4. Start Timer
    timerRef.current = window.setInterval(() => {
      setTimeElapsed(prev => prev + 0.1);
    }, 100);
  };

  const handleCardClick = (card: GameCard) => {
    if (isWon) return;
    
    // Ignore if already matched or selected
    if (matchedPairs.includes(card.pairId)) return;
    if (selectedCards.find(c => c.id === card.id)) return;
    
    // Ignore if 2 cards already selected (processing)
    if (selectedCards.length >= 2) return;

    const newSelected = [...selectedCards, card];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      const [first, second] = newSelected;
      
      if (first.pairId === second.pairId) {
        // MATCH!
        setMatchedPairs(prev => {
          const newMatched = [...prev, first.pairId];
          // Check win condition
          if (newMatched.length === gameCards.length / 2) {
            handleWin();
          }
          return newMatched;
        });
        setSelectedCards([]);
      } else {
        // NO MATCH
        setWrongPair([first, second]);
        setTimeout(() => {
          setSelectedCards([]);
          setWrongPair([]);
        }, 800);
      }
    }
  };

  const handleWin = () => {
    stopTimer();
    setIsWon(true);
  };

  const formatTime = (seconds: number) => {
    return seconds.toFixed(1);
  };

  return (
    <div className="flex flex-col h-full w-full max-w-5xl mx-auto">
      {/* Game Header / Stats */}
      <div className="flex justify-between items-center mb-6 px-4">
        <div className="flex items-center gap-2 text-indigo-900 font-mono text-xl font-bold bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100">
          <IconTimer className={gameStarted && !isWon ? "animate-pulse text-indigo-600" : "text-indigo-400"} />
          <span>{formatTime(timeElapsed)}s</span>
        </div>
        
        <button 
          onClick={startNewGame}
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-slate-100"
        >
          <IconRefresh size={18} />
          Restart
        </button>
      </div>

      {/* Game Grid */}
      <div className="flex-1 overflow-y-auto px-2 pb-10">
        {isWon ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] animate-fade-in-up">
            <div className="bg-yellow-100 p-6 rounded-full mb-6">
              <IconTrophy className="w-16 h-16 text-yellow-600" />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Great Job!</h2>
            <p className="text-slate-500 text-lg mb-8">You cleared the board in <span className="font-bold text-indigo-600">{formatTime(timeElapsed)} seconds</span>.</p>
            <button
              onClick={startNewGame}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all transform hover:scale-105 active:scale-95"
            >
              Play Again
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 select-none">
            {gameCards.map(card => {
              const isMatched = matchedPairs.includes(card.pairId);
              const isSelected = selectedCards.some(c => c.id === card.id);
              const isWrong = wrongPair.some(c => c.id === card.id);

              if (isMatched) {
                return <div key={card.id} className="invisible h-24 sm:h-32"></div>;
              }

              return (
                <div
                  key={card.id}
                  onClick={() => handleCardClick(card)}
                  className={`
                    relative h-32 sm:h-40 p-4 rounded-xl border-2 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 shadow-sm
                    ${isSelected 
                      ? 'border-indigo-500 bg-indigo-100 scale-[1.02] shadow-md z-10' 
                      : isWrong
                        ? 'border-red-500 bg-red-50 animate-shake'
                        : card.type === 'definition'
                          ? 'border-orange-200 bg-orange-50 hover:border-orange-300 hover:shadow-md'
                          : 'border-sky-200 bg-sky-50 hover:border-sky-300 hover:shadow-md'
                    }
                  `}
                >
                  <p className={`font-medium ${card.type === 'word' ? 'text-lg sm:text-xl text-slate-800' : 'text-sm sm:text-base text-slate-700'}`}>
                    {card.content}
                  </p>
                  
                  {/* Display Pronunciation for Word cards */}
                  {card.type === 'word' && card.pronunciation && (
                    <span className="text-slate-500 font-serif text-sm mt-1 opacity-80">
                      {card.pronunciation}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default MatchGame;