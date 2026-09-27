import React from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {SUPPORTED_LANGUAGES} from '../i18n';
import {useLanguage} from '../i18n/LanguageProvider';

export function SettingsScreen() {
  const {language, setLanguage, t, storageError} = useLanguage();
  return (
    <SafeAreaView style={s.page}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.kicker}>ASTROPOSTER AI</Text>
        <Text style={s.title}>{t('language')}</Text>
        <Text style={s.copy}>{t('selectLanguage')} • {t('aiLanguage')}</Text>
        {storageError && <Text accessibilityRole="alert" style={s.copy}>{t(storageError === 'load' ? 'languageLoadError' : 'languageSaveError')}</Text>}
        <View style={s.list}>
          {SUPPORTED_LANGUAGES.map(item => (
            <Pressable key={item.code} accessibilityRole="radio" accessibilityState={{checked: language === item.code}}
              accessibilityLabel={item.nativeName} onPress={() => { void setLanguage(item.code); }}
              style={[s.card, language === item.code && s.active]}>
              <View style={s.languageInfo}>
                <Text style={s.native}>{item.nativeName}</Text>
                <Text style={s.code}>{language === item.code ? t('selected') : item.code.toUpperCase()}</Text>
              </View>
              <Text style={s.check}>{language === item.code ? '✓' : ''}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const s=StyleSheet.create({languageInfo:{flex:1},page:{flex:1,backgroundColor:'#090B14'},content:{padding:20},kicker:{color:'#D6B46A',fontSize:11,fontWeight:'900',letterSpacing:2},title:{color:'#FFF',fontSize:28,fontWeight:'900',marginTop:6},copy:{color:'#9296A8',marginTop:7,lineHeight:20},list:{gap:10,marginTop:22},card:{backgroundColor:'#131624',borderWidth:1,borderColor:'#292D40',borderRadius:16,padding:16,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},active:{borderColor:'#D6B46A',backgroundColor:'#211C1A'},native:{color:'#FFF',fontSize:18,fontWeight:'800'},code:{color:'#777B8D',fontSize:11,marginTop:3},check:{color:'#E8C97D',fontSize:22,fontWeight:'900'}});
