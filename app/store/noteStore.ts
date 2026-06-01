import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Note, NoteStore, NoteColor } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';
import { saveToStorage, loadFromStorage } from '@/lib/storage';

interface NoteStoreState extends NoteStore {
  // Computed properties
  filteredNotes: Note[];
  getAllTags: () => string[];
  getNotesByDateRange: (dateRange: 'today' | 'yesterday' | 'thisWeek' | 'thisMonth' | 'all') => Note[];
  clearSearch: () => void;
  clearFilters: () => void;
}

const colorPalette: NoteColor[] = [
  'yellow', 'blue', 'green', 'red', 'purple', 'pink', 'orange', 'gray'
];

export const useNoteStore = create<NoteStoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      notes: [],
      searchQuery: '',
      selectedTags: [],
      viewMode: 'grid',

      // Computed properties
      filteredNotes: computedFilteredNotes(get),

      getAllTags: () => {
        const { notes } = get();
        const allTags = notes.flatMap(note => note.tags);
        return Array.from(new Set(allTags)).filter(tag => tag.trim() !== '');
      },

      getNotesByDateRange: (dateRange) => {
        const { notes } = get();
        const now = new Date();

        switch (dateRange) {
          case 'today':
            return notes.filter(note => isToday(note.updatedAt));
          case 'yesterday':
            return notes.filter(note => isYesterday(note.updatedAt));
          case 'thisWeek':
            return notes.filter(note => isThisWeek(note.updatedAt));
          case 'thisMonth':
            return notes.filter(note => isThisMonth(note.updatedAt));
          default:
            return notes;
        }
      },

      clearSearch: () => set({ searchQuery: '' }),

      clearFilters: () => set({ searchQuery: '', selectedTags: [] }),

      // Actions
      addNote: (noteData) => {
        const newNote: Note = {
          ...noteData,
          id: uuidv4(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set((state) => {
          const updatedNotes = [newNote, ...state.notes];
          saveToStorage(updatedNotes);
          return { notes: updatedNotes };
        });
      },

      updateNote: (id, updates) => {
        set((state) => {
          const updatedNotes = state.notes.map((note) =>
            note.id === id
              ? { ...note, ...updates, updatedAt: new Date() }
              : note
          );
          saveToStorage(updatedNotes);
          return { notes: updatedNotes };
        });
      },

      deleteNote: (id) => {
        set((state) => {
          const updatedNotes = state.notes.filter((note) => note.id !== id);
          saveToStorage(updatedNotes);
          return { notes: updatedNotes };
        });
      },

      archiveNote: (id) => {
        set((state) => {
          const updatedNotes = state.notes.map((note) =>
            note.id === id ? { ...note, isArchived: true, updatedAt: new Date() } : note
          );
          saveToStorage(updatedNotes);
          return { notes: updatedNotes };
        });
      },

      unarchiveNote: (id) => {
        set((state) => {
          const updatedNotes = state.notes.map((note) =>
            note.id === id ? { ...note, isArchived: false, updatedAt: new Date() } : note
          );
          saveToStorage(updatedNotes);
          return { notes: updatedNotes };
        });
      },

      pinNote: (id) => {
        set((state) => {
          const updatedNotes = state.notes.map((note) =>
            note.id === id ? { ...note, isPinned: true, updatedAt: new Date() } : note
          );
          saveToStorage(updatedNotes);
          return { notes: updatedNotes };
        });
      },

      unpinNote: (id) => {
        set((state) => {
          const updatedNotes = state.notes.map((note) =>
            note.id === id ? { ...note, isPinned: false, updatedAt: new Date() } : note
          );
          saveToStorage(updatedNotes);
          return { notes: updatedNotes };
        });
      },

      setSearchQuery: (query) => set({ searchQuery: query }, true),

      setSelectedTags: (tags) => set({ selectedTags: tags }, true),

      setViewMode: (mode) => set({ viewMode: mode }),

      toggleTag: (tag) => {
        set((state) => {
          const isSelected = state.selectedTags.includes(tag);
          const newTags = isSelected
            ? state.selectedTags.filter(t => t !== tag)
            : [...state.selectedTags, tag];
          return { selectedTags: newTags };
        }, true);
      },
    }),
    {
      name: 'nuysnote-storage',
      onRehydrateStorage: () => {
        return (state) => {
          // Load initial data from localStorage when store is hydrated
          const savedNotes = loadFromStorage();
          if (savedNotes.length > 0) {
            state.notes = savedNotes;
          }
        };
      },
    }
  )
);

// Helper function to compute filtered notes
function computedFilteredNotes(state: NoteStoreState): Note[] {
  let filtered = state.notes;

  // Filter archived notes out by default
  filtered = filtered.filter(note => !note.isArchived);

  // Apply search
  if (state.searchQuery) {
    const query = state.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (note) =>
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query) ||
        note.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  }

  // Apply tag filters
  if (state.selectedTags.length > 0) {
    filtered = filtered.filter((note) =>
      state.selectedTags.every((tag) => note.tags.includes(tag))
    );
  }

  // Sort: pinned notes first, then by updated date (newest first)
  filtered.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });

  return filtered;
}