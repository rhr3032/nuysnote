import { ContentState, EditorState, convertFromRaw, convertToRaw, type RawDraftContentState } from 'draft-js';

type DraftRawShape = {
  blocks?: Array<{ text?: string }>;
  entityMap?: Record<string, unknown>;
};

const isDraftRawContent = (value: unknown): value is RawDraftContentState => {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as DraftRawShape;
  return Array.isArray(candidate.blocks) && candidate.entityMap !== undefined;
};

export const getPlainTextFromContent = (content: string): string => {
  if (!content.trim()) return '';

  try {
    const parsed = JSON.parse(content) as unknown;
    if (isDraftRawContent(parsed)) {
      return parsed.blocks?.map((block) => block.text ?? '').join('\n').trim() ?? '';
    }
  } catch {
    return content.trim();
  }

  return content.trim();
};

export const hasMeaningfulContent = (content: string): boolean => {
  return getPlainTextFromContent(content).trim().length > 0;
};

export const createEditorStateFromContent = (content: string): EditorState => {
  if (!content.trim()) {
    return EditorState.createEmpty();
  }

  try {
    const parsed = JSON.parse(content) as unknown;
    if (isDraftRawContent(parsed)) {
      return EditorState.createWithContent(convertFromRaw(parsed));
    }
  } catch {
    return EditorState.createWithContent(ContentState.createFromText(content));
  }

  return EditorState.createWithContent(ContentState.createFromText(content));
};

export const serializeEditorState = (editorState: EditorState): string => {
  return JSON.stringify(convertToRaw(editorState.getCurrentContent()));
};