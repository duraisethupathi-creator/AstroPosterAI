import React, {useState} from 'react';
import {ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useRouter} from 'expo-router';
import {useLanguage} from '../i18n/LanguageProvider';
import {SUPPORTED_LANGUAGES, translate} from '../i18n';
import {getCategory} from '../features/astrology/categories';
import type {OutputSectionId} from '../features/astrology/types';
import {CONTENT_TONES} from '../types/contentStudio';
import {useContentStudio} from '../providers/ContentStudioProvider';
import {isStudioDirty, type StudioCommand} from '../state/contentStudioStore';
import {AppButton} from './AppButton';
import {AppInput} from './AppInput';
import {theme} from '../theme';
import {hasZodiacConflict} from '../features/astrology/zodiacConsistency';

export function ContentStudio() {
  const {t} = useLanguage();
  const router = useRouter();
  const {store, state} = useContentStudio();
  const [sheet, setSheet] = useState<OutputSectionId | 'translate' | null>(null);
  const session = state.session;
  if (!session) return <Text style={s.hint}>{t('studio.empty')}</Text>;
  const {version, request} = session;
  const category = getCategory(request.categoryId);
  const zodiacConflict = hasZodiacConflict(version.content, request.zodiacId);
  const busy = Boolean(state.pending);
  const nativeLabel = version.language === 'ta' ? translate('ta', 'studio.nativeTamil') : t('studio.nativeLanguage');
  function run(command: StudioCommand) { setSheet(null); void store.run(command); }
  function button(title: string, onPress: () => void, selected = false, disabled = busy, accessibilityLabel = title) {
    return <Pressable key={title} accessibilityRole="button" accessibilityLabel={accessibilityLabel} accessibilityState={{disabled, selected}} disabled={disabled}
      onPress={onPress} style={[s.action, selected && s.selected, disabled && s.disabled]}>
      <Text style={s.actionText}>{title}</Text>
    </Pressable>;
  }
  const errorPanel = state.error ? <View accessibilityLiveRegion="polite" style={s.card}>
    <Text accessibilityRole="alert" style={s.error}>{t(state.error)}</Text>
    <AppButton title={t('ai.retry')} disabled={busy} variant="outline" onPress={() => { void store.retry(); }}/>
  </View> : null;
  return <View style={s.content}>
    <Text accessibilityRole="header" style={s.title}>{t('studio.title')}</Text>
    <Text style={s.hint}>{t(category.translationKey)} · {SUPPORTED_LANGUAGES.find(item => item.code === version.language)?.nativeName}</Text>
    <Text style={s.hint}>{t(version.mode === 'mock' ? 'ai.mockBadge' : 'ai.liveBadge')}</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row} keyboardShouldPersistTaps="handled">
      {(['regenerate', 'shorten', 'expand', 'improve'] as const).map(operation => button(t(`studio.${operation}`), () => run({operation})))}
    </ScrollView>
    <Text style={s.label}>{t('studio.tone')}</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row} keyboardShouldPersistTaps="handled">
      {CONTENT_TONES.map(tone => button(t(`studio.${tone}`), () => run({operation: 'changeTone', tone}), version.tone === tone))}
    </ScrollView>
    <View style={s.row}>
      {button(nativeLabel, () => run({operation: 'nativeLanguage'}))}
      {button(t('studio.translate'), () => setSheet('translate'))}
    </View>
    {state.pending && !state.pending.sectionKey ? <View accessibilityLiveRegion="polite" style={s.row}>
      <ActivityIndicator color={theme.colors.gold}/><Text style={s.hint}>{t('studio.processing')}</Text>
    </View> : null}
    {!state.lastCommand?.sectionKey ? errorPanel : null}
    {category.outputSections.map(section => <View key={section} style={s.card}>
      <AppInput label={t(`output.${section}`)} value={version.content[section] ?? ''} multiline maxLength={700}
        onChangeText={text => store.edit(section, text)}/>
      <View style={s.row}>
        {button(t('studio.aiEdit'), () => setSheet(section), false, busy, `${t('studio.aiEdit')}: ${t(`output.${section}`)}`)}
        {state.pending?.sectionKey === section ? <View accessibilityLiveRegion="polite" style={s.processing}>
          <ActivityIndicator color={theme.colors.gold}/>
          <Text style={s.hint}>{t('studio.processing')} {t(`output.${section}`)}</Text>
        </View> : null}
      </View>
      {state.lastCommand?.sectionKey === section ? errorPanel : null}
    </View>)}
    <View style={s.row}>
      {button(t('studio.undo'), store.undo, false, busy || session.past.length === 0)}
      {button(t('studio.redo'), store.redo, false, busy || session.future.length === 0)}
    </View>
    <Text accessibilityLiveRegion="polite" style={s.hint}>{t(isStudioDirty(state) ? 'studio.unsaved' : 'studio.saved')}</Text>
    {state.saveError ? <Text accessibilityRole="alert" style={s.error}>{t('studio.saveFailed')}</Text> : null}
    <AppButton title={t(state.saving ? 'studio.saving' : 'studio.saveDraft')} disabled={state.saving} onPress={() => { void store.save(); }}/>
    {zodiacConflict ? <Text accessibilityRole="alert" style={s.error}>{t('preview.zodiacMismatch')}</Text> : null}
    <AppButton title={t('studio.design')} variant="outline" disabled={busy || zodiacConflict}
      onPress={() => { if (store.toDesign()) router.push('/editor'); }}/>
    <Modal visible={sheet !== null} transparent animationType="slide" onRequestClose={() => setSheet(null)}>
      <View style={s.overlay}><View accessibilityViewIsModal style={s.sheet}>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <Text accessibilityRole="header" style={s.title}>{sheet === 'translate' ? t('studio.targetLanguage') : sheet ? t(`output.${sheet}`) : ''}</Text>
          {sheet === 'translate' ? SUPPORTED_LANGUAGES.map(item => button(item.nativeName,
            () => run({operation: 'translate', targetLanguage: item.code}), item.code === version.language)) : sheet ? <>
              {(['rewrite', 'shorten', 'expand', 'improve'] as const).map(operation => button(t(`studio.${operation}`), () => run({operation, sectionKey: sheet})))}
              {CONTENT_TONES.map(tone => button(t(`studio.${tone}`), () => run({operation: 'changeTone', sectionKey: sheet, tone})))}
              {button(nativeLabel, () => run({operation: 'nativeLanguage', sectionKey: sheet}))}
            </> : null}
          <AppButton title={t('studio.cancel')} variant="outline" onPress={() => setSheet(null)}/>
        </ScrollView>
      </View></View>
    </Modal>
  </View>;
}
const s = StyleSheet.create({
  content: {gap: 14}, title: {fontSize: 24, fontWeight: '800', color: theme.colors.goldLight},
  hint: {color: theme.colors.muted, lineHeight: 23}, label: {color: theme.colors.text, fontWeight: '700'},
  row: {flexDirection: 'row', gap: 10, flexWrap: 'wrap', alignItems: 'center'},
  action: {minHeight: 46, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, justifyContent: 'center'},
  actionText: {color: theme.colors.goldLight, fontWeight: '600', lineHeight: 22}, selected: {borderColor: theme.colors.gold}, disabled: {opacity: .45},
  card: {padding: 14, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, gap: 10},
  error: {color: theme.colors.danger, lineHeight: 23}, processing: {flex: 1, gap: 5},
  overlay: {flex: 1, backgroundColor: '#0009', justifyContent: 'flex-end'},
  sheet: {maxHeight: '85%', backgroundColor: theme.colors.bg, padding: 20, paddingBottom: 32, borderTopLeftRadius: 24, borderTopRightRadius: 24},
});
