import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {SUPPORTED_LANGUAGES} from '../../../i18n';
import {useLanguage} from '../../../i18n/LanguageProvider';
import {theme} from '../../../theme';
import {getCategory} from '../categories';
import {ZODIACS} from '../zodiac';
import type {AstrologyGenerationRequest, CategoryField, FieldValue} from '../types';

export function requestFieldValue(request: AstrologyGenerationRequest, field: CategoryField): FieldValue | undefined {
  if (field.type === 'zodiac') return request.zodiacId;
  if (field.id === 'extraInstruction') return request.extraInstruction;
  if (field.type === 'year') return request.period?.year;
  if (field.type === 'select' && field.periodKey) return request.period?.[field.periodKey];
  if (field.type === 'date' && field.periodKey) return request.period?.[field.periodKey];
  return request.inputs[field.id];
}

export function RequestPreview({request}: {request: AstrologyGenerationRequest}) {
  const {t} = useLanguage();
  const category = getCategory(request.categoryId);
  return (
    <View style={s.card} accessibilityLiveRegion="polite">
      <Text accessibilityRole="header" style={s.title}>{t('astro.preview')}</Text>
      <Text style={s.value}>{category.icon} {t(category.translationKey)}</Text>
      <Text style={s.label}>{t('language')}</Text>
      <Text style={s.value}>{SUPPORTED_LANGUAGES.find(item => item.code === request.language)?.nativeName}</Text>
      {request.generateAllZodiacs ? <Text style={s.value}>{t('astro.allSigns')}</Text> : null}
      {category.fields.map(field => {
        const value = requestFieldValue(request, field);
        if (value === undefined || value === '') return null;
        let display = String(value);
        if (field.type === 'select') {
          const option = field.options.find(item => item.value === value);
          if (option) display = t(option.translationKey);
        } else if (field.type === 'zodiac') {
          const zodiac = ZODIACS.find(item => item.id === value);
          if (zodiac) display = `${zodiac.symbol} ${t(zodiac.translationKey)}`;
        }
        return <View key={field.id}><Text style={s.label}>{t(field.labelKey)}</Text><Text style={s.value}>{display}</Text></View>;
      })}
      <Text style={s.label}>{t('brandProfile')}</Text>
      <Text style={s.value}>{t(request.brand ? 'astro.brandAttached' : 'astro.brandExcluded')}</Text>
      {request.brand ? <Text style={s.value}>{request.brand.businessName || request.brand.astrologerName}</Text> : null}
      <Text style={s.label}>{t('astro.expectedSections')}</Text>
      <Text style={s.value}>{request.outputSections.map(section => t(`output.${section}`)).join(' • ')}</Text>
      <Text style={s.hint}>{t('ai.createHint')}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: {padding: 17, borderRadius: 17, backgroundColor: '#141322', borderWidth: 1, borderColor: '#5B4A31', gap: 8},
  title: {color: theme.colors.goldLight, fontWeight: '800', fontSize: 19},
  label: {color: theme.colors.muted, fontWeight: '700', marginTop: 6},
  value: {color: theme.colors.text, lineHeight: 22}, hint: {color: theme.colors.muted, lineHeight: 21, marginTop: 8},
});
