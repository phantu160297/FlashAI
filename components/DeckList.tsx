import React from 'react';
import { Deck, User } from '../types';
import { IconLibrary, IconPlay, IconTrash, IconPlus, IconPencil, IconGlobe, IconLock, IconUser } from './Icons';

interface DeckListProps {
  decks: Deck[];
  currentUser: User;
  onSelectDeck: (deck: Deck) => void;
  onEditDeck: (deck: Deck) => void;
  onDeleteDeck: (id: string) => void;
  onCreateNew?: () => void;
  isCommunityView?: boolean;
}

const DeckList: React.FC<DeckListProps> = ({ decks, currentUser, onSelectDeck, onEditDeck, onDeleteDeck, onCreateNew, isCommunityView }) => {
  if (decks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4 animate-fade-in">
        <div className="bg-indigo-50 p-6 rounded-full mb-6">
          <IconLibrary className="w-12 h-12 text-indigo-400" />
        </div>
        <h3 className="text-2xl font-bold text-slate-800 mb-2">
          {isCommunityView ? 'No public decks found' : 'No flashcard sets yet'}
        </h3>
        <p className="text-slate-500 max-w-md mb-8">
          {isCommunityView 
            ? 'Be the first to share your study sets with the community!' 
            : 'Create your first vocabulary set to start learning.'}
        </p>
        {!isCommunityView && onCreateNew && (
          <button 
            onClick={onCreateNew}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-indigo-200"
          >
            <IconPlus size={20} />
            Create Your First Set
          </button>
        )}
      </div>
    );
  }

  // Group decks by folder
  const groupedDecks = decks.reduce((acc, deck) => {
    const folder = deck.folder || 'Uncategorized';
    if (!acc[folder]) {
      acc[folder] = [];
    }
    acc[folder].push(deck);
    return acc;
  }, {} as Record<string, Deck[]>);

  // Sort folders (Uncategorized last)
  const sortedFolders = Object.keys(groupedDecks).sort((a, b) => {
    if (a === 'Uncategorized') return 1;
    if (b === 'Uncategorized') return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="space-y-12">
      {sortedFolders.map((folder) => (
        <div key={folder} className="animate-fade-in">
          <div className="flex items-center gap-3 mb-6">
            <h3 className="text-xl font-bold text-slate-700 border-l-4 border-indigo-500 pl-3">
              {folder}
            </h3>
            <span className="text-xs font-semibold bg-slate-100 text-slate-500 px-2 py-1 rounded-full">
              {groupedDecks[folder].length}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groupedDecks[folder].map((deck) => {
              const isOwner = deck.userId === currentUser.id;
              
              return (
                <div 
                  key={deck.id}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col group"
                >
                  <div className="p-6 flex-1 cursor-pointer" onClick={() => onSelectDeck(deck)}>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">{deck.title}</h3>
                      <div className="flex gap-1">
                        {deck.isPublic ? (
                          <span className="bg-emerald-50 text-emerald-600 p-1 rounded" title="Public"><IconGlobe size={14} /></span>
                        ) : (
                          <span className="bg-slate-100 text-slate-500 p-1 rounded" title="Private"><IconLock size={14} /></span>
                        )}
                        <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap flex items-center">
                          {deck.cards.length} cards
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-slate-500 text-sm line-clamp-3 mb-4 h-10">
                      {deck.description}
                    </p>
                    
                    <div className="flex justify-between items-end mt-2">
                       <div className="text-xs text-slate-400">
                        {isCommunityView && (
                          <div className="flex items-center gap-1 mb-1 text-slate-500 font-medium">
                            <IconUser size={12} />
                            {deck.authorName || 'Unknown'}
                          </div>
                        )}
                        Created {new Date(deck.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-between items-center">
                     <div className="flex gap-2">
                      {isOwner && (
                        <>
                          <button 
                            onClick={() => onDeleteDeck(deck.id)}
                            className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50"
                            title="Delete Set"
                          >
                            <IconTrash size={18} />
                          </button>
                          <button 
                            onClick={() => onEditDeck(deck)}
                            className="text-slate-400 hover:text-indigo-600 transition-colors p-2 rounded-full hover:bg-indigo-50"
                            title="Edit Set"
                          >
                            <IconPencil size={18} />
                          </button>
                        </>
                      )}
                     </div>
                    <button 
                      onClick={() => onSelectDeck(deck)}
                      className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-md hover:shadow-indigo-200"
                    >
                      <IconPlay size={16} fill="currentColor" />
                      Study
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DeckList;