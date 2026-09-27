import React, {useState} from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';
import {useLanguage} from '../i18n/LanguageProvider';
import {theme} from '../theme';
import {AppButton} from './AppButton';

export function BrandAssetPicker({title, uri, disabled, onSelect, onRemove}: {
  title: string; uri: string | null; disabled: boolean; onSelect: () => void; onRemove: () => void;
}) {
  const {t} = useLanguage();
  const [failedUri, setFailedUri] = useState<string | null>(null);
  return (
    <View style={s.card}>
      <Text style={s.title}>{title}</Text>
      <View style={s.preview}>
        {uri && uri !== failedUri ? (
          <Image source={{uri}} style={s.image} resizeMode="contain" accessibilityLabel={title}
            onError={() => setFailedUri(uri)}/>
        ) : <Text style={s.hint}>{uri ? t('brandImageMissing') : title}</Text>}
      </View>
      <AppButton title={t(uri ? 'brandReplace' : 'brandSelect')} variant="outline" disabled={disabled}
        accessibilityLabel={`${t(uri ? 'brandReplace' : 'brandSelect')} — ${title}`} onPress={onSelect}/>
      {uri ? <AppButton title={t('brandRemove')} variant="outline" disabled={disabled}
        accessibilityLabel={`${t('brandRemove')} — ${title}`} onPress={onRemove}/> : null}
    </View>
  );
}

const s = StyleSheet.create({
  card: {gap: 12, padding: 16, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border},
  title: {color: theme.colors.text, fontSize: 17, fontWeight: '700'},
  preview: {height: 160, backgroundColor: theme.colors.surface, borderWidth: 1, borderStyle: 'dashed',
    borderColor: '#665538', borderRadius: theme.radius.md, alignItems: 'center', justifyContent: 'center', overflow: 'hidden'},
  image: {width: '100%', height: '100%'},
  hint: {color: theme.colors.muted, textAlign: 'center', padding: 16},
});
