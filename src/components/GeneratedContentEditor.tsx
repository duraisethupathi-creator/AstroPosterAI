import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {AppInput} from './AppInput';
import {getCategory} from '../features/astrology/categories';
import {useLanguage} from '../i18n/LanguageProvider';
import {SUPPORTED_LANGUAGES} from '../i18n';
import type {AstrologyGenerationResult, GeneratedContent} from '../types/generation';
import {theme} from '../theme';
export function GeneratedContentEditor({result, onChange}: {
  result: AstrologyGenerationResult; onChange: (content: GeneratedContent) => void;
}) {
  const {t} = useLanguage();
  return <View style={s.card}>
    <Text accessibilityRole="header" style={s.title}>{t('ai.generated')}</Text>
    <Text style={s.hint}>{t(result.mode === 'mock' ? 'ai.mockBadge' : 'ai.liveBadge')}</Text>
    <Text style={s.hint}>{SUPPORTED_LANGUAGES.find(item => item.code === result.language)?.nativeName}</Text>
    <Text style={s.hint}>{t('ai.editHint')}</Text>
    {getCategory(result.categoryId).outputSections.map(section => <AppInput key={section}
      label={t(`output.${section}`)} value={result.content[section] ?? ''} multiline maxLength={700}
      onChangeText={text => onChange({...result.content, [section]: text})}/>)}
  </View>;
}
const s = StyleSheet.create({card: {gap: 14, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.gold, backgroundColor: theme.colors.surface},
  title: {color: theme.colors.goldLight, fontSize: 20, fontWeight: '800'}, hint: {color: theme.colors.muted, lineHeight: 21}});
