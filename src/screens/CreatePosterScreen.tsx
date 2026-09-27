import React, {useState} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {POSTER_CATEGORIES, ZODIACS, type PosterCategoryId, type ZodiacId} from '../config/categories';
import {SUPPORTED_LANGUAGES} from '../i18n';
import {useLanguage} from '../i18n/LanguageProvider';
import {createGenerateContentRequest} from '../types/ai';

export function CreatePosterScreen() {
  const {language, setLanguage, t, storageError} = useLanguage();
  const [category, setCategory] = useState<PosterCategoryId>('daily');
  const [zodiac, setZodiac] = useState<ZodiacId>('aries');
  const [topic, setTopic] = useState('');
  const [showStatus, setShowStatus] = useState(false);
  const selected = POSTER_CATEGORIES.find(item => item.id === category)!;
  // Ready for a future provider integration; this screen makes no AI calls.
  const request = createGenerateContentRequest(language, {category, zodiac, extraInstruction: topic});

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={s.page}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.kicker}>{t('createWithAI')}</Text>
        <Text style={s.title}>{t('createPoster')}</Text>
        <Text style={s.label}>{t('flow')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {POSTER_CATEGORIES.map(item => (
            <Pressable key={item.id} accessibilityRole="radio" accessibilityState={{checked: category === item.id}}
              onPress={() => setCategory(item.id)} style={[s.chip, category === item.id && s.active]}>
              <Text style={s.chipText}>{item.icon} {t(item.titleKey)}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <Text style={s.label}>{t('language')}</Text>
        <View style={s.row}>
          {SUPPORTED_LANGUAGES.map(item => (
            <Pressable key={item.code} accessibilityRole="radio" accessibilityState={{checked: request.language === item.code}}
              accessibilityLabel={item.nativeName} onPress={() => { void setLanguage(item.code); }}
              style={[s.option, request.language === item.code && s.active]}>
              <Text style={s.optionText}>{item.nativeName}{request.language === item.code ? ' ✓' : ''}</Text>
            </Pressable>
          ))}
        </View>
        {storageError && <Text accessibilityRole="alert" style={s.summaryText}>{t(storageError === 'load' ? 'languageLoadError' : 'languageSaveError')}</Text>}
        <Text style={s.label}>{t('zodiac')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {ZODIACS.map(item => (
            <Pressable key={item.id} accessibilityRole="radio" accessibilityState={{checked: zodiac === item.id}}
              onPress={() => setZodiac(item.id)} style={[s.zodiac, zodiac === item.id && s.active]}>
              <Text style={s.zodiacIcon}>{item.icon}</Text><Text style={s.optionText}>{t(item.nameKey)}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <Text style={s.label}>{t('extraInstruction')}</Text>
        <TextInput value={topic} onChangeText={setTopic} multiline accessibilityLabel={t('extraInstruction')}
          placeholder={t('instructionPlaceholder')} placeholderTextColor="#707487" style={s.input}/>
        <View style={s.summary}>
          <Text style={s.summaryTitle}>{selected.icon} {t(selected.titleKey)}</Text>
          <Text style={s.summaryText}>{t('generationSummary')}</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={() => setShowStatus(true)} style={s.generate}>
          <Text style={s.generateText}>✨ {t('generate')}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => setShowStatus(true)} style={s.bulk}>
          <Text style={s.bulkText}>{t('generate12')}</Text>
        </Pressable>
        {showStatus && <Text accessibilityLiveRegion="polite" style={s.summaryText}>{t('generationUnavailable')}</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}
const s=StyleSheet.create({page:{flex:1,backgroundColor:'#090B14'},content:{padding:20,paddingBottom:45},kicker:{color:'#D6B46A',fontWeight:'900',fontSize:11,letterSpacing:2},title:{color:'#FFF',fontWeight:'900',fontSize:28,marginTop:6},label:{color:'#C9CAD2',fontWeight:'700',marginTop:24,marginBottom:10},row:{flexDirection:'row',flexWrap:'wrap',gap:10},chip:{paddingVertical:10,paddingHorizontal:13,borderRadius:14,backgroundColor:'#141725',marginRight:9,borderWidth:1,borderColor:'#25293B'},active:{borderColor:'#D6B46A',backgroundColor:'#211C1A'},chipText:{color:'#FFF',fontSize:12},option:{padding:13,borderRadius:13,backgroundColor:'#141725',borderWidth:1,borderColor:'#25293B'},optionText:{color:'#FFF',fontWeight:'600'},zodiac:{width:84,padding:11,alignItems:'center',borderRadius:15,backgroundColor:'#141725',marginRight:9,borderWidth:1,borderColor:'#25293B'},zodiacIcon:{fontSize:27,color:'#E8C97D',marginBottom:5},input:{minHeight:100,color:'#FFF',backgroundColor:'#121522',borderRadius:16,padding:15,textAlignVertical:'top',borderWidth:1,borderColor:'#282C40'},summary:{backgroundColor:'#141322',padding:17,borderRadius:17,marginTop:20},summaryTitle:{color:'#FFF',fontSize:17,fontWeight:'800'},summaryText:{color:'#9296A8',marginTop:7,lineHeight:19},generate:{backgroundColor:'#D6B46A',padding:17,borderRadius:16,alignItems:'center',marginTop:18},generateText:{color:'#111',fontWeight:'900'},bulk:{padding:16,borderRadius:16,alignItems:'center',marginTop:10,borderWidth:1,borderColor:'#5B4A31'},bulkText:{color:'#E8C97D',fontWeight:'800'}});
