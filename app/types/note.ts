export type NoteColor =
  | 'yellow'
  | 'blue'
  | 'green'
  | 'red'
  | 'purple'
  | 'pink'
  | 'orange'
  | 'gray';

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  color: NoteColor;
  isPinned: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  images?: string[];
}

export interface NoteStore {
  notes: Note[];
  searchQuery: string;
  selectedTags: string[];
  viewMode: 'grid' | 'list';
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  archiveNote: (id: string) => void;
  unarchiveNote: (id: string) => void;
  pinNote: (id: string) => void;
  unpinNote: (id: string) => void;
  replaceNotes: (notes: Note[]) => void;
  syncFromStorage: () => void;
  setSearchQuery: (query: string) => void;
  setSelectedTags: (tags: string[]) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  toggleTag: (tag: string) => void;
}

export const NOTE_COLORS: Record<NoteColor, string> = {
  yellow: 'bg-gradient-to-br from-amber-100 via-yellow-100 to-amber-200 border-amber-300 text-amber-950',
  blue: 'bg-gradient-to-br from-sky-100 via-blue-100 to-cyan-200 border-sky-300 text-slate-950',
  green: 'bg-gradient-to-br from-emerald-100 via-green-100 to-lime-200 border-emerald-300 text-emerald-950',
  red: 'bg-gradient-to-br from-rose-100 via-red-100 to-orange-100 border-rose-300 text-rose-950',
  purple: 'bg-gradient-to-br from-violet-100 via-purple-100 to-fuchsia-200 border-violet-300 text-violet-950',
  pink: 'bg-gradient-to-br from-pink-100 via-rose-100 to-pink-200 border-pink-300 text-pink-950',
  orange: 'bg-gradient-to-br from-orange-100 via-amber-100 to-yellow-100 border-orange-300 text-orange-950',
  gray: 'bg-gradient-to-br from-slate-100 via-zinc-100 to-stone-200 border-slate-300 text-slate-950',
};