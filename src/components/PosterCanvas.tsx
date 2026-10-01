import React, {forwardRef, useState} from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';
import type {BrandSnapshot} from '../types/brandProfile';
import {getPosterTemplate} from '../features/templates/templates';
import {effectiveDeity} from '../features/deities/deities';
import type {DeitySelection} from '../features/deities/types';

type Props = {
  width: number; title: string; badge?: string;
  sections: {key: string; label: string; text: string}[];
  brand?: BrandSnapshot; templateId?: string; variant?: number; font?: number; background?: number; deity?: DeitySelection;
  onReady?: (height: number) => void;
};

const DEVOTIONAL_FOOTER = 'இறையருளால் நன்மைகள் பெருகட்டும்';

// Capture-only poster surface. Template changes are visual only: content and brand data stay untouched.
export const PosterCanvas = forwardRef<View, Props>(function PosterCanvas({width,title,badge,sections,brand,templateId,variant=0,font=0,deity,onReady},ref){
  const template=getPosterTemplate(templateId);
  const [fontSize,setFontSize]=useState(Math.min(18,Math.max(14,width/23)));
  const padding=Math.max(14,Math.min(24,width*.055)); const lineHeight=Math.ceil(fontSize*1.65);
  const family=font===1||template.fontFamily==='serif'?'serif':undefined;
  const god=effectiveDeity(deity,templateId);
  const headerImageSize=Math.max(52,Math.min(78,width*.18));
  const headerCenter=[brand?.businessName,brand?.astrologerName,brand?.address].filter(Boolean) as string[];
  const contactLines=brand?[brand.phone,brand.whatsapp,brand.website].filter((v,i,a)=>v.trim()&&a.indexOf(v)===i):[];
  const hasDeityUpload=deity?.mode==='upload'&&Boolean(deity.uri);
  const showGod=Boolean(god)&&!hasDeityUpload;
  const rightProfileUri=!hasDeityUpload&&!showGod?brand?.profilePhotoUri:null;

  return <View ref={ref} collapsable={false} style={[s.canvas,{width,padding,borderWidth:template.borderWidth,borderColor:template.accent,
    backgroundColor:template.background,borderRadius:template.radius}]}>
    <View onLayout={({nativeEvent:{layout}})=>{const height=layout.height+2*(padding+template.borderWidth);
      if(height>width*1.6&&fontSize>12)setFontSize(v=>Math.max(12,v-1));else onReady?.(height);}}>

      {(brand?.logoUri||headerCenter.length||hasDeityUpload||showGod||rightProfileUri)?<View style={[s.header,{borderBottomColor:template.accent}]}>
        <View style={s.headerSide}>
          {brand?.logoUri?<Image source={{uri:brand.logoUri}} resizeMode="contain" style={{width:headerImageSize,height:headerImageSize}}/>:null}
        </View>
        <View style={s.headerCenter}>
          {headerCenter.map((line,index)=><Text key={index} allowFontScaling={false} numberOfLines={index===2?2:1}
            style={{color:index===0?template.title:template.body,fontSize:index===0?Math.max(11,fontSize-1):Math.max(9,fontSize-3),
              lineHeight:index===0?18:15,fontWeight:index<2?'700':'400',textAlign:'center',fontFamily:family}}>{line}</Text>)}
        </View>
        <View style={s.headerSide}>
          {hasDeityUpload?<Image source={{uri:deity!.uri!}} resizeMode="contain" style={{width:headerImageSize,height:headerImageSize,
            opacity:deity?.opacity??1,transform:[{rotate:`${deity?.rotation??0}deg`},{scale:deity?.scale??1}]}}/>
          :showGod?<View style={s.deity}><Text allowFontScaling={false} style={{fontSize:Math.max(30,headerImageSize*.55)}}>{god!.icon}</Text>
            <Text allowFontScaling={false} numberOfLines={1} style={{color:template.accent,fontSize:9,fontWeight:'800'}}>{god!.name}</Text></View>
          :rightProfileUri?<Image source={{uri:rightProfileUri}} resizeMode="cover" style={{width:headerImageSize,height:headerImageSize,borderRadius:headerImageSize/2}}/>:null}
        </View>
      </View>:null}

      {badge?<Text allowFontScaling={false} style={[s.badge,{color:template.accent,fontSize:fontSize+3,lineHeight:lineHeight+6,textAlign:template.align}]}>{badge}</Text>:null}
      <Text allowFontScaling={false} style={[s.title,{color:template.title,fontSize:fontSize+7,lineHeight:Math.ceil((fontSize+7)*1.5),textAlign:template.align,fontFamily:family}]}>{title}</Text>
      {sections.map(section=><View key={section.key} style={{marginTop:Math.ceil(fontSize*.9)}}>
        <Text allowFontScaling={false} style={[s.label,{color:template.accent,fontSize,lineHeight,textAlign:template.align,fontFamily:family,
          textTransform:template.labelTransform}]}>{section.label}</Text>
        <Text allowFontScaling={false} textBreakStrategy="highQuality" android_hyphenationFrequency="normal"
          style={[s.body,{color:template.body,fontSize,lineHeight,fontFamily:family,fontWeight:font===2?'600':'400',textAlign:template.align}]}>{section.text}</Text>
      </View>)}

      <View style={[s.footer,{borderTopColor:template.accent}]}>
        <Text allowFontScaling={false} style={{color:template.accent,fontSize:Math.max(11,fontSize-2),lineHeight:20,textAlign:'center',fontWeight:'800',fontFamily:family}}>{DEVOTIONAL_FOOTER}</Text>
        {contactLines.length?<Text allowFontScaling={false} style={{color:template.body,fontSize:10,lineHeight:16,textAlign:'center',fontFamily:family}}>{contactLines.join('  •  ')}</Text>:null}
      </View>
    </View>
  </View>;
});
const s=StyleSheet.create({
  canvas:{alignSelf:'center'},
  header:{flexDirection:'row',alignItems:'center',paddingBottom:10,marginBottom:8,borderBottomWidth:1},
  headerSide:{width:'23%',alignItems:'center',justifyContent:'center',minHeight:58},
  headerCenter:{width:'54%',alignItems:'center',justifyContent:'center',paddingHorizontal:4},
  badge:{fontWeight:'700',includeFontPadding:true},
  title:{fontWeight:'800',marginTop:10,includeFontPadding:true},
  label:{fontWeight:'700',includeFontPadding:true},
  body:{includeFontPadding:true,flexShrink:1},
  footer:{marginTop:20,paddingTop:10,borderTopWidth:1,gap:2},
  deity:{alignItems:'center',justifyContent:'center'}
});
