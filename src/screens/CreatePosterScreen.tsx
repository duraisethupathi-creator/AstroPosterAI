import React, {useReducer, useRef, useState} from 'react';
import {Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {AppButton} from '../components/AppButton';
import {SUPPORTED_LANGUAGES} from '../i18n';
import {useLanguage} from '../i18n/LanguageProvider';
import {useBrandProfile} from '../providers/BrandProfileProvider';
import {ASTROLOGY_CATEGORIES, getCategory} from '../features/astrology/categories';
import {FIELDS} from '../features/astrology/categoryFields';
import {categoryFormReducer, createCategoryForm, type CategoryFormAction} from '../features/astrology/formState';
import {buildAstrologyRequest} from '../features/astrology/requestBuilder';
import {CategoryFieldInput} from '../features/astrology/components/CategoryFieldInput';
import {RequestPreview} from '../features/astrology/components/RequestPreview';
import {theme} from '../theme';

export function CreatePosterScreen() {
  const {language, setLanguage, t, storageError} = useLanguage();
  const {brandSnapshot, loading: brandLoading, loadFailed: brandLoadFailed} = useBrandProfile();
  const [form, dispatch] = useReducer(categoryFormReducer, 'daily', createCategoryForm);
  const [submitted, setSubmitted] = useState(false);
  const scroll = useRef<ScrollView>(null);
  const category = getCategory(form.categoryId);
  const result = buildAstrologyRequest({...form, language, brand: brandSnapshot});
  const errors = !result.ok && submitted ? result.errors : {};
  const brandBlocked = form.values.includeBrand !== false && (brandLoading || brandLoadFailed);
  const hasSavedBrand = Boolean(brandSnapshot.businessName || brandSnapshot.astrologerName);

  function change(action: CategoryFormAction) {
    dispatch(action);
    setSubmitted(false);
  }

  function prepare() {
    Keyboard.dismiss();
    setSubmitted(true);
    if (!result.ok) scroll.current?.scrollTo({y: 0, animated: true});
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={s.page}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scroll} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <Text style={s.kicker}>{t('createWithAI')}</Text>
          <Text style={s.title}>{t('createPoster')}</Text>
          <Text style={s.hint}>{t('astro.previewOnly')}</Text>
          {submitted && !result.ok ? <Text accessibilityRole="alert" style={s.error}>{t('astro.checkFields')}</Text> : null}

          <View style={s.section}>
            <Text style={s.label}>{t('flow')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {ASTROLOGY_CATEGORIES.map(item => (
                <Pressable key={item.id} accessibilityRole="radio" accessibilityLabel={t(item.translationKey)}
                  accessibilityState={{checked: form.categoryId === item.id}}
                  onPress={() => change({type: 'category', categoryId: item.id})}
                  style={[s.chip, form.categoryId === item.id && s.active]}>
                  <Text style={s.chipText}>{item.icon} {t(item.translationKey)}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Text style={s.hint}>{t(category.descriptionKey)}</Text>
          </View>

          <View style={s.section}>
            <Text style={s.label}>{t('language')}</Text>
            <View style={s.row}>
              {SUPPORTED_LANGUAGES.map(item => (
                <Pressable key={item.code} accessibilityRole="radio" accessibilityLabel={item.nativeName}
                  accessibilityState={{checked: language === item.code}} onPress={() => { void setLanguage(item.code); }}
                  style={[s.option, language === item.code && s.active]}>
                  <Text style={s.optionText}>{item.nativeName}{language === item.code ? ' ✓' : ''}</Text>
                </Pressable>
              ))}
            </View>
            {storageError ? <Text accessibilityRole="alert" style={s.error}>{t(storageError === 'load' ? 'languageLoadError' : 'languageSaveError')}</Text> : null}
          </View>

          {category.supportsAllZodiacs ? (
            <View style={[s.section, s.toggle]}>
              <Text style={s.toggleLabel}>{t('generate12')}</Text>
              <Switch value={form.generateAllZodiacs} onValueChange={value => change({type: 'allZodiacs', value})}
                accessibilityLabel={t('generate12')} trackColor={{false: theme.colors.border, true: theme.colors.gold}} thumbColor={theme.colors.text}/>
            </View>
          ) : null}
          {category.fields.filter(field => !(field.type === 'zodiac' && form.generateAllZodiacs)).map(field => (
            <View key={`${category.id}-${field.id}`} style={s.section}>
              <CategoryFieldInput field={field} value={form.values[field.id]} error={errors[field.id]}
                onChange={value => change({type: 'field', id: field.id, value})}/>
            </View>
          ))}

          <View style={s.section}>
            <CategoryFieldInput field={FIELDS.includeBrand} value={form.values.includeBrand}
              onChange={value => change({type: 'field', id: 'includeBrand', value})}/>
            {brandBlocked ? <Text style={s.hint}>{t(brandLoading ? 'loading' : 'brandLoadError')}</Text>
              : !hasSavedBrand ? <Text style={s.hint}>{t('astro.noSavedBrand')}</Text> : null}
            <AppButton title={t('astro.prepareRequest')} disabled={brandBlocked} onPress={prepare}/>
          </View>
          {submitted && result.ok && !brandBlocked ? (
            <View style={s.section} onLayout={() => scroll.current?.scrollToEnd({animated: true})}>
              <RequestPreview request={result.request}/>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  page: {flex: 1, backgroundColor: theme.colors.bg}, flex: {flex: 1}, content: {padding: 20, paddingBottom: 45},
  kicker: {color: theme.colors.gold, fontWeight: '900', fontSize: 11, letterSpacing: 2},
  title: {color: theme.colors.text, fontWeight: '900', fontSize: 28, marginTop: 6},
  section: {marginTop: 24, gap: 10}, label: {color: '#C9CAD2', fontWeight: '700'},
  row: {flexDirection: 'row', flexWrap: 'wrap', gap: 10},
  chip: {paddingVertical: 12, paddingHorizontal: 13, borderRadius: 14, backgroundColor: theme.colors.surface,
    marginRight: 9, borderWidth: 1, borderColor: theme.colors.border, justifyContent: 'center'},
  active: {borderColor: theme.colors.gold, backgroundColor: '#211C1A'},
  chipText: {color: theme.colors.text, fontSize: 12},
  option: {padding: 13, borderRadius: 13, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border},
  optionText: {color: theme.colors.text, fontWeight: '600'},
  hint: {color: theme.colors.muted, marginTop: 7, lineHeight: 21},
  error: {color: theme.colors.danger, marginTop: 8, lineHeight: 21},
  toggle: {flexDirection: 'row', alignItems: 'center'}, toggleLabel: {flex: 1, color: theme.colors.goldLight, fontWeight: '800'},
});
