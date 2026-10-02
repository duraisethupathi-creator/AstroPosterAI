import AsyncStorage from '@react-native-async-storage/async-storage';
import type {PosterProject, PosterProjectUpdate} from '../../features/projects/types';

export const POSTER_PROJECTS_KEY = 'astroposter.posterProjects.v1';
type Document = {version: 1; projects: PosterProject[]};
let queue: Promise<unknown> = Promise.resolve();

const copy = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
async function read(): Promise<PosterProject[]> {
  const raw = await AsyncStorage.getItem(POSTER_PROJECTS_KEY);
  if (!raw) return [];
  if (raw.length > 4000000) throw new Error('PROJECT_STORAGE_INVALID');
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || (parsed as Document).version !== 1 || !Array.isArray((parsed as Document).projects)) {
    throw new Error('PROJECT_STORAGE_INVALID');
  }
  const projects = (parsed as Document).projects;
  if (new Set(projects.map(project => project.id)).size !== projects.length) throw new Error('DUPLICATE_PROJECT_ID');
  return projects.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
async function write(projects: PosterProject[]) {
  await AsyncStorage.setItem(POSTER_PROJECTS_KEY, JSON.stringify({version: 1, projects} satisfies Document));
}
export const posterProjectStorage = {
  async list() { await queue; return read(); },
  async get(id: string) { await queue; return (await read()).find(project => project.id === id); },
  async listBatch(batchId: string) { await queue; return (await read()).filter(project => project.batchId === batchId); },
  saveAll(input: PosterProject[]) {
    const result = queue.then(async () => {
      if (!input.length || new Set(input.map(project => project.id)).size !== input.length) throw new Error('PROJECT_BATCH_INVALID');
      const existing = await read();
      const incoming = new Set(input.map(project => project.id));
      const next = [...input.map(copy), ...existing.filter(project => !incoming.has(project.id))];
      if (next.length > 250) next.length = 250;
      await write(next);
      return input.map(copy);
    });
    queue = result.catch(() => {});
    return result;
  },
  remove(id: string) {
    const result = queue.then(async () => {
      const projects = await read(); const next = projects.filter(project => project.id !== id);
      if (next.length === projects.length) throw new Error('PROJECT_NOT_FOUND');
      await write(next); return true;
    }); queue = result.catch(() => {}); return result;
  },
  removeBatch(batchId: string) {
    const result = queue.then(async () => {
      const projects = await read(); const next = projects.filter(project => project.batchId !== batchId);
      await write(next); return projects.length - next.length;
    }); queue = result.catch(() => {}); return result;
  },
  duplicate(id: string) {
    const result = queue.then(async () => {
      const projects = await read(); const source = projects.find(project => project.id === id);
      if (!source) throw new Error('PROJECT_NOT_FOUND');
      const now = new Date().toISOString(); const newId=`poster-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
      const duplicated: PosterProject={...copy(source),id:newId,batchId:newId,name:`${source.name ?? source.zodiacName} Copy`,createdAt:now,updatedAt:now};
      const next=[duplicated,...projects]; if(next.length>250) next.length=250; await write(next); return copy(duplicated);
    }); queue = result.catch(() => {}); return result;
  },
  update(id: string, patch: PosterProjectUpdate) {
    const result = queue.then(async () => {
      const projects = await read();
      const index = projects.findIndex(project => project.id === id);
      if (index < 0) throw new Error('PROJECT_NOT_FOUND');
      const current = projects[index];
      const updated: PosterProject = {...current, ...patch, content: patch.content ? {...current.content, ...patch.content} : current.content,
        updatedAt: new Date().toISOString()};
      projects[index] = updated;
      await write(projects);
      return copy(updated);
    });
    queue = result.catch(() => {});
    return result;
  },
};
