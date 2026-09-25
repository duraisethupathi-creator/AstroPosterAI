import React,{useState} from 'react';
import {Pressable,SafeAreaView,ScrollView,StyleSheet,Text,View} from 'react-native';
import {getLanguage,LanguageCode,setLanguage,SUPPORTED_LANGUAGES} from '../i18n';

export function SettingsScreen(){
 const [selected,setSelected]=useState<LanguageCode>(getLanguage());
 const choose=(code:LanguageCode)=>{setSelected(code);setLanguage(code);};
 return <SafeAreaView style={s.page}><ScrollView contentContainerStyle={s.content}>
  <Text style={s.kicker}>ASTROPOSTER AI</Text><Text style={s.title}>Language / மொழி</Text>
  <Text style={s.copy}>App UI மற்றும் AI content உருவாக்கும் மொழியை தேர்வு செய்யலாம்.</Text>
  <View style={s.list}>{SUPPORTED_LANGUAGES.map(l=><Pressable key={l.code} onPress={()=>choose(l.code)} style={[s.card,selected===l.code&&s.active]}>
   <View><Text style={s.native}>{l.nativeName}</Text><Text style={s.code}>{l.code.toUpperCase()}</Text></View>
   <Text style={s.check}>{selected===l.code?'✓':''}</Text>
  </Pressable>)}</View>
  <View style={s.note}><Text style={s.noteTitle}>AI Content</Text><Text style={s.noteText}>Poster generation request-ல் selected language code backend-க்கு அனுப்பப்படும். ChatGPT / Gemini அதே மொழியில் structured content உருவாக்கும்.</Text></View>
 </ScrollView></SafeAreaView>
}
const s=StyleSheet.create({page:{flex:1,backgroundColor:'#090B14'},content:{padding:20},kicker:{color:'#D6B46A',fontSize:11,fontWeight:'900',letterSpacing:2},title:{color:'#FFF',fontSize:28,fontWeight:'900',marginTop:6},copy:{color:'#9296A8',marginTop:7,lineHeight:20},list:{gap:10,marginTop:22},card:{backgroundColor:'#131624',borderWidth:1,borderColor:'#292D40',borderRadius:16,padding:16,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},active:{borderColor:'#D6B46A',backgroundColor:'#211C1A'},native:{color:'#FFF',fontSize:18,fontWeight:'800'},code:{color:'#777B8D',fontSize:11,marginTop:3},check:{color:'#E8C97D',fontSize:22,fontWeight:'900'},note:{marginTop:22,padding:17,borderRadius:16,backgroundColor:'#141322'},noteTitle:{color:'#FFF',fontWeight:'800'},noteText:{color:'#9296A8',lineHeight:20,marginTop:6}});