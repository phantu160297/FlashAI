import React, { useState, useEffect } from 'react';
import { Deck, AppView, User } from './types';
import DeckList from './components/DeckList';
import CreateDeck from './components/CreateDeck';
import StudyView from './components/StudyView';
import AuthForm from './components/AuthForm';
import { IconPlus, IconBrain, IconLogOut, IconGlobe, IconLibrary, IconUser } from './components/Icons';

// Use a simple localStorage wrapper
const STORAGE_KEY_DECKS = 'flashai_decks';
const STORAGE_KEY_USERS = 'flashai_users';
const STORAGE_KEY_SESSION = 'flashai_session';

const App: React.FC = () => {
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  // App State
  const [view, setView] = useState<AppView>('home');
  const [decks, setDecks] = useState<Deck[]>([]);
  const [activeDeck, setActiveDeck] = useState<Deck | null>(null);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);

  // --- Initialization ---
  useEffect(() => {
    // Load Users
    const savedUsers = localStorage.getItem(STORAGE_KEY_USERS);
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    }

    // Load Decks
    const savedDecks = localStorage.getItem(STORAGE_KEY_DECKS);
    if (savedDecks) {
      try {
        setDecks(JSON.parse(savedDecks));
      } catch (e) {
        console.error("Failed to parse decks", e);
      }
    } else {
      // Create a default system deck if none exist
      // We assign it to a 'system' ID so it doesn't belong to any specific user initially, 
      // or we could migrate it later.
      const sampleDeck: Deck = {
        id: 'sample-1',
        title: 'Common Fruits (Trái cây thông dụng)',
        description: 'A simple collection of common fruits to get you started.',
        folder: 'English Basics',
        userId: 'system',
        authorName: 'System',
        isPublic: true,
        createdAt: Date.now(),
        cards: [
          { 
            id: '1', 
            word: 'Apple', 
            pronunciation: '/ˈæp.əl/',
            definition: 'Quả táo (một loại quả tròn, vỏ đỏ hoặc xanh, ruột trắng)', 
            example: 'An apple a day keeps the doctor away.' 
          },
          { 
            id: '2', 
            word: 'Banana', 
            pronunciation: '/bəˈnɑː.nə/',
            definition: 'Quả chuối (quả dài, cong, vỏ vàng khi chín)', 
            example: 'Monkeys love to eat bananas.' 
          },
          { 
            id: '3', 
            word: 'Cucumber', 
            pronunciation: '/ˈkjuː.kʌm.bər/',
            definition: 'Quả dưa chuột (một loại rau dài, vỏ xanh, thường dùng làm salad)', 
            example: 'She sliced the cucumber for the salad.' 
          }
        ]
      };
      setDecks([sampleDeck]);
      localStorage.setItem(STORAGE_KEY_DECKS, JSON.stringify([sampleDeck]));
    }

    // Check Session
    const session = localStorage.getItem(STORAGE_KEY_SESSION);
    if (session && savedUsers) {
      const allUsers = JSON.parse(savedUsers);
      const found = allUsers.find((u: User) => u.id === session);
      if (found) setCurrentUser(found);
    }
  }, []);

  // --- Persistence Effects ---
  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    }
  }, [users]);

  useEffect(() => {
    if (decks.length > 0) {
      localStorage.setItem(STORAGE_KEY_DECKS, JSON.stringify(decks));
    }
  }, [decks]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEY_SESSION, currentUser.id);
    } else {
      localStorage.removeItem(STORAGE_KEY_SESSION);
    }
  }, [currentUser]);

  // --- Auth Handlers ---
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setView('home');
  };

  const handleRegister = (newUser: User) => {
    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    setView('home');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('home'); // Reset view but AuthForm will take over
  };

  // --- Deck Handlers ---
  const handleDeckSave = (savedDeck: Deck) => {
    setDecks(prev => {
      const exists = prev.some(d => d.id === savedDeck.id);
      if (exists) {
        return prev.map(d => d.id === savedDeck.id ? savedDeck : d);
      }
      return [savedDeck, ...prev];
    });
    setEditingDeck(null);
    setView('home');
  };

  const handleSelectDeck = (deck: Deck) => {
    setActiveDeck(deck);
    setView('study');
  };

  const handleEditDeck = (deck: Deck) => {
    if (deck.userId !== currentUser?.id) {
      alert("You can only edit your own decks.");
      return;
    }
    setEditingDeck(deck);
    setView('create');
  };

  const handleDeleteDeck = (id: string) => {
    if (confirm('Are you sure you want to delete this deck?')) {
      setDecks(prev => prev.filter(d => d.id !== id));
    }
  };

  const handleCancelCreate = () => {
    setEditingDeck(null);
    setView('home');
  };

  // --- Filtering Logic ---
  const myDecks = currentUser 
    ? decks.filter(d => d.userId === currentUser.id)
    : [];

  const communityDecks = decks.filter(d => 
    d.isPublic && d.userId !== currentUser?.id
  );
  
  // Include system decks in community for now
  const systemDecks = decks.filter(d => d.userId === 'system');
  const communityDisplayDecks = [...systemDecks, ...communityDecks];

  // If not logged in, show Auth Screen
  if (!currentUser) {
    return <AuthForm onLogin={handleLogin} onRegister={handleRegister} users={users} />;
  }

  // Get folders for autocomplete based on *all* decks or just user decks? 
  // Probably just user decks to keep it clean.
  const existingFolders = Array.from(new Set(myDecks.map(d => d.folder).filter(Boolean) as string[]));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer group" 
            onClick={() => { setView('home'); setEditingDeck(null); }}
          >
            <div className="bg-indigo-600 p-1.5 rounded-lg group-hover:bg-indigo-700 transition-colors">
              <IconBrain className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">
              Flash<span className="text-indigo-600">AI</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-slate-600 font-medium text-sm">
              <div className="bg-indigo-100 p-2 rounded-full">
                <IconUser size={16} className="text-indigo-600" />
              </div>
              {currentUser.fullName}
            </div>

            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-500 transition-colors p-2"
              title="Logout"
            >
              <IconLogOut size={20} />
            </button>

            {view === 'home' && (
              <button
                onClick={() => { setEditingDeck(null); setView('create'); }}
                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 active:scale-95"
              >
                <IconPlus size={18} />
                <span className="hidden sm:inline">Create Set</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* Navigation Tabs (Only visible on Home/Community) */}
        {(view === 'home' || view === 'community') && (
          <div className="flex gap-4 mb-8 border-b border-slate-200 pb-1">
            <button 
              onClick={() => setView('home')}
              className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2
                ${view === 'home' 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-slate-500 hover:text-indigo-600 hover:border-indigo-200'
                }
              `}
            >
              <IconLibrary size={18} />
              My Library
            </button>
            <button 
              onClick={() => setView('community')}
              className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2
                ${view === 'community' 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-slate-500 hover:text-indigo-600 hover:border-indigo-200'
                }
              `}
            >
              <IconGlobe size={18} />
              Community
            </button>
          </div>
        )}

        {view === 'home' && (
          <div className="space-y-8 animate-fade-in">
             <div className="flex flex-col sm:flex-row justify-between items-end gap-4 pb-4 border-b border-slate-200/60">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Your Library</h2>
                <p className="text-slate-500">Manage and study your private vocabulary collections</p>
              </div>
            </div>
            <DeckList 
              decks={myDecks} 
              currentUser={currentUser}
              onSelectDeck={handleSelectDeck} 
              onEditDeck={handleEditDeck}
              onDeleteDeck={handleDeleteDeck}
              onCreateNew={() => { setEditingDeck(null); setView('create'); }}
              isCommunityView={false}
            />
          </div>
        )}

        {view === 'community' && (
          <div className="space-y-8 animate-fade-in">
             <div className="flex flex-col sm:flex-row justify-between items-end gap-4 pb-4 border-b border-slate-200/60">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Community Hub</h2>
                <p className="text-slate-500">Explore decks created by other learners around the world.</p>
              </div>
            </div>
            <DeckList 
              decks={communityDisplayDecks} 
              currentUser={currentUser}
              onSelectDeck={handleSelectDeck} 
              onEditDeck={handleEditDeck}
              onDeleteDeck={handleDeleteDeck}
              isCommunityView={true}
            />
          </div>
        )}

        {view === 'create' && (
          <div className="animate-fade-in-up">
            <CreateDeck 
              key={editingDeck ? editingDeck.id : 'new'} 
              initialDeck={editingDeck}
              currentUser={currentUser}
              onDeckCreated={handleDeckSave} 
              onCancel={handleCancelCreate} 
              existingFolders={existingFolders}
            />
          </div>
        )}

        {view === 'study' && activeDeck && (
          <div className="animate-fade-in">
            <StudyView 
              deck={activeDeck} 
              onExit={() => setView('home')} 
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 mt-auto">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-slate-400 text-sm">
            Powered by Google Gemini • Built with React & Tailwind
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;