'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import {
  Archive,
  Cloud,
  CloudOff,
  Download,
  FolderOpen,
  Grid2x2,
  ImagePlus,
  LayoutList,
  List,
  Palette,
  Pin,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Tag,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { Button } from '@/components/note/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/note/ui/card';
import { Input } from '@/components/note/ui/input';
import { NoteList } from '@/components/note/note-list';
import { RichTextEditor } from '@/components/note/rich-text-editor';
import { getPlainTextFromContent, hasMeaningfulContent } from '@/lib/rich-text';
import { NOTE_COLORS, Note, NoteColor } from '@/types';
import { useNoteStore } from '@/store/noteStore';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';

type CollectionFilter = 'active' | 'archived' | 'all';

type DraftNote = {
  title: string;
  content: string;
  tags: string[];
  color: NoteColor;
  isPinned: boolean;
  isArchived: boolean;
  images: string[];
};

const defaultDraft = (): DraftNote => ({
  title: '',
  content: '',
  tags: [],
  color: 'yellow',
  isPinned: false,
  isArchived: false,
  images: [],
});

const collectionItems: Array<{
  value: CollectionFilter;
  label: string;
  icon: typeof Sparkles;
  description: string;
}> = [
  {
    value: 'active',
    label: 'Active',
    icon: Sparkles,
    description: 'Current working notes',
  },
  {
    value: 'archived',
    label: 'Archived',
    icon: Archive,
    description: 'Saved away for later',
  },
  {
    value: 'all',
    label: 'All notes',
    icon: FolderOpen,
    description: 'Everything in one view',
  },
];

const colorOptions: Array<{ value: NoteColor; label: string }> = [
  { value: 'yellow', label: 'Warm' },
  { value: 'blue', label: 'Sky' },
  { value: 'green', label: 'Mint' },
  { value: 'red', label: 'Rose' },
  { value: 'purple', label: 'Violet' },
  { value: 'pink', label: 'Blush' },
  { value: 'orange', label: 'Amber' },
  { value: 'gray', label: 'Slate' },
];

const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });
};

const normalizeTag = (value: string) => value.trim().replace(/\s+/g, ' ');

const isValidColor = (value: string): value is NoteColor => {
  return value in NOTE_COLORS;
};

export default function Home() {
  const notes = useNoteStore((state) => state.notes);
  const searchQuery = useNoteStore((state) => state.searchQuery);
  const selectedTags = useNoteStore((state) => state.selectedTags);
  const viewMode = useNoteStore((state) => state.viewMode);
  const setSearchQuery = useNoteStore((state) => state.setSearchQuery);
  const setSelectedTags = useNoteStore((state) => state.setSelectedTags);
  const setViewMode = useNoteStore((state) => state.setViewMode);
  const toggleTag = useNoteStore((state) => state.toggleTag);
  const addNote = useNoteStore((state) => state.addNote);
  const updateNote = useNoteStore((state) => state.updateNote);
  const deleteNote = useNoteStore((state) => state.deleteNote);
  const archiveNote = useNoteStore((state) => state.archiveNote);
  const unarchiveNote = useNoteStore((state) => state.unarchiveNote);
  const pinNote = useNoteStore((state) => state.pinNote);
  const unpinNote = useNoteStore((state) => state.unpinNote);
  const replaceNotes = useNoteStore((state) => state.replaceNotes);
  const syncFromStorage = useNoteStore((state) => state.syncFromStorage);
  const getAllTags = useNoteStore((state) => state.getAllTags);

  const [collection, setCollection] = useState<CollectionFilter>('active');
  const [draft, setDraft] = useState<DraftNote>(defaultDraft);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [tagInput, setTagInput] = useState('');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const importInputRef = useRef<HTMLInputElement>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': [],
    },
    multiple: true,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;

      const imageUrls = await Promise.all(acceptedFiles.map(fileToDataUrl));
      setDraft((current) => ({
        ...current,
        images: [...current.images, ...imageUrls].slice(0, 8),
      }));
      setStatusMessage(`Added ${acceptedFiles.length} image${acceptedFiles.length === 1 ? '' : 's'}`);
    },
  });

  useEffect(() => {
    syncFromStorage();
  }, [syncFromStorage]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'nuysnote-notes') {
        syncFromStorage();
        setLastSyncedAt(new Date());
        setStatusMessage('Synced changes from another tab');
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [syncFromStorage]);

  useEffect(() => {
    if (!statusMessage) return;
    const timer = window.setTimeout(() => setStatusMessage(''), 2600);
    return () => window.clearTimeout(timer);
  }, [statusMessage]);

  const allTags = useMemo(() => getAllTags().sort((a, b) => a.localeCompare(b)), [getAllTags]);

  const visibleNotes = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const matchesCollection = (note: Note) => {
      if (collection === 'all') return true;
      if (collection === 'archived') return note.isArchived;
      return !note.isArchived;
    };

    const matchesSearch = (note: Note) => {
      if (!normalizedQuery) return true;
      const noteContent = getPlainTextFromContent(note.content);
      return (
        note.title.toLowerCase().includes(normalizedQuery) ||
        noteContent.toLowerCase().includes(normalizedQuery) ||
        note.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery))
      );
    };

    const matchesTags = (note: Note) => {
      if (selectedTags.length === 0) return true;
      return selectedTags.every((tag) => note.tags.includes(tag));
    };

    return [...notes]
      .filter(matchesCollection)
      .filter(matchesSearch)
      .filter(matchesTags)
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return b.updatedAt.getTime() - a.updatedAt.getTime();
      });
  }, [collection, notes, searchQuery, selectedTags]);

  const pinnedNotes = useMemo(() => visibleNotes.filter((note) => note.isPinned), [visibleNotes]);
  const regularNotes = useMemo(() => visibleNotes.filter((note) => !note.isPinned), [visibleNotes]);

  const activeCount = useMemo(() => notes.filter((note) => !note.isArchived).length, [notes]);
  const archivedCount = useMemo(() => notes.filter((note) => note.isArchived).length, [notes]);
  const pinnedCount = useMemo(() => notes.filter((note) => note.isPinned && !note.isArchived).length, [notes]);
  const imageCount = useMemo(() => notes.reduce((total, note) => total + (note.images?.length ?? 0), 0), [notes]);

  const resetDraft = () => {
    setDraft(defaultDraft());
    setEditingNoteId(null);
    setTagInput('');
    setEditorKey((current) => current + 1);
  };

  const addTagsFromInput = (value: string) => {
    const incomingTags = value
      .split(',')
      .map(normalizeTag)
      .filter(Boolean);

    if (incomingTags.length === 0) return;

    setDraft((current) => ({
      ...current,
      tags: Array.from(new Set([...current.tags, ...incomingTags])).slice(0, 12),
    }));
    setTagInput('');
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const title = draft.title.trim();
    const content = draft.content;
    const payload = {
      title,
      content,
      tags: draft.tags,
      color: draft.color,
      isPinned: draft.isPinned,
      isArchived: draft.isArchived,
      images: draft.images,
    };

    if (!title && !hasMeaningfulContent(content) && payload.tags.length === 0 && payload.images.length === 0) {
      setStatusMessage('Add a title, text, tag, or image before saving');
      return;
    }

    if (editingNoteId) {
      updateNote(editingNoteId, payload);
      setStatusMessage('Note updated');
    } else {
      addNote(payload);
      setStatusMessage('Note created');
    }

    resetDraft();
  };

  const handleEdit = (note: Note) => {
    setEditingNoteId(note.id);
    setEditorKey((current) => current + 1);
    setDraft({
      title: note.title,
      content: note.content,
      tags: [...note.tags],
      color: note.color,
      isPinned: note.isPinned,
      isArchived: note.isArchived,
      images: [...(note.images ?? [])],
    });
    setTagInput('');
    setStatusMessage('Editing note');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRemoveImage = (index: number) => {
    setDraft((current) => ({
      ...current,
      images: current.images.filter((_, imageIndex) => imageIndex !== index),
    }));
  };

  const handleImportedFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw);

      if (!Array.isArray(parsed)) {
        throw new Error('The selected file must contain a notes array.');
      }

      const importedNotes = parsed.map((item): Note => ({
        id: typeof item.id === 'string' && item.id.trim() ? item.id : (globalThis.crypto?.randomUUID?.() ?? uuidv4()),
        title: typeof item.title === 'string' ? item.title : '',
        content: typeof item.content === 'string' ? item.content : '',
        tags: Array.isArray(item.tags) ? item.tags.map((tag: unknown) => String(tag).trim()).filter(Boolean) : [],
        color: isValidColor(String(item.color)) ? (item.color as NoteColor) : 'yellow',
        isPinned: Boolean(item.isPinned),
        isArchived: Boolean(item.isArchived),
        createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
        updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
        images: Array.isArray(item.images) ? item.images.map((image: unknown) => String(image)).filter(Boolean) : [],
      }));

      replaceNotes(importedNotes);
      setStatusMessage(`Imported ${importedNotes.length} note${importedNotes.length === 1 ? '' : 's'}`);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Could not import notes');
    }
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(notes, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `nuysnote-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setStatusMessage('Export started');
  };

  const handleQuickAddTag = (tag: string) => {
    toggleTag(tag);
  };

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const filteredEmptyTitle =
    collection === 'archived'
      ? 'No archived notes'
      : searchQuery || selectedTags.length > 0
        ? 'No notes match your filters'
        : 'Your notes live here';

  const filteredEmptyDescription =
    collection === 'archived'
      ? 'Archive notes to keep them out of your workspace while preserving them for later.'
      : searchQuery || selectedTags.length > 0
        ? 'Try a different search term, switch tags, or clear the filters to see more notes.'
        : 'Create a note, add a label, or drop in an image to get started.';

  return (
    <main className="min-h-screen text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        <header className="mb-6 flex flex-col gap-4 rounded-4xl border border-white/70 bg-white/80 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl lg:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-amber-300 via-amber-200 to-orange-300 text-slate-950 shadow-md shadow-amber-200/50">
                <Sparkles className="h-7 w-7" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">NuysNote</h1>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                    Auto-synced locally
                  </span>
                </div>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                  Capture ideas, organize them with labels, pin what matters, and keep everything ready for export or a future cloud backend.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={handleImportClick} className="gap-2 rounded-full border-slate-200 bg-white/90">
                <Upload className="h-4 w-4" />
                Import
              </Button>
              <Button variant="outline" onClick={handleExport} className="gap-2 rounded-full border-slate-200 bg-white/90">
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button
                variant="outline"
                onClick={syncFromStorage}
                className="gap-2 rounded-full border-slate-200 bg-white/90"
              >
                {typeof navigator !== 'undefined' && navigator.onLine ? (
                  <Cloud className="h-4 w-4" />
                ) : (
                  <CloudOff className="h-4 w-4" />
                )}
                Sync
              </Button>
              <input ref={importInputRef} type="file" accept="application/json,.json" aria-label="Import notes JSON file" className="hidden" onChange={handleImportedFile} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Active" value={activeCount} helper="Notes available now" />
            <StatCard title="Archived" value={archivedCount} helper="Stored out of the way" />
            <StatCard title="Pinned" value={pinnedCount} helper="Priority notes" />
            <StatCard title="Images" value={imageCount} helper="Attachments in your library" />
          </div>

          {statusMessage && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {statusMessage}
            </div>
          )}
        </header>

        <div className="grid flex-1 gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            <Card className="overflow-hidden border-white/70 bg-white/80 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
              <CardHeader className="space-y-2">
                <CardTitle className="text-lg">Workspace</CardTitle>
                <CardDescription>Search, filter, and switch layouts in one place.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-[0.24em] text-slate-500">Search</label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search notes, tags, and content"
                      className="h-11 rounded-2xl border-slate-200 bg-slate-50/80 pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium uppercase tracking-[0.24em] text-slate-500">View</label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                      className="gap-2 rounded-full text-slate-600"
                    >
                      {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid2x2 className="h-4 w-4" />}
                      {viewMode === 'grid' ? 'List' : 'Grid'}
                    </Button>
                  </div>
                  <div className="flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
                    <button
                      type="button"
                      onClick={() => setViewMode('grid')}
                      className={cn(
                        'flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition',
                        viewMode === 'grid' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'
                      )}
                    >
                      <Grid2x2 className="h-4 w-4" />
                      Grid
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('list')}
                      className={cn(
                        'flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition',
                        viewMode === 'list' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'
                      )}
                    >
                      <LayoutList className="h-4 w-4" />
                      List
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium uppercase tracking-[0.24em] text-slate-500">Collections</label>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedTags([]);
                      }}
                      className="text-xs font-medium text-slate-500 transition hover:text-slate-950"
                    >
                      Clear filters
                    </button>
                  </div>
                  <div className="grid gap-2">
                    {collectionItems.map((item) => {
                      const Icon = item.icon;
                      const active = collection === item.value;
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => setCollection(item.value)}
                          className={cn(
                            'flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition',
                            active
                              ? 'border-amber-200 bg-amber-50 text-slate-950 shadow-sm'
                              : 'border-slate-200 bg-slate-50/70 text-slate-600 hover:border-slate-300 hover:bg-white'
                          )}
                        >
                          <span>
                            <span className="flex items-center gap-2 text-sm font-medium">
                              <Icon className="h-4 w-4" />
                              {item.label}
                            </span>
                            <span className="mt-1 block text-xs text-slate-500">{item.description}</span>
                          </span>
                          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                            {item.value === 'active' ? activeCount : item.value === 'archived' ? archivedCount : notes.length}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/70 bg-white/80 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
              <CardHeader className="space-y-2">
                <CardTitle className="text-lg">Labels</CardTitle>
                <CardDescription>Click to filter by one or more tags.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {allTags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {allTags.map((tag) => {
                      const active = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleQuickAddTag(tag)}
                          className={cn(
                            'rounded-full border px-3 py-1.5 text-sm transition',
                            active
                              ? 'border-amber-200 bg-amber-100 text-slate-950'
                              : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white'
                          )}
                        >
                          <span className="inline-flex items-center gap-1.5">
                            <Tag className="h-3.5 w-3.5" />
                            {tag}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No labels yet. Add a few tags when creating notes.</p>
                )}
              </CardContent>
            </Card>
          </aside>

          <section className="space-y-6">
            <Card className="overflow-hidden border-white/70 bg-white/80 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
              <CardHeader className="space-y-2 border-b border-slate-100 bg-linear-to-r from-white via-amber-50/60 to-orange-50/40">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Plus className="h-5 w-5 text-amber-500" />
                  {editingNoteId ? 'Edit note' : 'Create note'}
                </CardTitle>
                <CardDescription>
                  Pin it, color it, label it, or drop in images before you save.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 p-5 sm:p-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="space-y-3">
                      <Input
                        value={draft.title}
                        onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                        placeholder="Note title"
                        className="h-12 rounded-2xl border-slate-200 bg-slate-50/80 text-base"
                      />
                      <RichTextEditor
                        key={editorKey}
                        value={draft.content}
                        onChange={(value) => setDraft((current) => ({ ...current, content: value }))}
                        placeholder="Start writing your note..."
                      />
                    </div>

                    <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => setDraft((current) => ({ ...current, isPinned: !current.isPinned }))}
                          className={cn(
                            'flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition',
                            draft.isPinned
                              ? 'border-amber-200 bg-amber-100 text-slate-950'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                          )}
                        >
                          <Pin className="h-4 w-4" />
                          {draft.isPinned ? 'Pinned' : 'Pin note'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDraft((current) => ({ ...current, isArchived: !current.isArchived }))}
                          className={cn(
                            'flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition',
                            draft.isArchived
                              ? 'border-slate-300 bg-slate-200 text-slate-900'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                          )}
                        >
                          <Archive className="h-4 w-4" />
                          {draft.isArchived ? 'Archived' : 'Keep active'}
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.24em] text-slate-500">
                          <Tag className="h-4 w-4" />
                          Labels
                        </div>
                        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                          <Input
                            value={tagInput}
                            onChange={(event) => setTagInput(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ',') {
                                event.preventDefault();
                                addTagsFromInput(tagInput);
                              }
                              if (event.key === 'Backspace' && !tagInput && draft.tags.length > 0) {
                                setDraft((current) => ({
                                  ...current,
                                  tags: current.tags.slice(0, -1),
                                }));
                              }
                            }}
                            onBlur={() => addTagsFromInput(tagInput)}
                            placeholder="Add a tag and press Enter"
                            className="border-none bg-transparent px-1 shadow-none focus-visible:ring-0"
                          />
                          <Button type="button" variant="ghost" size="sm" onClick={() => addTagsFromInput(tagInput)} className="rounded-full">
                            Add
                          </Button>
                        </div>
                        {draft.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {draft.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-100 px-3 py-1.5 text-sm text-slate-800"
                              >
                                {tag}
                                <button
                                  type="button"
                                  onClick={() => setDraft((current) => ({ ...current, tags: current.tags.filter((currentTag) => currentTag !== tag) }))}
                                  aria-label={`Remove ${tag}`}
                                  className="rounded-full p-0.5 text-slate-500 transition hover:bg-white hover:text-slate-900"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.24em] text-slate-500">
                          <Palette className="h-4 w-4" />
                          Color
                        </div>
                        <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                          {colorOptions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setDraft((current) => ({ ...current, color: option.value }))}
                              className={cn(
                                'group flex flex-col items-center gap-2 rounded-2xl border px-2 py-3 text-xs transition',
                                draft.color === option.value
                                  ? 'border-slate-950 bg-white text-slate-950 shadow-md shadow-slate-200/70 ring-2 ring-slate-950/10'
                                  : 'border-slate-200 bg-white/80 text-slate-500 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-sm'
                              )}
                            >
                              <span className={cn('h-7 w-7 rounded-2xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]', NOTE_COLORS[option.value])} />
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.24em] text-slate-500">
                          <ImagePlus className="h-4 w-4" />
                          Images
                        </div>
                        <div
                          {...getRootProps()}
                          className={cn(
                            'cursor-pointer rounded-3xl border-2 border-dashed px-4 py-6 text-center transition',
                            isDragActive
                              ? 'border-amber-300 bg-amber-50'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          )}
                        >
                          <input {...getInputProps()} />
                          <Upload className="mx-auto mb-2 h-5 w-5 text-slate-400" />
                          <p className="text-sm font-medium text-slate-700">
                            {isDragActive ? 'Drop images here' : 'Drag images here or click to upload'}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">PNG, JPG, and WebP attachments stay inside the note.</p>
                        </div>
                        {draft.images.length > 0 && (
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {draft.images.map((image, index) => (
                              <div key={`${image}-${index}`} className="group relative h-24 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                <Image src={image} alt={`Attachment ${index + 1}`} fill className="object-cover" unoptimized />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveImage(index)}
                                  aria-label={`Remove image ${index + 1}`}
                                  className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-white opacity-0 transition group-hover:opacity-100"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <div className="text-sm text-slate-500">
                      {editingNoteId ? 'Updating an existing note' : 'New notes auto-save into local storage'}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {editingNoteId && (
                        <Button type="button" variant="outline" onClick={resetDraft} className="gap-2 rounded-full border-slate-200">
                          <RefreshCw className="h-4 w-4" />
                          Cancel edit
                        </Button>
                      )}
                      <Button type="submit" className="gap-2 rounded-full bg-slate-950 px-5 text-white hover:bg-slate-800">
                        {editingNoteId ? <Upload className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        {editingNoteId ? 'Save note' : 'Create note'}
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="border-white/70 bg-white/80 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
              <CardHeader className="space-y-3 border-b border-slate-100">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <CardTitle className="text-xl">Notes</CardTitle>
                    <CardDescription>
                      {visibleNotes.length} note{visibleNotes.length === 1 ? '' : 's'} in the current view.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 p-1">
                    <span className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-slate-500">
                      {typeof navigator !== 'undefined' && navigator.onLine ? (
                        <Cloud className="h-3.5 w-3.5" />
                      ) : (
                        <CloudOff className="h-3.5 w-3.5" />
                      )}
                      {lastSyncedAt ? `Last synced ${lastSyncedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : 'Sync ready'}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5 sm:p-6">
                {collection === 'archived' ? (
                  <NoteList
                    notes={visibleNotes}
                    viewMode={viewMode}
                    onEdit={handleEdit}
                    onDelete={deleteNote}
                    onArchive={archiveNote}
                    onUnarchive={unarchiveNote}
                    onPin={pinNote}
                    onUnpin={unpinNote}
                    emptyTitle={filteredEmptyTitle}
                    emptyDescription={filteredEmptyDescription}
                  />
                ) : (
                  <div className="space-y-8">
                    <NoteList
                      notes={pinnedNotes}
                      viewMode={viewMode}
                      onEdit={handleEdit}
                      onDelete={deleteNote}
                      onArchive={archiveNote}
                      onUnarchive={unarchiveNote}
                      onPin={pinNote}
                      onUnpin={unpinNote}
                      emptyTitle={filteredEmptyTitle}
                      emptyDescription={filteredEmptyDescription}
                    />
                    {pinnedNotes.length > 0 && regularNotes.length > 0 && (
                      <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.28em] text-slate-400">
                        <div className="h-px flex-1 bg-slate-200" />
                        More notes
                        <div className="h-px flex-1 bg-slate-200" />
                      </div>
                    )}
                    <NoteList
                      notes={regularNotes}
                      viewMode={viewMode}
                      onEdit={handleEdit}
                      onDelete={deleteNote}
                      onArchive={archiveNote}
                      onUnarchive={unarchiveNote}
                      onPin={pinNote}
                      onUnpin={unpinNote}
                      emptyTitle={filteredEmptyTitle}
                      emptyDescription={filteredEmptyDescription}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </main>
  );
}

function StatCard({ title, value, helper }: { title: string; value: number; helper: string }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white/90 px-4 py-4 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-[0.24em] text-slate-500">{title}</div>
      <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{value}</div>
      <div className="mt-1 text-sm text-slate-500">{helper}</div>
    </div>
  );
}
