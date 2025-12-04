import React, { useState, useEffect } from 'react';
import { generateVocabularyDeck } from '../services/geminiService';
import { IconSparkles, IconRotate, IconPlus, IconTrash, IconPenTool, IconGlobe, IconLock } from './Icons';
import { Deck, Flashcard, User } from '../types';

// Simple UUID generator
const generateId = () => {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
};

interface CreateDeckProps {
  initialDeck?: Deck | null; // Pass a deck to edit
  currentUser: User;
  onDeckCreated: (deck: Deck) => void;
  onCancel: () => void;
  existingFolders: string[];
}

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const CreateDeck: React.FC<CreateDeckProps> = ({ initialDeck, currentUser, onDeckCreated, onCancel, existingFolders }) => {
  // Set default mode to 'manual' since it's now on the left (first tab)
  const [mode, setMode] = useState<'ai' | 'manual'>('manual');
  
  // Shared State
  const [folder, setFolder] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  
  // AI State
  const [topic, setTopic] = useState('');
  const [selectedLevels, setSelectedLevels] = useState<string[]>(['B1']);
  const [cardCount, setCardCount] = useState<number>(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Manual State
  const [manualTitle, setManualTitle] = useState('');
  const [manualDesc, setManualDesc] = useState('');
  const [manualCards, setManualCards] = useState<Omit<Flashcard, 'id'>[]>([
    { word: '', definition: '', pronunciation: '', example: '' }
  ]);

  // Load initial deck data if editing
  useEffect(() => {
    if (initialDeck) {
      setMode('manual');
      setFolder(initialDeck.folder || '');
      setManualTitle(initialDeck.title);
      setManualDesc(initialDeck.description);
      setIsPublic(initialDeck.isPublic || false);
      
      // Map existing cards. We treat them as editable inputs.
      const cardsForEdit = initialDeck.cards.map(c => ({
        word: c.word,
        definition: c.definition,
        pronunciation: c.pronunciation || '',
        example: c.example
      }));
      setManualCards(cardsForEdit);
    }
  }, [initialDeck]);

  const toggleLevel = (l: string) => {
    setSelectedLevels(prev => {
      if (prev.includes(l)) {
        return prev.filter(item => item !== l);
      } else {
        return [...prev, l];
      }
    });
  };

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    
    if (selectedLevels.length === 0) {
      setAiError('Please select at least one proficiency level.');
      return;
    }

    setIsGenerating(true);
    setAiError(null);

    try {
      const data = await generateVocabularyDeck({
        topic,
        level: selectedLevels.join(', '),
        count: cardCount,
      });

      const newDeck: Deck = {
        id: generateId(),
        title: data.title,
        description: data.description,
        folder: folder.trim() || 'General',
        userId: currentUser.id,
        authorName: currentUser.fullName,
        isPublic: isPublic,
        createdAt: Date.now(),
        cards: data.cards.map(card => ({
          ...card,
          id: generateId()
        }))
      };

      onDeckCreated(newDeck);
    } catch (err) {
      setAiError('Failed to generate deck. Please check your connection or try a different topic.');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) return;

    // Filter out empty cards
    const validCards = manualCards.filter(c => c.word.trim() && c.definition.trim());
    
    if (validCards.length === 0) {
      alert("Please add at least one card with a word and definition.");
      return;
    }

    const newDeck: Deck = {
      // If editing, keep the old ID and creation time, otherwise generate new
      id: initialDeck ? initialDeck.id : generateId(),
      title: manualTitle,
      description: manualDesc,
      folder: folder.trim() || 'General',
      userId: currentUser.id,
      authorName: currentUser.fullName,
      isPublic: isPublic,
      createdAt: initialDeck ? initialDeck.createdAt : Date.now(),
      cards: validCards.map(card => ({
        ...card,
        id: generateId() 
      }))
    };

    onDeckCreated(newDeck);
  };

  const updateManualCard = (index: number, field: keyof Omit<Flashcard, 'id'>, value: string) => {
    const newCards = [...manualCards];
    newCards[index] = { ...newCards[index], [field]: value };
    setManualCards(newCards);
  };

  const addManualCardRow = () => {
    setManualCards([...manualCards, { word: '', definition: '', pronunciation: '', example: '' }]);
  };

  const removeManualCardRow = (index: number) => {
    if (manualCards.length > 0) {
      const newCards = manualCards.filter((_, i) => i !== index);
      setManualCards(newCards);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        
        {/* Tabs */}
        <div className="flex border-b border-slate-100">
           <button
            onClick={() => setMode('manual')}
            className={`flex-1 py-4 text-center font-medium text-sm sm:text-base transition-colors flex items-center justify-center gap-2
              ${mode === 'manual' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-50'}
            `}
          >
            <IconPenTool size={18} />
            {initialDeck ? 'Edit Manually' : 'Create Manually'}
          </button>
          <button
            onClick={() => setMode('ai')}
            className={`flex-1 py-4 text-center font-medium text-sm sm:text-base transition-colors flex items-center justify-center gap-2
              ${mode === 'ai' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-50'}
            `}
          >
            <IconSparkles size={18} />
            {initialDeck ? 'Regenerate with AI' : 'Generate with AI'}
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8">
          {/* Shared Settings (Visibility & Folder) */}
          <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Folder (Category)</label>
                <input
                  type="text"
                  value={folder}
                  onChange={(e) => setFolder(e.target.value)}
                  list="folders-list"
                  placeholder="e.g., English Basics"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white"
                />
                <datalist id="folders-list">
                  {existingFolders.map(f => <option key={f} value={f} />)}
                </datalist>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Visibility</label>
                <label className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${isPublic ? 'bg-indigo-100 border-indigo-300 text-indigo-800' : 'bg-white border-slate-200 text-slate-500'}`}>
                  <input 
                    type="checkbox" 
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <div className="flex items-center gap-2">
                    {isPublic ? <IconGlobe size={18} /> : <IconLock size={18} />}
                    <span className="font-medium">{isPublic ? 'Public (Everyone can see)' : 'Private (Only you)'}</span>
                  </div>
                </label>
              </div>
          </div>

          {mode === 'ai' ? (
            <form onSubmit={handleAiSubmit} className="space-y-6 max-w-xl mx-auto">
               <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 mb-6">
                <h3 className="text-lg font-bold text-indigo-900 mb-2">AI Magic</h3>
                <p className="text-indigo-700 text-sm">
                  Enter a topic like "Coffee Shop Vocabulary" or "Job Interview Terms", and we'll create a full study set for you instantly.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Topic</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Medical Terms, Fruits, Phrasal Verbs..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                  required
                  disabled={isGenerating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Level (CEFR)</label>
                <div className="grid grid-cols-6 gap-2">
                  {LEVELS.map((l) => {
                    const isSelected = selectedLevels.includes(l);
                    return (
                      <button
                        key={l}
                        type="button"
                        onClick={() => toggleLevel(l)}
                        className={`py-3 rounded-lg border text-sm font-bold transition-all
                          ${isSelected 
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md transform scale-105' 
                            : 'border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
                          }
                        `}
                      >
                        {l}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-400 mt-2">Select one or more levels.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Number of Cards: <span className="text-indigo-600 font-bold">{cardCount}</span>
                </label>
                <input
                  type="range"
                  min="5"
                  max="30"
                  step="1"
                  value={cardCount}
                  onChange={(e) => setCardCount(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  disabled={isGenerating}
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>5</span>
                  <span>30</span>
                </div>
              </div>

              {aiError && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm">
                  {aiError}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                 <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 py-3 px-6 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all"
                  disabled={isGenerating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-3 px-6 rounded-xl font-bold transition-all shadow-lg hover:shadow-indigo-200 flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <IconRotate className="animate-spin" size={20} />
                      Generating...
                    </>
                  ) : (
                    <>
                      <IconSparkles size={20} />
                      Generate Deck
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-8">
               <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    placeholder="e.g., Phrasal Verbs 101"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                    required
                  />
                </div>
               </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea
                  value={manualDesc}
                  onChange={(e) => setManualDesc(e.target.value)}
                  placeholder="What is this deck about?"
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-800">Flashcards</h3>
                  <button 
                    type="button"
                    onClick={addManualCardRow}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <IconPlus size={16} />
                    Add Card
                  </button>
                </div>
                
                <div className="space-y-4">
                  {manualCards.map((card, idx) => (
                    <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 relative group">
                      <button
                        type="button"
                        onClick={() => removeManualCardRow(idx)}
                        className="absolute top-4 right-4 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove card"
                      >
                        <IconTrash size={18} />
                      </button>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pr-8">
                        <div>
                          <input
                            type="text"
                            value={card.word}
                            onChange={(e) => updateManualCard(idx, 'word', e.target.value)}
                            placeholder="Word (Term)"
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none text-slate-800 font-medium"
                          />
                        </div>
                         <div>
                          <input
                            type="text"
                            value={card.pronunciation}
                            onChange={(e) => updateManualCard(idx, 'pronunciation', e.target.value)}
                            placeholder="IPA (e.g., /həˈləʊ/)"
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none font-serif text-slate-600"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <input
                            type="text"
                            value={card.definition}
                            onChange={(e) => updateManualCard(idx, 'definition', e.target.value)}
                            placeholder="Definition (Vietnamese)"
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            value={card.example}
                            onChange={(e) => updateManualCard(idx, 'example', e.target.value)}
                            placeholder="Example Sentence"
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none italic text-slate-600"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <button 
                  type="button"
                  onClick={addManualCardRow}
                  className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all font-medium flex items-center justify-center gap-2"
                >
                  <IconPlus size={20} />
                  Add Another Card
                </button>
              </div>

              <div className="flex gap-4 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 py-3 px-6 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-xl font-bold transition-all shadow-lg hover:shadow-indigo-200"
                >
                  {initialDeck ? 'Save Changes' : 'Create Deck'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateDeck;