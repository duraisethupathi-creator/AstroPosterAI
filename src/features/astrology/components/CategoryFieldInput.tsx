import React from 'react';
import {Pressable, ScrollView, StyleSheet, Switch, Text, View} from 'react-native';
import {AppInput} from '../../../components/AppInput';
import {useLanguage} from '../../../i18n/LanguageProvider';
import type {TranslationKey} from '../../../i18n';
import {theme} from '../../../theme';
import type {CategoryField, FieldValue} from '../types';
import {ZODIACS} from '../zodiac';

export function CategoryFieldInput({field, value, error, onChange}: {
  field: CategoryField; value: FieldValue | undefined; error?: TranslationKey; onChange: (value: FieldValue) => void;
}) {
  const {t} = useLanguage();
  const label = `${t(field.labelKey)}${field.required ? ' *' : ''}`;
  if (field.type === 'toggle') {
    return <View style={s.toggle}><Text style={s.toggleLabel}>{label}</Text>
      <Switch value={value === true} onValueChange={onChange} accessibilityLabel={label}
        trackColor={{false: theme.colors.border, true: theme.colors.gold}} thumbColor={theme.colors.text}/>
    </View>;
  }
  if (field.type === 'select' || field.type === 'zodiac') {
    const options = field.type === 'zodiac'
      ? [
        ...(!field.required ? [{value: '', label: t('astro.noZodiac'), symbol: ''}] : []),
        ...ZODIACS.map(zodiac => ({value: zodiac.id, label: t(zodiac.translationKey), symbol: zodiac.symbol})),
      ]
      : field.options.map(option => ({value: option.value, label: t(option.translationKey), symbol: ''}));
    return (
      <View>
        <Text style={s.label}>{label}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {options.map(option => (
            <Pressable key={option.value} accessibilityRole="radio" accessibilityLabel={option.label}
              accessibilityState={{checked: value === option.value}} onPress={() => onChange(option.value)}
              style={[s.option, value === option.value && s.selected]}>
              {option.symbol ? <Text style={s.symbol}>{option.symbol}</Text> : null}
              <Text style={s.optionText}>{option.label}{value === option.value ? ' ✓' : ''}</Text>
            </Pressable>
          ))}
        </ScrollView>
        {error ? <Text accessibilityRole="alert" style={s.error}>{t(error)}</Text> : null}
      </View>
    );
  }
  return <AppInput label={label} value={typeof value === 'string' || typeof value === 'number' ? String(value) : ''}
    onChangeText={onChange} error={error ? t(error) : undefined}
    placeholder={field.placeholderKey ? t(field.placeholderKey) : t(field.labelKey)}
    multiline={field.type === 'multiline'}
    keyboardType={field.type === 'year' ? 'number-pad' : 'default'}
    autoCapitalize={field.type === 'date' || field.type === 'year' ? 'none' : 'sentences'}
    autoCorrect={field.type !== 'date' && field.type !== 'year'}
    maxLength={field.type === 'date' ? 10 : field.type === 'year' ? 4 : field.maxLength}/>;
}

const s = StyleSheet.create({
  label: {color: '#C9CAD2', fontWeight: '700', marginBottom: 10},
  option: {padding: 13, marginRight: 9, borderRadius: 14, backgroundColor: theme.colors.surface,
    borderWidth: 1, borderColor: theme.colors.border, minWidth: 84, alignItems: 'center', justifyContent: 'center'},
  selected: {borderColor: theme.colors.gold, backgroundColor: '#211C1A'},
  optionText: {color: theme.colors.text, fontWeight: '600', textAlign: 'center'},
  symbol: {fontSize: 27, color: theme.colors.goldLight, marginBottom: 5},
  error: {color: theme.colors.danger, marginTop: 6, lineHeight: 20},
  toggle: {flexDirection: 'row', alignItems: 'center', gap: 12},
  toggleLabel: {flex: 1, color: theme.colors.text, fontWeight: '700'},
});
