import React, {useRef} from 'react';
import {Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, type TextInputProps, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {AppInput} from '../components/AppInput';
import {AppButton} from '../components/AppButton';
import {BrandAssetPicker} from '../components/BrandAssetPicker';
import {StateView} from '../components/StateView';
import {useLanguage} from '../i18n/LanguageProvider';
import type {TranslationKey} from '../i18n';
import {useBrandProfile} from '../providers/BrandProfileProvider';
import {theme} from '../theme';
import type {BrandTextField} from '../types/brandProfile';

type FormField = {field: BrandTextField; label: TranslationKey; props?: TextInputProps};
const sections: readonly {title: TranslationKey; fields: readonly FormField[]}[] = [
  {title: 'brandBasic', fields: [
    {field: 'businessName', label: 'businessName'},
    {field: 'astrologerName', label: 'astrologerName'},
    {field: 'qualification', label: 'qualification'},
    {field: 'tagline', label: 'tagline'},
  ]},
  {title: 'brandContact', fields: [
    {field: 'phone', label: 'brandPhone', props: {keyboardType: 'phone-pad'}},
    {field: 'whatsapp', label: 'whatsapp', props: {keyboardType: 'phone-pad'}},
    {field: 'email', label: 'email', props: {keyboardType: 'email-address', autoCapitalize: 'none', autoCorrect: false}},
    {field: 'address', label: 'address', props: {multiline: true, maxLength: 2000}},
    {field: 'website', label: 'website', props: {keyboardType: 'url', autoCapitalize: 'none', autoCorrect: false}},
  ]},
  {title: 'brandSocial', fields: [
    {field: 'instagram', label: 'instagram', props: {autoCapitalize: 'none', autoCorrect: false}},
    {field: 'facebook', label: 'facebook', props: {autoCapitalize: 'none', autoCorrect: false}},
    {field: 'youtube', label: 'youtube', props: {autoCapitalize: 'none', autoCorrect: false}},
  ]},
];

export function BrandProfileScreen() {
  const {t} = useLanguage();
  const {profile, updateProfile, saveProfile, resetProfile, reloadProfile, selectAsset, removeAsset,
    loading, loadFailed, busy, validationErrors, notice, hasUnsavedChanges, isProfileComplete} = useBrandProfile();
  const scroll = useRef<ScrollView>(null);
  const disabled = busy !== null;

  function confirmReset() {
    Alert.alert(t('brandReset'), t('brandResetConfirm'), [
      {text: t('brandCancel'), style: 'cancel'},
      {text: t('brandReset'), style: 'destructive', onPress: () => { void resetProfile(); }},
    ]);
  }

  async function save() {
    Keyboard.dismiss();
    await saveProfile();
    scroll.current?.scrollTo({y: 0, animated: true});
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={s.page}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {loading ? <StateView/> : (
          <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
            <Text style={s.title}>{t('brandProfile')}</Text>
            {notice ? <Text accessibilityLiveRegion="polite" style={s.feedback}>{t(notice)}</Text> : null}
            {loadFailed ? (
              <View style={s.section}>
                <AppButton title={t('brandRetry')} onPress={() => { void reloadProfile(); }} disabled={disabled}/>
                <AppButton title={t('brandReset')} variant="outline" onPress={confirmReset} disabled={disabled}/>
              </View>
            ) : (
              <>
                <Text style={s.copy}>{t('brandOptionalHint')}</Text>
                <Text style={s.completeness}>{t(isProfileComplete ? 'brandComplete' : 'brandIncomplete')}</Text>
                {hasUnsavedChanges ? <Text accessibilityLiveRegion="polite" style={s.feedback}>{t('brandUnsaved')}</Text> : null}
                {sections.map(section => (
                  <View key={section.title} style={s.section}>
                    <Text accessibilityRole="header" style={s.heading}>{t(section.title)}</Text>
                    {section.fields.map(({field, label, props}) => (
                      <AppInput key={field} label={t(label)} placeholder={t(label)} value={profile[field]}
                        editable={!disabled} maxLength={500} {...props}
                        error={validationErrors[field] ? t(validationErrors[field]) : undefined}
                        onChangeText={value => updateProfile({[field]: value})}/>
                    ))}
                  </View>
                ))}
                <View style={s.section}>
                  <Text accessibilityRole="header" style={s.heading}>{t('brandAssets')}</Text>
                  <Text style={s.copy}>{t('brandImageHint')}</Text>
                  <BrandAssetPicker title={t('brandLogo')} uri={profile.logoUri} disabled={disabled}
                    onSelect={() => { void selectAsset('logoUri'); }} onRemove={() => removeAsset('logoUri')}/>
                  <BrandAssetPicker title={t('brandPhoto')} uri={profile.profilePhotoUri} disabled={disabled}
                    onSelect={() => { void selectAsset('profilePhotoUri'); }} onRemove={() => removeAsset('profilePhotoUri')}/>
                </View>
                <View style={s.section}>
                  {busy === 'image' ? <Text accessibilityLiveRegion="polite" style={s.copy}>{t('brandPicking')}</Text> : null}
                  <AppButton title={t(busy === 'save' ? 'brandSaving' : 'brandSave')} disabled={disabled} onPress={() => { void save(); }}/>
                  <AppButton title={t(busy === 'reset' ? 'brandResetting' : 'brandReset')} variant="outline"
                    disabled={disabled} onPress={confirmReset}/>
                </View>
              </>
            )}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  page: {flex: 1, backgroundColor: theme.colors.bg}, flex: {flex: 1},
  content: {padding: 20, paddingBottom: 40},
  title: {color: theme.colors.text, fontSize: 28, fontWeight: '800'},
  copy: {color: theme.colors.muted, marginTop: 8, lineHeight: 21},
  section: {gap: 14, marginTop: 26},
  heading: {color: theme.colors.gold, fontSize: 18, fontWeight: '800'},
  completeness: {color: theme.colors.muted, marginTop: 12, lineHeight: 21},
  feedback: {color: theme.colors.goldLight, marginTop: 12, lineHeight: 21},
});
