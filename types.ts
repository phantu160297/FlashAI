export interface Flashcard {
  id: string;
  word: string;
  definition: string;
  example: string;
  pronunciation?: string;
}

export interface Deck {
  id: string;
  title: string;
  description: string;
  folder?: string;
  cards: Flashcard[];
  createdAt: number;
  icon?: string;
  
  // New fields for User System
  userId: string;
  authorName: string;
  isPublic: boolean;
}

export interface User {
  id: string;
  username: string;
  password: string; // Note: Storing plain text for demo only.
  fullName: string;
}

export type AppView = 'home' | 'create' | 'study' | 'community';

export interface GenerationParams {
  topic: string;
  count: number;
  level: string;
}