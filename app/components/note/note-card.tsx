import { useState } from 'react';
import Image from 'next/image';
import { Note } from '@/types';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Pin, Archive, ArchiveRestore, Trash2, Edit, Calendar, Tag, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { NOTE_COLORS } from '@/types';
import { getPlainTextFromContent } from '@/lib/rich-text';

interface NoteCardProps {
  note: Note;
  onView: (note: Note) => void;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
  onPin: (id: string) => void;
  onUnpin: (id: string) => void;
}

export function NoteCard({
  note,
  onView,
  onEdit,
  onDelete,
  onArchive,
  onUnarchive,
  onPin,
  onUnpin
}: NoteCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = () => {
    setIsDeleting(true);
    setTimeout(() => {
      onDelete(note.id);
      setIsDeleting(false);
    }, 300);
  };

  const plainContent = getPlainTextFromContent(note.content);
  const contentPreview = plainContent.length > 100
    ? plainContent.substring(0, 100) + '...'
    : plainContent;
  const colorClass = note.color ? NOTE_COLORS[note.color as keyof typeof NOTE_COLORS] : 'bg-white border-gray-200';

  return (
    <Card
      className={`group relative h-fit overflow-hidden rounded-[1.75rem] border bg-white/95 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl ${colorClass}`}
    >
      <div className="h-1 w-full bg-black/10 opacity-50" />

      <CardHeader className="space-y-3 pb-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 flex-1 truncate pr-2 text-[1.05rem] font-semibold tracking-tight text-slate-950">
            {note.title || 'Untitled Note'}
          </h3>
          <div className="flex items-center gap-2">
            {note.isPinned && (
              <Pin className="h-4 w-4 shrink-0 text-yellow-500" />
            )}
            {note.isArchived && (
              <Archive className="h-4 w-4 shrink-0 text-gray-500" />
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Calendar className="h-3.5 w-3.5" />
          {formatDistanceToNow(note.updatedAt, { addSuffix: true })}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {contentPreview && (
          <p className="line-clamp-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {contentPreview}
          </p>
        )}

        {note.images && note.images.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {note.images.slice(0, 4).map((image, index) => (
              <div
                key={`${image}-${index}`}
                className="relative aspect-square overflow-hidden rounded-2xl border border-white/70 bg-black/5"
              >
                <Image
                  src={image}
                  alt={note.title || 'Note attachment'}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ))}
            {note.images.length > 4 && (
              <div className="flex aspect-square items-center justify-center rounded-2xl border border-dashed border-black/15 bg-black/5 text-sm font-medium text-gray-600">
                +{note.images.length - 4}
              </div>
            )}
          </div>
        )}

        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {note.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center rounded-full border border-white/70 bg-white/70 px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm"
              >
                <Tag className="mr-1 h-3 w-3" />
                {tag}
              </span>
            ))}
            {note.tags.length > 3 && (
              <span className="text-xs text-slate-500">
                +{note.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        <div className="border-t border-black/5 pt-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView(note)}
              className="h-9 rounded-full px-3 text-xs font-medium"
            >
              <Eye className="mr-1 h-3 w-3" />
              View
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(note)}
              className="h-9 rounded-full px-3 text-xs font-medium"
            >
              <Edit className="mr-1 h-3 w-3" />
              Edit
            </Button>

            {note.isPinned ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onUnpin(note.id)}
                className="h-9 rounded-full px-3 text-xs font-medium"
              >
                <Pin className="mr-1 h-3 w-3" />
                Unpin
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPin(note.id)}
                className="h-9 rounded-full px-3 text-xs font-medium"
              >
                <Pin className="mr-1 h-3 w-3" />
                Pin
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => (note.isArchived ? onUnarchive(note.id) : onArchive(note.id))}
              className="h-9 rounded-full px-3 text-xs font-medium"
            >
              {note.isArchived ? (
                <ArchiveRestore className="mr-1 h-3 w-3" />
              ) : (
                <Archive className="mr-1 h-3 w-3" />
              )}
              {note.isArchived ? 'Restore' : 'Archive'}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="h-9 rounded-full px-3 text-xs font-medium text-red-500 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="mr-1 h-3 w-3" />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}