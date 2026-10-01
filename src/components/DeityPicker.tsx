import React from 'react';
import {Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {DEITIES} from '../features/deities/deities';
import {DEFAULT_DEITY_SELECTION,type DeitySelection} from '../features/deities/types';
import {theme} from '../theme';
type Props={value?:DeitySelection;onChange:(value:DeitySelection)=>void};
export function DeityPicker({value=DEFAULT_DEITY_SELECTION,onChange}:Props){
 const setMode=(mode:DeitySelection['mode'])=>onChange({...value,mode,uri:mode==='upload'?value.uri:undefined});
 async function upload(){const permission=await ImagePicker.requestMediaLibraryPermissionsAsync();if(!permission.granted)return;
  const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],allowsEditing:true,quality:.9});
  if(!result.canceled)onChange({...value,mode:'upload',uri:result.assets[0].uri});}
 return <View style={s.wrap}><Text style={s.title}>Deity / God Image</Text>
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>
   <Chip label="None" selected={value.mode==='none'} onPress={()=>setMode('none')}/><Chip label="Auto" selected={value.mode==='auto'} onPress={()=>setMode('auto')}/>
   <Chip label="Choose God" selected={value.mode==='manual'} onPress={()=>setMode('manual')}/><Chip label="Upload Own" selected={value.mode==='upload'} onPress={()=>void upload()}/>
  </ScrollView>
  {value.mode==='manual'?<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>{DEITIES.map(d=><Pressable key={d.id} onPress={()=>onChange({...value,mode:'manual',deityId:d.id,uri:undefined})} style={[s.god,value.deityId===d.id&&s.selected]}>
   <Text style={s.icon}>{d.icon}</Text><Text style={[s.name,value.deityId===d.id&&s.selectedText]}>{d.name}</Text></Pressable>)}</ScrollView>:null}
  {value.mode!=='none'?<Pressable onPress={()=>onChange({...DEFAULT_DEITY_SELECTION})} style={s.remove}><Text style={s.removeText}>Remove God Image</Text></Pressable>:null}
 </View>
}
function Chip({label,selected,onPress}:{label:string;selected:boolean;onPress:()=>void}){return <Pressable onPress={onPress} style={[s.chip,selected&&s.selected]}><Text style={[s.name,selected&&s.selectedText]}>{label}</Text></Pressable>}
const s=StyleSheet.create({wrap:{gap:12},title:{color:theme.colors.text,fontSize:18,fontWeight:'900'},row:{gap:10},chip:{paddingHorizontal:16,paddingVertical:12,borderRadius:14,borderWidth:1,borderColor:theme.colors.border,backgroundColor:theme.colors.surface},god:{width:110,minHeight:88,padding:10,borderRadius:16,borderWidth:1,borderColor:theme.colors.border,backgroundColor:theme.colors.surface,alignItems:'center',justifyContent:'center',gap:5},selected:{borderColor:theme.colors.gold,backgroundColor:'#211B16'},selectedText:{color:theme.colors.goldLight},name:{color:theme.colors.muted,fontWeight:'800',textAlign:'center'},icon:{fontSize:26},remove:{padding:10,alignItems:'center'},removeText:{color:theme.colors.gold,fontWeight:'800'}});
