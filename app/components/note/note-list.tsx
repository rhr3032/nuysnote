import { Note } from '@/types';
import { NoteCard } from './note-card';
import { cn } from '@/lib/utils';

interface NoteListProps {
  notes: Note[];
  viewMode: 'grid' | 'list';
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
  onPin: (id: string) => void;
  onUnpin: (id: string) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

export function NoteList({
  notes,
  viewMode,
  onEdit,
  onDelete,
  onArchive,
  onUnarchive,
  onPin,
  onUnpin,
  emptyTitle = 'No notes yet',
  emptyDescription = 'Create your first note to get started',
  className
}: NoteListProps) {
  if (notes.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center rounded-3xl border border-dashed border-black/10 bg-white/70 px-6 py-16 text-center text-gray-500 shadow-sm backdrop-blur-sm', className)}>
        <div className="text-5xl mb-4">📝</div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{emptyTitle}</h3>
        <p className="text-sm max-w-sm">{emptyDescription}</p>
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3', className)}>
        {notes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            onEdit={onEdit}
            onDelete={onDelete}
            onArchive={onArchive}
            onUnarchive={onUnarchive}
            onPin={onPin}
            onUnpin={onUnpin}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          onEdit={onEdit}
          onDelete={onDelete}
          onArchive={onArchive}
          onUnarchive={onUnarchive}
          onPin={onPin}
          onUnpin={onUnpin}
        />
      ))}
    </div>
  );
}