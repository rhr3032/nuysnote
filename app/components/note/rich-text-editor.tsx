'use client';

import { useRef, useState } from 'react';
import {
  Editor,
  EditorState,
  RichUtils,
  getDefaultKeyBinding,
  type DraftBlockType,
  type DraftHandleValue,
  type DraftInlineStyleType,
} from 'draft-js';
import { Bold, Code, Italic, List, ListOrdered, Quote, Underline } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createEditorStateFromContent, serializeEditorState } from '@/lib/rich-text';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const inlineButtons: Array<{ style: DraftInlineStyleType; label: string; icon: typeof Bold }> = [
  { style: 'BOLD', label: 'Bold', icon: Bold },
  { style: 'ITALIC', label: 'Italic', icon: Italic },
  { style: 'UNDERLINE', label: 'Underline', icon: Underline },
  { style: 'CODE', label: 'Code', icon: Code },
];

const blockButtons: Array<{ blockType: DraftBlockType; label: string; icon: typeof List }> = [
  { blockType: 'unordered-list-item', label: 'Bullets', icon: List },
  { blockType: 'ordered-list-item', label: 'Numbered list', icon: ListOrdered },
  { blockType: 'blockquote', label: 'Quote', icon: Quote },
];

const getCurrentBlockType = (editorState: EditorState): DraftBlockType => {
  const selection = editorState.getSelection();
  const content = editorState.getCurrentContent();
  return content.getBlockForKey(selection.getStartKey()).getType() as DraftBlockType;
};

export function RichTextEditor({ value, onChange, placeholder = 'Start writing your note...', className }: RichTextEditorProps) {
  const [editorState, setEditorState] = useState(() => createEditorStateFromContent(value));
  const [isFocused, setIsFocused] = useState(false);
  const editorRef = useRef<Editor | null>(null);

  const syncChange = (nextState: EditorState) => {
    setEditorState(nextState);
    onChange(serializeEditorState(nextState));
  };

  const handleKeyCommand = (command: string, nextState: EditorState): DraftHandleValue => {
    const handledState = RichUtils.handleKeyCommand(nextState, command);

    if (handledState) {
      syncChange(handledState);
      return 'handled';
    }

    return 'not-handled';
  };

  const mapKeyToEditorCommand = (event: ReactKeyboardEvent): string | null => {
    if (event.key === 'Tab') {
      const updatedState = RichUtils.onTab(event, editorState, 4);

      if (updatedState !== editorState) {
        syncChange(updatedState);
      }

      return null;
    }

    return getDefaultKeyBinding(event);
  };

  const toggleInlineStyle = (style: DraftInlineStyleType) => {
    syncChange(RichUtils.toggleInlineStyle(editorState, style));
  };

  const toggleBlockType = (blockType: DraftBlockType) => {
    syncChange(RichUtils.toggleBlockType(editorState, blockType));
  };

  const inlineStyles = editorState.getCurrentInlineStyle();
  const blockType = getCurrentBlockType(editorState);

  return (
    <div className={cn('space-y-3 rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm', className)}>
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/90 p-2">
        <span className="px-2 text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Format</span>
        <div className="h-5 w-px bg-slate-200" />
        {inlineButtons.map(({ style, label, icon: Icon }) => {
          const active = inlineStyles.has(style);

          return (
            <button
              key={style}
              type="button"
              aria-pressed={active}
              aria-label={label}
              onClick={() => toggleInlineStyle(style)}
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition',
                active
                  ? 'border-slate-900 bg-slate-950 text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-950'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          );
        })}

        <div className="h-5 w-px bg-slate-200" />
        {blockButtons.map(({ blockType: targetBlockType, label, icon: Icon }) => {
          const active = blockType === targetBlockType;

          return (
            <button
              key={targetBlockType}
              type="button"
              aria-pressed={active}
              aria-label={label}
              onClick={() => toggleBlockType(targetBlockType)}
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition',
                active
                  ? 'border-amber-300 bg-amber-100 text-slate-950 shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-950'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          );
        })}
      </div>

      <div
        className="relative min-h-[16rem] rounded-3xl border border-slate-200 bg-slate-50/80 px-4 py-4 text-sm leading-7 text-slate-900 transition focus-within:border-amber-300 focus-within:ring-4 focus-within:ring-amber-100"
        onClick={() => editorRef.current?.focus()}
      >
        {!editorState.getCurrentContent().hasText() && !isFocused && (
          <span className="pointer-events-none absolute left-4 top-4 text-slate-400">{placeholder}</span>
        )}
        <Editor
          ref={editorRef}
          editorState={editorState}
          onChange={syncChange}
          handleKeyCommand={handleKeyCommand}
          keyBindingFn={mapKeyToEditorCommand}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          spellCheck
        />
      </div>
    </div>
  );
}