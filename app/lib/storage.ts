import { Note } from '@/types';

const STORAGE_KEY = 'nuysnote-notes';

const normalizeNoteDates = (note: Note): Note => ({
  ...note,
  createdAt: note.createdAt instanceof Date ? note.createdAt : new Date(note.createdAt),
  updatedAt: note.updatedAt instanceof Date ? note.updatedAt : new Date(note.updatedAt),
});

export const saveToStorage = (notes: Note[]): void => {
  try {
    if (typeof window === 'undefined') return;

    const serializedNotes = notes.map(note => ({
      ...note,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializedNotes));
  } catch (error) {
    console.error('Failed to save notes to localStorage:', error);
  }
};

export const loadFromStorage = (): Note[] => {
  try {
    if (typeof window === 'undefined') return [];

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return parsed.map((note: Note) => normalizeNoteDates(note));
  } catch (error) {
    console.error('Failed to load notes from localStorage:', error);
    return [];
  }
};

export const exportNotes = (): Note[] => {
  return loadFromStorage();
};

export const importNotes = (notes: Note[]): void => {
  saveToStorage(notes.map(note => normalizeNoteDates(note)));
};