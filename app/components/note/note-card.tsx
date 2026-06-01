import { useState } from 'react';
import Image from 'next/image';
import { Note } from '@/types';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Pin, Archive, ArchiveRestore, Trash2, Edit, Calendar, Tag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { NOTE_COLORS } from '@/types';
import { getPlainTextFromContent } from '@/lib/rich-text';

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
  onPin: (id: string) => void;
  onUnpin: (id: string) => void;
}

export function NoteCard({
  note,
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

  return (
    <Card
      className={`relative overflow-hidden border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
        note.color ? NOTE_COLORS[note.color as keyof typeof NOTE_COLORS] : 'bg-white border-gray-200'
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 flex-1 font-semibold text-gray-900 truncate pr-2">
            {note.title || 'Untitled Note'}
          </h3>
          <div className="flex gap-1">
            {note.isPinned && (
              <Pin className="h-4 w-4 text-yellow-500 shrink-0" />
            )}
            {note.isArchived && (
              <Archive className="h-4 w-4 text-gray-500 shrink-0" />
            )}
          </div>
        </div>

        <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
          <Calendar className="h-3 w-3" />
          {formatDistanceToNow(note.updatedAt, { addSuffix: true })}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {contentPreview && (
          <p className="text-sm text-gray-700 mb-3 whitespace-pre-wrap line-clamp-4">
            {contentPreview}
          </p>
        )}

        {note.images && note.images.length > 0 && (
          <div className="mb-3 grid grid-cols-2 gap-2">
            {note.images.slice(0, 4).map((image, index) => (
              <div
                key={`${image}-${index}`}
                className="relative aspect-square overflow-hidden rounded-xl border border-white/70 bg-black/5"
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
              <div className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-black/15 bg-black/5 text-sm font-medium text-gray-600">
                +{note.images.length - 4}
              </div>
            )}
          </div>
        )}

        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {note.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
              >
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </span>
            ))}
            {note.tags.length > 3 && (
              <span className="text-xs text-gray-500">
                +{note.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-black/5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(note)}
            className="h-8 px-2 text-xs"
          >
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </Button>

          <div className="flex gap-1">
            {note.isPinned ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onUnpin(note.id)}
                className="h-8 px-2 text-xs"
              >
                <Pin className="h-3 w-3 mr-1" />
                Unpin
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPin(note.id)}
                className="h-8 px-2 text-xs"
              >
                <Pin className="h-3 w-3 mr-1" />
                Pin
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => (note.isArchived ? onUnarchive(note.id) : onArchive(note.id))}
              className="h-8 px-2 text-xs"
            >
              {note.isArchived ? (
                <ArchiveRestore className="h-3 w-3 mr-1" />
              ) : (
                <Archive className="h-3 w-3 mr-1" />
              )}
              {note.isArchived ? 'Restore' : 'Archive'}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="h-8 px-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}