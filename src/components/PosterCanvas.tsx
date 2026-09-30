import React, {forwardRef, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import type {BrandSnapshot} from '../types/brandProfile';
import {getPosterTemplate} from '../features/templates/templates';

type Props = {
  width: number; title: string; badge?: string;
  sections: {key: string; label: string; text: string}[];
  brand?: BrandSnapshot; templateId?: string; variant?: number; font?: number; background?: number;
  onReady?: (height: number) => void;
};

// Capture-only poster surface. Template changes are visual only: content and brand data stay untouched.
export const PosterCanvas = forwardRef<View, Props>(function PosterCanvas({width,title,badge,sections,brand,templateId,variant=0,font=0,onReady},ref){
  const template=getPosterTemplate(templateId);
  const [fontSize,setFontSize]=useState(Math.min(18,Math.max(14,width/23)));
  const padding=Math.max(14,Math.min(24,width*.055)); const lineHeight=Math.ceil(fontSize*1.65);
  const family=font===1||template.fontFamily==='serif'?'serif':undefined;
  const brandLines=brand?[brand.businessName,brand.astrologerName,brand.phone,brand.whatsapp,brand.address,brand.website]
    .filter((v,i,a)=>v.trim()&&a.indexOf(v)===i):[];
  return <View ref={ref} collapsable={false} style={[s.canvas,{width,padding,borderWidth:template.borderWidth,borderColor:template.accent,
    backgroundColor:template.background,borderRadius:template.radius}]}>
    <View onLayout={({nativeEvent:{layout}})=>{const height=layout.height+2*(padding+template.borderWidth);
      if(height>width*1.6&&fontSize>12)setFontSize(v=>Math.max(12,v-1));else onReady?.(height);}}>
      {badge?<Text allowFontScaling={false} style={[s.badge,{color:template.accent,fontSize:fontSize+3,lineHeight:lineHeight+6,textAlign:template.align}]}>{badge}</Text>:null}
      <Text allowFontScaling={false} style={[s.title,{color:template.title,fontSize:fontSize+7,lineHeight:Math.ceil((fontSize+7)*1.5),textAlign:template.align,fontFamily:family}]}>{title}</Text>
      {sections.map(section=><View key={section.key} style={{marginTop:Math.ceil(fontSize*.9)}}>
        <Text allowFontScaling={false} style={[s.label,{color:template.accent,fontSize,lineHeight,textAlign:template.align,fontFamily:family,
          textTransform:template.labelTransform}]}>{section.label}</Text>
        <Text allowFontScaling={false} textBreakStrategy="highQuality" android_hyphenationFrequency="normal"
          style={[s.body,{color:template.body,fontSize,lineHeight,fontFamily:family,fontWeight:font===2?'600':'400',textAlign:template.align}]}>{section.text}</Text>
      </View>)}
      {brandLines.length?<View style={[s.brand,{borderTopColor:template.accent}]}>
        {brandLines.map((line,index)=><Text key={index} allowFontScaling={false} style={[s.body,{color:template.accent,fontSize:12,lineHeight:20,textAlign:template.align,fontFamily:family}]}>{line}</Text>)}
      </View>:null}
    </View>
  </View>;
});
const s=StyleSheet.create({canvas:{alignSelf:'center'},badge:{fontWeight:'700',includeFontPadding:true},title:{fontWeight:'800',marginTop:10,includeFontPadding:true},
 label:{fontWeight:'700',includeFontPadding:true},body:{includeFontPadding:true,flexShrink:1},brand:{marginTop:20,paddingTop:12,borderTopWidth:1}});
