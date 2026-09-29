import React from 'react';
import {KeyboardAvoidingView, Platform, ScrollView, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRouter} from 'expo-router';
import {ContentStudio} from '../components/ContentStudio';
import {AppButton} from '../components/AppButton';
import {useLanguage} from '../i18n/LanguageProvider';
import {theme} from '../theme';
export function ContentStudioScreen() {
  const router = useRouter(); const {t} = useLanguage();
  return <SafeAreaView style={s.page}>
    <KeyboardAvoidingView style={s.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
        <AppButton title={t('studio.back')} variant="outline" onPress={() => router.canGoBack() ? router.back() : router.replace('/create')}/>
        <ContentStudio/>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
const s = StyleSheet.create({page: {flex: 1, backgroundColor: theme.colors.bg}, content: {padding: 20, paddingBottom: 48, gap: 20}});
