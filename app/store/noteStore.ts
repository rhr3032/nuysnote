import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Note, NoteStore, NoteColor } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';
import { saveToStorage, loadFromStorage } from '@/lib/storage';
import { getPlainTextFromContent } from '@/lib/rich-text';

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

function commitNotes(state: NoteStoreState, notes: Note[]) {
  saveToStorage(notes);
  return {
    notes,
    filteredNotes: computeFilteredNotes(notes, state.searchQuery, state.selectedTags)
  };
}

function computeFilteredNotes(notes: Note[], searchQuery: string, selectedTags: string[]): Note[] {
  let filtered = notes.filter(note => !note.isArchived);

  // Apply search
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (note) =>
        note.title.toLowerCase().includes(query) ||
        getPlainTextFromContent(note.content).toLowerCase().includes(query) ||
        note.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  }

  // Apply tag filters
  if (selectedTags.length > 0) {
    filtered = filtered.filter((note) =>
      selectedTags.every((tag) => note.tags.includes(tag))
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

export const useNoteStore = create<NoteStoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      notes: [],
      searchQuery: '',
      selectedTags: [],
      viewMode: 'grid',
      filteredNotes: [], // Will be updated when state changes

      getAllTags: () => {
        const { notes } = get();
        const allTags = notes.flatMap(note => note.tags);
        return Array.from(new Set(allTags)).filter(tag => tag.trim() !== '');
      },

      getNotesByDateRange: (dateRange) => {
        const { notes } = get();

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
          color: noteData.color ?? colorPalette[0],
          id: uuidv4(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set((state) => {
          const updatedNotes = [newNote, ...state.notes];
          return commitNotes(state, updatedNotes);
        });
      },

      updateNote: (id, updates) => {
        set((state) => {
          const updatedNotes = state.notes.map((note) =>
            note.id === id
              ? { ...note, ...updates, updatedAt: new Date() }
              : note
          );
          return commitNotes(state, updatedNotes);
        });
      },

      deleteNote: (id) => {
        set((state) => {
          const updatedNotes = state.notes.filter((note) => note.id !== id);
          return commitNotes(state, updatedNotes);
        });
      },

      archiveNote: (id) => {
        set((state) => {
          const updatedNotes = state.notes.map((note) =>
            note.id === id ? { ...note, isArchived: true, updatedAt: new Date() } : note
          );
          return commitNotes(state, updatedNotes);
        });
      },

      unarchiveNote: (id) => {
        set((state) => {
          const updatedNotes = state.notes.map((note) =>
            note.id === id ? { ...note, isArchived: false, updatedAt: new Date() } : note
          );
          return commitNotes(state, updatedNotes);
        });
      },

      pinNote: (id) => {
        set((state) => {
          const updatedNotes = state.notes.map((note) =>
            note.id === id ? { ...note, isPinned: true, updatedAt: new Date() } : note
          );
          return commitNotes(state, updatedNotes);
        });
      },

      unpinNote: (id) => {
        set((state) => {
          const updatedNotes = state.notes.map((note) =>
            note.id === id ? { ...note, isPinned: false, updatedAt: new Date() } : note
          );
          return commitNotes(state, updatedNotes);
        });
      },

      replaceNotes: (notes) => {
        set((state) => commitNotes(state, notes));
      },

      syncFromStorage: () => {
        set((state) => {
          const storedNotes = loadFromStorage();
          return commitNotes(state, storedNotes);
        });
      },

      setSearchQuery: (query) => {
        set((state) => ({
          searchQuery: query,
          filteredNotes: computeFilteredNotes(state.notes, query, state.selectedTags)
        }));
      },

      setSelectedTags: (tags) => {
        set((state) => ({
          selectedTags: tags,
          filteredNotes: computeFilteredNotes(state.notes, state.searchQuery, tags)
        }));
      },

      setViewMode: (mode) => set({ viewMode: mode }),

      toggleTag: (tag) => {
        set((state) => {
          const isSelected = state.selectedTags.includes(tag);
          const newTags = isSelected
            ? state.selectedTags.filter(t => t !== tag)
            : [...state.selectedTags, tag];
          return {
            selectedTags: newTags,
            filteredNotes: computeFilteredNotes(state.notes, state.searchQuery, newTags)
          };
        });
      },
    }),
    {
      name: 'nuysnote-storage',
      onRehydrateStorage: () => {
        return (state) => {
          if (!state) return;

          // Load initial data from localStorage when store is hydrated
          const savedNotes = loadFromStorage();
          if (savedNotes.length > 0) {
            state.notes = savedNotes;
            state.filteredNotes = computeFilteredNotes(savedNotes, state.searchQuery, state.selectedTags);
          }
        };
      },
    }
  )
);