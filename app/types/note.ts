export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  color: string;
  isPinned: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  images?: string[]; // Base64 encoded images
}

export interface NoteStore {
  notes: Note[];
  searchQuery: string;
  selectedTags: string[];
  viewMode: 'grid' | 'list';
  // Actions
  addNote: (note: Omit<Note, 'id'>) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  archiveNote: (id: string) => void;
  unarchiveNote: (id: string) => void;
  pinNote: (id: string) => void;
  unpinNote: (id: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedTags: (tags: string[]) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  toggleTag: (tag: string) => void;
}

export type NoteColor =
  | 'yellow'
  | 'blue'
  | 'green'
  | 'red'
  | 'purple'
  | 'pink'
  | 'orange'
  | 'gray';

export const NOTE_COLORS: Record<NoteColor, string> = {
  yellow: 'bg-yellow-100 border-yellow-300',
  blue: 'bg-blue-100 border-blue-300',
  green: 'bg-green-100 border-green-300',
  red: 'bg-red-100 border-red-300',
  purple: 'bg-purple-100 border-purple-300',
  pink: 'bg-pink-100 border-pink-300',
  orange: 'bg-orange-100 border-orange-300',
  gray: 'bg-gray-100 border-gray-300',
};