import type {TranslationKey} from '../i18n';
import {getCategory} from '../features/astrology/categories';
import type {AstrologyGenerationRequest, OutputSectionId} from '../features/astrology/types';
import type {AstrologyGenerationResult} from '../types/generation';
import type {ContentAction, ContentDraft, DesignContent, StudioVersion} from '../types/contentStudio';
import type {PosterEditorLayout, PosterSmartDesign, PosterSocialState} from '../features/projects/types';
import type {ContentDraftRepository} from '../services/storage/contentDraftRepository';
import {hasZodiacConflict} from '../features/astrology/zodiacConsistency';

export type StudioCommand = Omit<ContentAction, 'language' | 'currentContent'>;
type Session = {request: AstrologyGenerationRequest; version: StudioVersion; past: StudioVersion[]; future: StudioVersion[];
  draftId?: string; createdAt?: string; savedFingerprint?: string; projectId?: string; editorLayout?: PosterEditorLayout; smartDesign?: PosterSmartDesign; socialState?: PosterSocialState};
export type StudioState = {session?: Session; pending?: StudioCommand; error?: TranslationKey; lastCommand?: StudioCommand;
  saving: boolean; saveError: boolean; saved: boolean; design?: DesignContent};
const copy = <T,>(value: T): T => {
  if (value === undefined || value === null) return value;
  return JSON.parse(JSON.stringify(value)) as T;
};
const fingerprint = (version: StudioVersion) => JSON.stringify(version);
export function isStudioDirty(state: StudioState) {
  return !!state.session && fingerprint(state.session.version) !== state.session.savedFingerprint;
}
type Generate = (request: AstrologyGenerationRequest, options: {action: ContentAction; signal: AbortSignal}) => Promise<AstrologyGenerationResult>;

export function createContentStudioStore(repository: ContentDraftRepository, generate: Generate) {
  let state: StudioState = {saving: false, saveError: false, saved: false};
  let active: AbortController | undefined;
  let sessionId = 0;
  const listeners = new Set<() => void>();
  const publish = (patch: Partial<StudioState>) => { state = {...state, ...patch}; listeners.forEach(listener => listener()); };
  const replace = (version: StudioVersion) => {
    const session = state.session!;
    publish({session: {...session, version: copy(version), past: [...session.past, copy(session.version)].slice(-20), future: []}, saved: false});
  };
  const store = {
    getSnapshot: () => state,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    start(request: AstrologyGenerationRequest, result: AstrologyGenerationResult, project?: {id:string; editorLayout?:PosterEditorLayout; smartDesign?:PosterSmartDesign; socialState?:PosterSocialState}) {
      active?.abort(); active = undefined; sessionId++;
      publish({session: {request: copy(request), version: {content: copy(result.content), language: result.language, mode: result.mode, tone: 'simple'}, past: [], future: [], projectId: project?.id, editorLayout: copy(project?.editorLayout ?? {}), smartDesign: copy(project?.smartDesign), socialState: copy(project?.socialState)},
        pending: undefined, error: undefined, lastCommand: undefined, saving: false, saved: false, saveError: false});
    },
    open(draft: ContentDraft) {
      store.start(draft.request, {success: true, categoryId: draft.request.categoryId, zodiacId: draft.request.zodiacId, ...draft.version});
      publish({session: {...state.session!, version: copy(draft.version), draftId: draft.id, createdAt: draft.createdAt, savedFingerprint: fingerprint(draft.version)}});
    },
    edit(section: OutputSectionId, text: string) {
      const session = state.session;
      if (!session || !getCategory(session.request.categoryId).outputSections.includes(section)) return;
      publish({session: {...session, version: {...session.version, content: {...session.version.content, [section]: text.slice(0, 700)}}, future: []}, saved: false});
    },
    async run(command: StudioCommand) {
      if (!state.session || active) return;
      const id = sessionId, before = copy(state.session), controller = new AbortController();
      active = controller;
      publish({pending: command, error: undefined, lastCommand: command});
      try {
        const action: ContentAction = {...command, language: before.version.language, currentContent: before.version.content,
          tone: command.tone ?? before.version.tone};
        const result = await generate(before.request, {action, signal: controller.signal});
        if (controller.signal.aborted || id !== sessionId) return;
        const current = state.session!;
        if (hasZodiacConflict(result.content, before.request.zodiacId) || result.zodiacId !== before.request.zodiacId) {
          publish({error: 'preview.zodiacMismatch'}); return;
        }
        const changed = command.sectionKey
          ? current.version.content[command.sectionKey] !== before.version.content[command.sectionKey]
          : fingerprint(current.version) !== fingerprint(before.version);
        if (changed) { publish({error: 'studio.changedDuringAction'}); return; }
        replace({...current.version, content: command.sectionKey ? {...current.version.content, [command.sectionKey]: result.content[command.sectionKey]} : result.content,
          language: result.language, mode: result.mode,
          tone: !command.sectionKey && command.operation === 'changeTone' ? command.tone! : current.version.tone});
      } catch {
        if (!controller.signal.aborted && id === sessionId) publish({error: 'studio.updateFailed'});
      } finally {
        if (active === controller) { active = undefined; publish({pending: undefined}); }
      }
    },
    retry() { if (state.lastCommand) return store.run(state.lastCommand); },
    undo() {
      const session = state.session;
      if (!session?.past.length || active) return;
      publish({session: {...session, version: session.past.at(-1)!, past: session.past.slice(0, -1), future: [...session.future, session.version].slice(-20)}, error: undefined, saved: false});
    },
    redo() {
      const session = state.session;
      if (!session?.future.length || active) return;
      publish({session: {...session, version: session.future.at(-1)!, future: session.future.slice(0, -1), past: [...session.past, session.version].slice(-20)}, error: undefined, saved: false});
    },
    async save() {
      if (!state.session || state.saving) return;
      const id = sessionId, captured = copy(state.session), now = new Date().toISOString();
      publish({saving: true, saved: false, saveError: false});
      try {
        const saved = await repository.save({id: captured.draftId ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`,
          createdAt: captured.createdAt ?? now, updatedAt: now, status: 'draft', request: captured.request, version: captured.version});
        if (id === sessionId) publish({session: {...state.session!, draftId: saved.id, createdAt: saved.createdAt, savedFingerprint: fingerprint(captured.version)}, saved: true});
      } catch { if (id === sessionId) publish({saveError: true}); }
      finally { if (id === sessionId) publish({saving: false}); }
    },
    toDesign() {
      if (!state.session) return;
      const {request, version, draftId, projectId, editorLayout, smartDesign, socialState} = state.session;
      if (hasZodiacConflict(version.content, request.zodiacId)) {
        publish({error: 'preview.zodiacMismatch'}); return;
      }
      const payload = copy({request, version, draftId, projectId, editorLayout, smartDesign, socialState});
      publish({design: payload});
      return payload;
    },
  };
  return store;
}
