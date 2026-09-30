import React, {useEffect} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRouter} from 'expo-router';
import {AppButton} from '../src/components/AppButton';
import {useLanguage} from '../src/i18n/LanguageProvider';
import {translate} from '../src/i18n';
import {ZODIACS} from '../src/features/astrology/zodiac';
import {rasiStore} from '../src/features/rasi/rasiStore';
import {useRasiBatch} from '../src/features/rasi/useRasiBatch';
import {theme} from '../src/theme';

export default function RasiResultsScreen() {
  const {t} = useLanguage();
  const router = useRouter();
  const batch = useRasiBatch();
  useEffect(() => { if (batch && !batch.running && batch.items.every(x => x.status === 'pending')) void rasiStore.generateAll(); }, [batch?.id]);
  if (!batch) return <SafeAreaView style={s.page}><View style={s.content}><Text style={s.title}>{t('rasi12.title')}</Text>
    <Text style={s.muted}>{t('rasi12.empty')}</Text><AppButton title={t('create')} onPress={() => router.replace('/create')}/></View></SafeAreaView>;
  const ready = batch.items.filter(x => x.status === 'success').length;
  const failed = batch.items.filter(x => x.status === 'failed').length;
  const done = ready + failed;
  const pct = Math.round(done / 12 * 100);
  return <SafeAreaView style={s.page}><ScrollView contentContainerStyle={s.content}>
    <Text style={s.kicker}>{t('magic12')}</Text><Text style={s.title}>{t('rasi12.title')}</Text>
    <Text style={s.muted}>{done}/12 • {pct}% • {ready} {t('rasi12.ready')} • {failed} {t('rasi12.failed')}</Text>
    <View style={s.progress}><View style={[s.progressFill,{width:`${pct}%`}]}/></View>
    {batch.items.map(item => {
      const z = ZODIACS.find(x => x.id === item.zodiacId)!;
      const label = translate(batch.baseRequest.language, z.translationKey);
      const preview = item.result?.content.general ?? item.result?.content.overview ?? item.result?.content.title ?? '';
      return <View key={item.zodiacId} style={s.card}>
        <View style={s.row}><Text style={s.zodiac}>{z.symbol} {label}</Text>
          <Text style={item.status === 'failed' ? s.error : s.status}>{t(`rasi12.${item.status}` as any)}</Text></View>
        {preview ? <Text numberOfLines={2} style={s.preview}>{preview}</Text> : null}
        {item.status === 'failed' ? <Pressable disabled={batch.running} onPress={() => void rasiStore.retryOne(item.zodiacId)}>
          <Text style={s.action}>{t('rasi12.retryOne')}</Text></Pressable> : null}
      </View>;
    })}
    {failed > 0 ? <AppButton title={t('rasi12.retryFailed')} disabled={batch.running} onPress={() => void rasiStore.retryFailed()}/> : null}
    {batch.running ? <AppButton title={t('rasi12.cancel')} variant="outline" onPress={() => rasiStore.cancel()}/> : null}
    {ready === 12 ? <Text style={s.done}>{t('rasi12.complete')}</Text> : null}
  </ScrollView></SafeAreaView>;
}
const s=StyleSheet.create({
  page:{flex:1,backgroundColor:theme.colors.bg},content:{padding:20,paddingBottom:48,gap:14},
  kicker:{color:theme.colors.gold,fontWeight:'900',letterSpacing:2},title:{color:theme.colors.text,fontSize:30,fontWeight:'900'},
  muted:{color:theme.colors.muted,lineHeight:22},progress:{height:8,borderRadius:8,backgroundColor:theme.colors.surface,overflow:'hidden'},
  progressFill:{height:8,backgroundColor:theme.colors.gold},card:{padding:16,borderRadius:18,borderWidth:1,borderColor:theme.colors.border,backgroundColor:theme.colors.surface,gap:8},
  row:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:10},zodiac:{color:theme.colors.text,fontWeight:'800',fontSize:17},
  status:{color:theme.colors.goldLight,fontWeight:'700'},error:{color:theme.colors.danger,fontWeight:'700'},preview:{color:theme.colors.muted,lineHeight:20},
  action:{color:theme.colors.gold,fontWeight:'800'},done:{color:theme.colors.goldLight,textAlign:'center',fontSize:18,fontWeight:'900',marginTop:8},
});
