import React, {useMemo, useState} from 'react';
import {Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import {POSTER_CATEGORIES, ZODIACS} from '../config/categories';

export function CreatePosterScreen() {
  const [category, setCategory] = useState('daily');
  const [language, setLanguage] = useState<'ta'|'en'>('ta');
  const [zodiac, setZodiac] = useState('aries');
  const [topic, setTopic] = useState('');
  const selected = useMemo(() => POSTER_CATEGORIES.find(x => x.id === category), [category]);

  return <SafeAreaView style={s.page}><ScrollView contentContainerStyle={s.content}>
    <Text style={s.kicker}>CREATE WITH AI</Text><Text style={s.title}>Poster உருவாக்கு</Text>
    <Text style={s.label}>Flow</Text><ScrollView horizontal showsHorizontalScrollIndicator={false}>{POSTER_CATEGORIES.map(x => <Pressable key={x.id} onPress={()=>setCategory(x.id)} style={[s.chip,category===x.id&&s.active]}><Text style={s.chipText}>{x.icon} {language==='ta'?x.titleTa:x.titleEn}</Text></Pressable>)}</ScrollView>
    <Text style={s.label}>Language</Text><View style={s.row}><Pressable onPress={()=>setLanguage('ta')} style={[s.option,language==='ta'&&s.active]}><Text style={s.optionText}>தமிழ்</Text></Pressable><Pressable onPress={()=>setLanguage('en')} style={[s.option,language==='en'&&s.active]}><Text style={s.optionText}>English</Text></Pressable></View>
    <Text style={s.label}>Zodiac</Text><ScrollView horizontal showsHorizontalScrollIndicator={false}>{ZODIACS.map(z=><Pressable key={z[0]} onPress={()=>setZodiac(z[0])} style={[s.zodiac,zodiac===z[0]&&s.active]}><Text style={s.zodiacIcon}>{z[3]}</Text><Text style={s.optionText}>{language==='ta'?z[1]:z[2]}</Text></Pressable>)}</ScrollView>
    <Text style={s.label}>Extra instruction</Text><TextInput value={topic} onChangeText={setTopic} multiline placeholder="உதா: இன்று தொழில் மற்றும் பண விஷயத்திற்கு முக்கியத்துவம் கொடு" placeholderTextColor="#707487" style={s.input}/>
    <View style={s.summary}><Text style={s.summaryTitle}>{selected?.icon} {language==='ta'?selected?.titleTa:selected?.titleEn}</Text><Text style={s.summaryText}>AI provider → ChatGPT / Gemini • Text editable • Brand auto-fill</Text></View>
    <Pressable style={s.generate}><Text style={s.generateText}>✨ AI Content Generate</Text></Pressable>
    <Pressable style={s.bulk}><Text style={s.bulkText}>12 ராசிக்கும் Generate</Text></Pressable>
  </ScrollView></SafeAreaView>;
}
const s=StyleSheet.create({page:{flex:1,backgroundColor:'#090B14'},content:{padding:20,paddingBottom:45},kicker:{color:'#D6B46A',fontWeight:'900',fontSize:11,letterSpacing:2},title:{color:'#FFF',fontWeight:'900',fontSize:28,marginTop:6},label:{color:'#C9CAD2',fontWeight:'700',marginTop:24,marginBottom:10},row:{flexDirection:'row',gap:10},chip:{paddingVertical:10,paddingHorizontal:13,borderRadius:14,backgroundColor:'#141725',marginRight:9,borderWidth:1,borderColor:'#25293B'},active:{borderColor:'#D6B46A',backgroundColor:'#211C1A'},chipText:{color:'#FFF',fontSize:12},option:{padding:13,borderRadius:13,backgroundColor:'#141725',borderWidth:1,borderColor:'#25293B'},optionText:{color:'#FFF',fontWeight:'600'},zodiac:{width:84,padding:11,alignItems:'center',borderRadius:15,backgroundColor:'#141725',marginRight:9,borderWidth:1,borderColor:'#25293B'},zodiacIcon:{fontSize:27,color:'#E8C97D',marginBottom:5},input:{minHeight:100,color:'#FFF',backgroundColor:'#121522',borderRadius:16,padding:15,textAlignVertical:'top',borderWidth:1,borderColor:'#282C40'},summary:{backgroundColor:'#141322',padding:17,borderRadius:17,marginTop:20},summaryTitle:{color:'#FFF',fontSize:17,fontWeight:'800'},summaryText:{color:'#9296A8',marginTop:7,lineHeight:19},generate:{backgroundColor:'#D6B46A',padding:17,borderRadius:16,alignItems:'center',marginTop:18},generateText:{color:'#111',fontWeight:'900'},bulk:{padding:16,borderRadius:16,alignItems:'center',marginTop:10,borderWidth:1,borderColor:'#5B4A31'},bulkText:{color:'#E8C97D',fontWeight:'800'}});