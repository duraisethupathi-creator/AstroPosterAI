import React, {useState} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {TranslationKey} from '../i18n';
import {useLanguage} from '../i18n/LanguageProvider';
import {ZODIACS} from '../features/astrology/zodiac';

const variants = ['design.gold', 'design.temple', 'design.cosmic', 'design.traditional', 'design.modern'] as const satisfies readonly TranslationKey[];
const previewZodiac = ZODIACS[0];

export function PosterEditorScreen() {
  const {t} = useLanguage();
  const {width} = useWindowDimensions();
  // Translate the demo reactively, but never replace text the user has edited.
  const [editedText, setEditedText] = useState<string | null>(null);
  const text = editedText ?? t('editorSample');
  const [variant, setVariant] = useState(0);
  return (
    <SafeAreaView style={s.page}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>{t('posterEditor')}</Text><Text style={s.sub}>{t('editorDescription')}</Text>
        <View style={[s.poster, {minHeight: (width - 40) * 5 / 4}]}>
          <Text style={s.badge}>{previewZodiac.symbol} {t(previewZodiac.translationKey)}</Text>
          <Text style={s.posterTitle}>{t('todayHoroscope')}</Text>
          <Text style={s.posterText}>{text}</Text>
          <View style={s.brand}><Text style={s.brandText}>{t('brandSample')}</Text></View>
        </View>
        <TextInput value={text} onChangeText={setEditedText} multiline accessibilityLabel={t('posterText')} style={s.input}/>
        <View style={s.actions}>
          <Pressable accessibilityRole="button" onPress={() => setVariant(value => (value + 1) % variants.length)} style={s.button}>
            <Text style={s.buttonText}>🎨 {t(variants[variant])}</Text>
          </Pressable>
          <Pressable style={s.button}><Text style={s.buttonText}>{previewZodiac.symbol} {t('zodiac')}</Text></Pressable>
        </View>
        <View style={s.actions}>
          <Pressable style={s.button}><Text style={s.buttonText}>Aa {t('font')}</Text></Pressable>
          <Pressable style={s.button}><Text style={s.buttonText}>🖼 {t('background')}</Text></Pressable>
        </View>
        <Pressable style={s.export}><Text style={s.exportText}>{t('exportFormats')}</Text></Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
const s=StyleSheet.create({page:{flex:1,backgroundColor:'#090B14'},content:{padding:20},title:{color:'#FFF',fontSize:27,fontWeight:'900'},sub:{color:'#9296A8',marginTop:5},poster:{backgroundColor:'#1B1520',borderRadius:20,marginTop:18,padding:22,borderWidth:1,borderColor:'#6A5533'},badge:{color:'#E8C97D',fontSize:22,fontWeight:'800'},posterTitle:{color:'#FFF',fontSize:27,fontWeight:'900',marginTop:25},posterText:{color:'#E2DFE7',fontSize:16,lineHeight:25,marginTop:18},brand:{marginTop:'auto',borderTopWidth:1,borderTopColor:'#6A5533',paddingTop:14},brandText:{color:'#D6B46A',fontSize:10,fontWeight:'800'},input:{color:'#FFF',backgroundColor:'#131624',borderRadius:14,padding:13,minHeight:78,marginTop:14,textAlignVertical:'top'},actions:{flexDirection:'row',gap:10,marginTop:10},button:{flex:1,backgroundColor:'#171A28',borderRadius:13,padding:13,alignItems:'center'},buttonText:{color:'#FFF',fontWeight:'700'},export:{backgroundColor:'#D6B46A',padding:16,borderRadius:15,alignItems:'center',marginTop:14},exportText:{color:'#111',fontWeight:'900'}});
