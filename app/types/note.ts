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
  yellow: 'bg-[#fff7c2] border-[#e5d575] text-[#3a3412]',
  blue: 'bg-[#dbeafe] border-[#93c5fd] text-[#17324f]',
  green: 'bg-[#dcfce7] border-[#86efac] text-[#134e32]',
  red: 'bg-[#fee2e2] border-[#fca5a5] text-[#5f1f1f]',
  purple: 'bg-[#ede9fe] border-[#c4b5fd] text-[#3b245f]',
  pink: 'bg-[#fce7f3] border-[#f9a8d4] text-[#5f2144]',
  orange: 'bg-[#ffedd5] border-[#fdba74] text-[#5e3214]',
  gray: 'bg-[#f4f4f5] border-[#d4d4d8] text-[#27272a]',
};