import React, {useRef, useState} from 'react';
import {Alert, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions} from 'react-native';
import {useRouter} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';
import {captureRef, releaseCapture} from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import {translate, type TranslationKey} from '../i18n';
import {useLanguage} from '../i18n/LanguageProvider';
import {ZODIACS} from '../features/astrology/zodiac';
import {useContentStudio} from '../providers/ContentStudioProvider';
import {getCategory} from '../features/astrology/categories';
import {PosterCanvas} from '../components/PosterCanvas';
import {hasZodiacConflict} from '../features/astrology/zodiacConsistency';

const variants = ['design.gold', 'design.temple', 'design.cosmic', 'design.traditional', 'design.modern'] as const satisfies readonly TranslationKey[];
const fonts = ['preview.fontDefault', 'preview.fontSerif', 'preview.fontBold'] as const;
const backgrounds = ['preview.backgroundNight', 'preview.backgroundPlum', 'preview.backgroundForest'] as const;

export function PosterEditorScreen() {
  const {t, language} = useLanguage();
  const router = useRouter();
  const {width} = useWindowDimensions();
  const {state: {design}} = useContentStudio();
  const category = design ? getCategory(design.request.categoryId) : undefined;
  const contentLanguage = design?.version.language ?? language;
  // Presentation state never writes to the Studio, original request, or language provider.
  const [variant, setVariant] = useState(0);
  const [font, setFont] = useState(0);
  const [background, setBackground] = useState(0);
  const zodiac = ZODIACS.find(sign => sign.id === design?.request.zodiacId);
  const zodiacConflict = !!design && hasZodiacConflict(design.version.content, design.request.zodiacId);
  const canvas = useRef<View>(null);
  const exportLock = useRef(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(false);
  const posterWidth = Math.min(560, Math.max(1, width - 40));
  const sections = category && design ? category.outputSections.map(key => ({
    key, label: translate(contentLanguage, `output.${key}`), text: design.version.content[key] ?? '',
  })) : [{key: 'general', label: t('output.general'), text: t('editorSample')}];
  const title = category ? translate(contentLanguage, category.translationKey) : t('todayHoroscope');
  const badge = zodiac ? `${zodiac.symbol} ${translate(contentLanguage, zodiac.translationKey)}` : undefined;
  const brand = design?.request.brand;
  // Remount only canvas layout state when its inputs change; generated text is immutable here.
  const layoutKey = JSON.stringify([posterWidth, sections, title, badge, brand, font, variant, background]);
  const [ready, setReady] = useState<{key: string; height: number}>();
  async function exportPoster(format: 'png' | 'jpg') {
    if (zodiacConflict || exportLock.current || ready?.key !== layoutKey || !canvas.current) return;
    exportLock.current = true;
    setExporting(true); setExportError(false);
    let uri: string | undefined;
    try {
      if (!await Sharing.isAvailableAsync()) throw new Error('Unavailable');
      // Bound bitmap memory for unusually tall posters. Capture this view, never the screen.
      const scale = Math.min(1080 / posterWidth, 8192 / ready.height, Math.sqrt(8000000 / (posterWidth * ready.height)));
      uri = await captureRef(canvas, {format, quality: 1, result: 'tmpfile',
        width: Math.round(posterWidth * scale), height: Math.round(ready.height * scale)});
      await Sharing.shareAsync(uri, {mimeType: format === 'png' ? 'image/png' : 'image/jpeg',
        UTI: format === 'png' ? 'public.png' : 'public.jpeg'});
    } catch { setExportError(true); }
    finally {
      if (uri) releaseCapture(uri);
      exportLock.current = false; setExporting(false);
    }
  }
  const control = (label: string, value: string, onPress: () => void, hint?: string) => (
    <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${value}`} accessibilityHint={hint}
      disabled={exporting} onPress={onPress} style={s.button}>
      <Text style={s.controlLabel}>{label}</Text><Text style={s.buttonText}>{value}</Text>
    </Pressable>
  );
  return (
    <SafeAreaView style={s.page}>
      <ScrollView contentContainerStyle={s.content} removeClippedSubviews={false}>
        <Text style={s.title}>{t('posterEditor')}</Text>
        <Text accessibilityRole="header" style={s.heading}>{t('preview.title')}</Text>
        {zodiacConflict ? <View><Text accessibilityRole="alert" style={s.error}>{t('preview.zodiacMismatch')}</Text>
          <Pressable accessibilityRole="button" style={s.button} onPress={() => router.push('/studio')}><Text style={s.buttonText}>{t('studio.resume')}</Text></Pressable>
        </View> : <PosterCanvas key={layoutKey} ref={canvas} width={posterWidth} title={title} badge={badge}
          sections={sections} brand={brand} variant={variant} font={font} background={background}
          onReady={height => setReady({key: layoutKey, height})}/>}
        <View style={s.controls}>
          <Text accessibilityRole="header" style={s.heading}>{t('preview.controls')}</Text>
          <View style={s.actions}>
            {control(t('preview.style'), t(variants[variant]), () => setVariant(value => (value + 1) % variants.length))}
            {control(t('zodiac'), badge ?? t('zodiac'), () => Alert.alert(t('zodiac'), t('preview.zodiacHint'), [
              {text: t('studio.cancel'), style: 'cancel'},
              {text: t('create'), onPress: () => router.navigate({pathname: '/(tabs)/create', params: {
                contentLanguage, categoryId: design?.request.categoryId ?? 'daily', zodiacId: zodiac?.id ?? '', selectionId: String(Date.now()),
              }})},
            ]), t('preview.zodiacHint'))}
          </View>
          <View style={s.actions}>
            {control(t('font'), t(fonts[font]), () => setFont(value => (value + 1) % fonts.length))}
            {control(t('background'), t(backgrounds[background]), () => setBackground(value => (value + 1) % backgrounds.length))}
          </View>
          {exportError ? <Text accessibilityRole="alert" style={s.error}>{t('preview.exportFailed')}</Text> : null}
          {exporting ? <Text accessibilityLiveRegion="polite" style={s.controlLabel}>{t('preview.exporting')}</Text> : null}
          <View style={s.actions}>
            {(['png', 'jpg'] as const).map(format => <Pressable key={format} accessibilityRole="button"
              disabled={zodiacConflict || exporting || ready?.key !== layoutKey} onPress={() => void exportPoster(format)}
              style={[s.export, (zodiacConflict || exporting || ready?.key !== layoutKey) && s.disabled]}>
              <Text style={s.exportText}>{t(format === 'png' ? 'preview.exportPng' : 'preview.exportJpeg')}</Text>
            </Pressable>)}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  page: {flex: 1, backgroundColor: '#090B14'}, content: {padding: 20, alignItems: 'stretch'},
  title: {color: '#FFF', fontSize: 27, fontWeight: '900'}, heading: {color: '#E8C97D', fontSize: 17, fontWeight: '700', marginVertical: 16},
  controls: {marginTop: 24, borderTopWidth: 1, borderTopColor: '#393345'},
  actions: {flexDirection: 'row', gap: 10, marginBottom: 10},
  button: {flex: 1, minHeight: 64, backgroundColor: '#171A28', borderRadius: 13, padding: 13, justifyContent: 'center'},
  controlLabel: {color: '#AAA7B7', fontSize: 12, marginBottom: 5}, buttonText: {color: '#FFF', fontWeight: '700', lineHeight: 23},
  export: {flex: 1, minHeight: 48, backgroundColor: '#D6B46A', padding: 14, borderRadius: 15, alignItems: 'center', justifyContent: 'center'},
  exportText: {color: '#111', fontWeight: '800', textAlign: 'center'}, disabled: {opacity: 0.45}, error: {color: '#FFB0A4', marginVertical: 10},
});
