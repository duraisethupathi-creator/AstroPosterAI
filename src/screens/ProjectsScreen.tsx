import React, {useCallback, useState} from 'react';
import {ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect, useRouter} from 'expo-router';
import {useLanguage} from '../i18n/LanguageProvider';
import {SUPPORTED_LANGUAGES} from '../i18n';
import {getCategory} from '../features/astrology/categories';
import {ZODIACS} from '../features/astrology/zodiac';
import {contentDraftStorage} from '../services/storage/contentDraftStorage';
import {posterProjectStorage} from '../services/storage/posterProjectStorage';
import type {PosterProject} from '../features/projects/types';
import type {ContentDraft} from '../types/contentStudio';
import {useContentStudio} from '../providers/ContentStudioProvider';
import {isStudioDirty} from '../state/contentStudioStore';
import {confirmStudioReplacement} from '../components/confirmStudioReplacement';
import {AppButton} from '../components/AppButton';
import {theme} from '../theme';
export function ProjectsScreen() {
  const {t, language} = useLanguage(); const router = useRouter(); const {store} = useContentStudio();
  const [drafts, setDrafts] = useState<ContentDraft[]>([]);
  const [posters, setPosters] = useState<PosterProject[]>([]);
  const [loading, setLoading] = useState(true), [error, setError] = useState(false), [attempt, setAttempt] = useState(0);
  useFocusEffect(useCallback(() => {
    let alive = true; setLoading(true); setError(false);
    Promise.all([contentDraftStorage.list(), posterProjectStorage.list()]).then(([data, savedPosters]) => { if (alive) { setDrafts(data); setPosters(savedPosters); } }).catch(() => { if (alive) setError(true); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [attempt]));
  async function open(draft: ContentDraft) {
    const current = store.getSnapshot();
    if (current.session?.draftId === draft.id) { router.push('/studio'); return; }
    if (isStudioDirty(current) && !await confirmStudioReplacement(t)) return;
    store.open(draft); router.push('/studio');
  }
  return <SafeAreaView edges={['top', 'left', 'right']} style={s.page}><ScrollView contentContainerStyle={s.content}>
    <Text style={s.title}>{t('projects')}</Text>
    {loading ? <ActivityIndicator color={theme.colors.gold} accessibilityLabel={t('loading')}/>
      : error ? <View style={s.card}><Text style={s.error}>{t('studio.loadFailed')}</Text><AppButton title={t('ai.retry')} onPress={() => setAttempt(n => n + 1)}/></View>
      : !drafts.length && !posters.length ? <Text style={s.hint}>{t('projectsEmpty')}</Text> : <>{posters.map(project => <Pressable key={project.id} accessibilityRole="button" onPress={() => { store.start(project.request, {success: true, categoryId: project.categoryId, zodiacId: project.zodiacId, language: project.language, mode: 'live', content: project.content}, {id: project.id, editorLayout: project.editorLayout, smartDesign: project.smartDesign}); router.push('/studio'); }} style={s.card}>
          <Text style={s.name}>{project.zodiacSymbol} {project.zodiacName}</Text><Text style={s.hint}>{t(getCategory(project.categoryId).translationKey)} · {SUPPORTED_LANGUAGES.find(item => item.code === project.language)?.nativeName}</Text><Text style={s.hint}>{new Date(project.updatedAt).toLocaleString(language)}</Text>
        </Pressable>)}{drafts.map(draft => {
        const category = getCategory(draft.request.categoryId), zodiac = ZODIACS.find(sign => sign.id === draft.request.zodiacId);
        const title = draft.version.content.title?.trim() || draft.version.content.headline?.trim() || t(category.translationKey);
        return <Pressable key={draft.id} accessibilityRole="button" onPress={() => { void open(draft); }} style={s.card}>
          <Text numberOfLines={2} style={s.name}>{title}</Text>
          <Text style={s.hint}>{t(category.translationKey)}{zodiac ? ` · ${t(zodiac.translationKey)}` : ''}</Text>
          <Text style={s.hint}>{SUPPORTED_LANGUAGES.find(item => item.code === draft.version.language)?.nativeName} · {t('studio.draft')}</Text>
          <Text style={s.hint}>{t('studio.lastEdited')}: {new Date(draft.updatedAt).toLocaleString(language)}</Text>
        </Pressable>;
      })}</>}
  </ScrollView></SafeAreaView>;
}
const s = StyleSheet.create({page: {flex: 1, backgroundColor: theme.colors.bg}, content: {padding: 20, gap: 16}, title: {fontSize: 27, fontWeight: '800', color: theme.colors.text},
  card: {backgroundColor: theme.colors.surface, padding: 18, gap: 8, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border},
  name: {fontSize: 18, color: theme.colors.goldLight, lineHeight: 27}, hint: {color: theme.colors.muted, lineHeight: 23}, error: {color: theme.colors.danger}});
