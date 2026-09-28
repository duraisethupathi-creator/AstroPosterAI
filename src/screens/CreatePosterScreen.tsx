import React, {useReducer, useRef, useState} from 'react';
import {ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {AppButton} from '../components/AppButton';
import {SUPPORTED_LANGUAGES, type LanguageCode} from '../i18n';
import {useLanguage} from '../i18n/LanguageProvider';
import {useBrandProfile} from '../providers/BrandProfileProvider';
import {ASTROLOGY_CATEGORIES, getCategory} from '../features/astrology/categories';
import {FIELDS} from '../features/astrology/categoryFields';
import {categoryFormReducer, createCategoryForm, type CategoryFormAction} from '../features/astrology/formState';
import {buildAstrologyRequest} from '../features/astrology/requestBuilder';
import {CategoryFieldInput} from '../features/astrology/components/CategoryFieldInput';
import {RequestPreview} from '../features/astrology/components/RequestPreview';
import {theme} from '../theme';
import {useGeneration} from '../services/ai/useGeneration';
import {AI_ERROR_MESSAGES} from '../services/ai/errorMessages';
import {GeneratedContentEditor} from '../components/GeneratedContentEditor';
import {logAIEvent} from '../services/ai/debug';

export function CreatePosterScreen() {
  const {language, t} = useLanguage();
  const [languageOverride, setLanguageOverride] = useState<LanguageCode | null>(null);
  const contentLanguage = languageOverride ?? language;
  const {brandSnapshot, loading: brandLoading, loadFailed: brandLoadFailed} = useBrandProfile();
  const [form, dispatch] = useReducer(categoryFormReducer, 'daily', createCategoryForm);
  const [submitted, setSubmitted] = useState(false);
  const scroll = useRef<ScrollView>(null);
  const focusOutput = useRef(false);
  const category = getCategory(form.categoryId);
  const result = buildAstrologyRequest({...form, language: contentLanguage, brand: brandSnapshot});
  const generation = useGeneration(result.ok ? result.request : undefined);
  const errors = !result.ok && submitted ? result.errors : {};
  const brandBlocked = form.values.includeBrand !== false && (brandLoading || brandLoadFailed);
  const hasSavedBrand = Boolean(brandSnapshot.businessName || brandSnapshot.astrologerName);

  function change(action: CategoryFormAction) {
    dispatch(action);
    setSubmitted(false);
  }

  function prepare() {
    focusOutput.current = true;
    Keyboard.dismiss();
    setSubmitted(true);
    if (!result.ok) scroll.current?.scrollTo({y: 0, animated: true});
  }

  function generate() {
    logAIEvent('button pressed');
    prepare();
    if (result.ok && !brandBlocked && !form.generateAllZodiacs) void generation.generate();
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={s.page}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scroll} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <Text style={s.kicker}>{t('createWithAI')}</Text>
          <Text style={s.title}>{t('createPoster')}</Text>
          <Text style={s.hint}>{t('ai.createHint')}</Text>
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
            <Text style={s.label}>{t('ai.contentLanguage')}</Text>
            <Pressable accessibilityRole="radio" accessibilityState={{checked: languageOverride === null}}
              onPress={() => setLanguageOverride(null)} style={[s.option, languageOverride === null && s.active]}>
              <Text style={s.optionText}>{t('ai.useAppLanguage')}</Text>
            </Pressable>
            <View style={s.row}>
              {SUPPORTED_LANGUAGES.map(item => (
                <Pressable key={item.code} accessibilityRole="radio" accessibilityLabel={item.nativeName}
                  accessibilityState={{checked: contentLanguage === item.code}} onPress={() => setLanguageOverride(item.code)}
                  style={[s.option, contentLanguage === item.code && s.active]}>
                  <Text style={s.optionText}>{item.nativeName}{contentLanguage === item.code ? ' ✓' : ''}</Text>
                </Pressable>
              ))}
            </View>
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
            {form.generateAllZodiacs ? <Text style={s.hint}>{t('ai.bulkLater')}</Text> : null}
            {!generation.error ? <AppButton title={t(generation.loading ? 'ai.generating' : 'ai.generate')}
              disabled={brandBlocked || generation.loading || form.generateAllZodiacs} onPress={generate}/> : null}
          </View>
          {submitted && result.ok && !brandBlocked ? <View style={s.section}
            key={generation.loading ? 'loading' : generation.error ? 'error' : generation.result ? 'result' : 'preview'}
            onLayout={event => {
              if (focusOutput.current) {
                focusOutput.current = false;
                scroll.current?.scrollTo({y: event.nativeEvent.layout.y, animated: true});
              }
            }} accessibilityLiveRegion="polite">
            {generation.loading ? <View style={s.section}>
              <ActivityIndicator color={theme.colors.gold} accessibilityLabel={t('ai.generating')}/>
              <Text style={s.hint}>{t('ai.generating')}</Text>
            </View> : generation.error ? <View style={s.section}>
              <Text accessibilityRole="alert" style={s.error}>{t(AI_ERROR_MESSAGES[generation.error])}</Text>
              <AppButton title={t('ai.retry')} onPress={generate}/>
            </View> : generation.result ?
              <GeneratedContentEditor result={generation.result} onChange={generation.edit}/> :
              <RequestPreview request={result.request}/>}
          </View> : null}
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
