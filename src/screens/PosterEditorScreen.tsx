import React, {useState} from 'react';
import {Pressable, SafeAreaView, StyleSheet, Text, TextInput, View} from 'react-native';

export function PosterEditorScreen(){
 const [text,setText]=useState('இன்றைய ராசிபலன் இங்கே வரும். AI உருவாக்கிய content-ஐ முழுமையாக edit செய்யலாம்.');
 const [variant,setVariant]=useState(0);
 const variants=['Premium Gold','Temple','Cosmic','Traditional','Modern'];
 return <SafeAreaView style={s.page}><View style={s.content}>
  <Text style={s.title}>Poster Editor</Text><Text style={s.sub}>Text, background, zodiac, brand அனைத்தையும் மாற்றலாம்.</Text>
  <View style={s.poster}><Text style={s.badge}>♈ மேஷம்</Text><Text style={s.posterTitle}>இன்றைய ராசிபலன்</Text><Text style={s.posterText}>{text}</Text><View style={s.brand}><Text style={s.brandText}>YOUR LOGO • ASTROLOGER NAME • PHONE</Text></View></View>
  <TextInput value={text} onChangeText={setText} multiline style={s.input}/>
  <View style={s.actions}><Pressable onPress={()=>setVariant((variant+1)%variants.length)} style={s.button}><Text style={s.buttonText}>🎨 {variants[variant]}</Text></Pressable><Pressable style={s.button}><Text style={s.buttonText}>♈ Zodiac</Text></Pressable></View>
  <View style={s.actions}><Pressable style={s.button}><Text style={s.buttonText}>Aa Font</Text></Pressable><Pressable style={s.button}><Text style={s.buttonText}>🖼 Background</Text></Pressable></View>
  <Pressable style={s.export}><Text style={s.exportText}>Export PNG / JPEG</Text></Pressable>
 </View></SafeAreaView>;
}
const s=StyleSheet.create({page:{flex:1,backgroundColor:'#090B14'},content:{padding:20},title:{color:'#FFF',fontSize:27,fontWeight:'900'},sub:{color:'#9296A8',marginTop:5},poster:{aspectRatio:4/5,backgroundColor:'#1B1520',borderRadius:20,marginTop:18,padding:22,borderWidth:1,borderColor:'#6A5533'},badge:{color:'#E8C97D',fontSize:22,fontWeight:'800'},posterTitle:{color:'#FFF',fontSize:27,fontWeight:'900',marginTop:25},posterText:{color:'#E2DFE7',fontSize:16,lineHeight:25,marginTop:18},brand:{marginTop:'auto',borderTopWidth:1,borderTopColor:'#6A5533',paddingTop:14},brandText:{color:'#D6B46A',fontSize:10,fontWeight:'800'},input:{color:'#FFF',backgroundColor:'#131624',borderRadius:14,padding:13,minHeight:78,marginTop:14,textAlignVertical:'top'},actions:{flexDirection:'row',gap:10,marginTop:10},button:{flex:1,backgroundColor:'#171A28',borderRadius:13,padding:13,alignItems:'center'},buttonText:{color:'#FFF',fontWeight:'700'},export:{backgroundColor:'#D6B46A',padding:16,borderRadius:15,alignItems:'center',marginTop:14},exportText:{color:'#111',fontWeight:'900'}});