import React, {forwardRef} from 'react';
import {Image, PanResponder, StyleSheet, Text, View} from 'react-native';
import type {BrandSnapshot} from '../types/brandProfile';
import {getPosterTemplate} from '../features/templates/templates';
import {effectiveDeity} from '../features/deities/deities';
import type {DeitySelection} from '../features/deities/types';
import type {PosterEditorLayout, PosterElementId} from '../features/projects/types';

type Props = {
  width: number; height?: number; title: string; badge?: string;
  sections: {key: string; label: string; text: string}[];
  brand?: BrandSnapshot; templateId?: string; variant?: number; font?: number; background?: number; deity?: DeitySelection;
  onReady?: (height: number) => void;
  editable?: boolean; onElementPress?: (element: 'logo'|'profile'|'deity'|'brand'|'badge'|'title'|'content'|'footer') => void;
  selectedElement?: PosterElementId;
  elementTransforms?: PosterEditorLayout;
  onElementMove?: (element: NonNullable<Props['selectedElement']>, dx:number, dy:number) => void;
};

const DEVOTIONAL_FOOTER = 'இறையருளால் நன்மைகள் பெருகட்டும்';

// Capture-only poster surface. Template changes are visual only: content and brand data stay untouched.
export const PosterCanvas = forwardRef<View, Props>(function PosterCanvas({width,height,title,badge,sections,brand,templateId,variant=0,font=0,deity,onReady,editable=false,onElementPress,selectedElement,elementTransforms,onElementMove},ref){
  const template=getPosterTemplate(templateId);
  const baseFont=Math.min(18,Math.max(12,width/23));
  const textLoad=sections.reduce((n,s)=>n+s.label.length+s.text.length,0)+title.length+(badge?.length??0);
  const density=height?textLoad/Math.max(1,height):0;
  // Fit content by both text density and canvas aspect ratio. Wide/square
  // canvases have much less vertical room than Story, so shrink earlier there.
  const aspect=height?width/height:.8;
  const densityFont=density>.62?9:density>.48?10:density>.36?11:density>.27?12:Math.min(14,baseFont);
  const ratioCap=aspect>=.95?9:aspect>=.78?10:aspect>=.62?12:14;
  const fontSize=height?Math.min(densityFont,ratioCap):baseFont;
  const compact=Boolean(height);
  const tallLayout=Boolean(height)&&aspect<=.62;
  const squareLayout=Boolean(height)&&aspect>=.9;
  const padding=compact?Math.max(10,Math.min(16,width*.038)):Math.max(14,Math.min(24,width*.055));
  const lineHeight=Math.ceil(fontSize*(tallLayout?1.48:compact?1.28:1.65));
  const family=font===1||template.fontFamily==='serif'?'serif':undefined;
  const god=effectiveDeity(deity,templateId);
  const headerImageSize=compact?Math.max(34,Math.min(aspect>=.9?44:aspect>=.75?52:64,width*.15)):Math.max(60,Math.min(88,width*.205));
  const headerCenter=[brand?.businessName,brand?.astrologerName,brand?.address].filter(Boolean) as string[];
  const contactLines=brand?[brand.phone,brand.whatsapp,brand.website].filter((v,i,a)=>v.trim()&&a.indexOf(v)===i):[];
  const hasDeityUpload=deity?.mode==='upload'&&Boolean(deity.uri);
  const showGod=Boolean(god)&&!hasDeityUpload;
  const rightProfileUri=!hasDeityUpload&&!showGod?brand?.profilePhotoUri:null;
  const tx=(id: Props['selectedElement'])=>{const value=id?elementTransforms?.[id]:undefined;if(!value)return undefined;
    // Text blocks stay inside the poster safe area even when an older saved layout
    // or Smart Design contains aggressive horizontal offsets/scales.
    const textElement=id==='badge'||id==='title'||id==='content'||id==='footer'||id==='brand';
    const edgeElement=textElement||id==='logo'||id==='profile'||id==='deity';
    // Every editable element gets a horizontal safe-area clamp. This prevents
    // Smart Layout and older saved transforms from pushing zodiac/header items
    // outside narrow Square/Story/Facebook canvases.
    const safeX=edgeElement?Math.max(-4,Math.min(4,value.x)):value.x;
    const safeScale=textElement?Math.min(1.08,value.scale):Math.min(1.12,value.scale);
    return {opacity:value.opacity,transform:[{translateX:safeX},{translateY:value.y},{rotate:`${value.rotation}deg`},{scale:safeScale}]};};
  const pan=(id: NonNullable<Props['selectedElement']>)=>editable?PanResponder.create({onStartShouldSetPanResponder:()=>true,onMoveShouldSetPanResponder:(_,g)=>Math.abs(g.dx)>2||Math.abs(g.dy)>2,onPanResponderGrant:()=>onElementPress?.(id),onPanResponderRelease:(_,g)=>onElementMove?.(id,g.dx,g.dy)}).panHandlers:{};

  const innerTarget=height?Math.max(1,height-2*(padding+template.borderWidth)):undefined;
  const sectionGap=squareLayout?2:aspect>=.75?3:tallLayout?Math.max(8,Math.round((height??0)*.012)):Math.ceil(fontSize*.42);
  const titleMargin=squareLayout?2:aspect>=.75?3:tallLayout?10:6;
  const footerMargin=squareLayout?2:aspect>=.75?3:tallLayout?12:6;
  const safeInset=compact?Math.max(5,Math.round(width*.012)):0;
  return <View ref={ref} collapsable={false} style={[s.canvas,{width,padding,borderWidth:template.borderWidth,borderColor:template.accent,
    backgroundColor:template.background,borderRadius:template.radius,...(height?{height,overflow:'hidden' as const}:{})}]}>
    <View style={innerTarget?{height:innerTarget,overflow:'hidden',paddingHorizontal:safeInset}:undefined} onLayout={({nativeEvent:{layout}})=>{
      const measured=layout.height+2*(padding+template.borderWidth);
      if(height){onReady?.(height);}else{onReady?.(measured);}
    }}>

      {(brand?.logoUri||headerCenter.length||hasDeityUpload||showGod||rightProfileUri)?<View style={[s.header,{borderBottomColor:template.accent}]}>
        <View {...pan('logo')} style={[s.headerSide,tx('logo')]}>
          {brand?.logoUri?<Image source={{uri:brand.logoUri}} resizeMode="contain" style={{width:headerImageSize,height:headerImageSize}}/>:null}
        </View>
        <View {...pan('brand')} style={[s.headerCenter,tx('brand')]}>
          {headerCenter.map((line,index)=><Text key={index} allowFontScaling={false} numberOfLines={index===2?2:1}
            style={{color:index===0?template.title:template.body,fontSize:index===0?Math.max(11,fontSize-1):Math.max(9,fontSize-3),
              lineHeight:index===0?18:15,fontWeight:index<2?'700':'400',textAlign:'center',fontFamily:family}}>{line}</Text>)}
        </View>
        <View {...pan(hasDeityUpload||showGod?'deity':'profile')} style={[s.headerSide,tx(hasDeityUpload||showGod?'deity':'profile')]}>
          {hasDeityUpload?<Image source={{uri:deity!.uri!}} resizeMode="contain" style={{width:headerImageSize,height:headerImageSize,
            opacity:deity?.opacity??1,transform:[{rotate:`${deity?.rotation??0}deg`},{scale:deity?.scale??1}]}}/>
          :showGod?<View style={s.deity}><Text allowFontScaling={false} style={{fontSize:Math.max(30,headerImageSize*.55)}}>{god!.icon}</Text>
            <Text allowFontScaling={false} numberOfLines={1} style={{color:template.accent,fontSize:9,fontWeight:'800'}}>{god!.name}</Text></View>
          :rightProfileUri?<Image source={{uri:rightProfileUri}} resizeMode="cover" style={{width:headerImageSize,height:headerImageSize,borderRadius:headerImageSize/2}}/>:null}
        </View>
      </View>:null}

      {badge?<Text numberOfLines={1} {...pan('badge')} allowFontScaling={false} style={[s.badge,tx('badge'),selectedElement==='badge'&&s.selected,{color:template.accent,fontSize:fontSize+3,lineHeight:lineHeight+6,textAlign:template.align}]}>{badge}</Text>:null}
      <Text {...pan('title')} allowFontScaling={false} style={[s.title,tx('title'),selectedElement==='title'&&s.selected,{color:template.title,fontSize:fontSize+7,lineHeight:Math.ceil((fontSize+7)*1.32),marginTop:titleMargin,textAlign:template.align,fontFamily:family}]}>{title}</Text>
      <View {...pan('content')} style={[tx('content'),tallLayout&&s.tallContent]}>{sections.map(section=><View key={section.key} style={{marginTop:compact?sectionGap:Math.ceil(fontSize*.9)}}>
        <Text allowFontScaling={false} style={[s.label,{color:template.accent,fontSize,lineHeight,textAlign:template.align,fontFamily:family,
          textTransform:template.labelTransform}]}>{section.label}</Text>
        <Text allowFontScaling={false} numberOfLines={compact?(squareLayout?2:aspect>=.75?3:tallLayout?5:4):undefined} ellipsizeMode="tail" textBreakStrategy="highQuality" android_hyphenationFrequency="normal"
          style={[s.body,{color:template.body,fontSize,lineHeight,fontFamily:family,fontWeight:font===2?'600':'400',textAlign:template.align}]}>{section.text}</Text>
      </View>)}</View>

      <View {...pan('footer')} style={[s.footer,tx('footer'),{borderTopColor:template.accent,marginTop:footerMargin}]}>
        <Text allowFontScaling={false} style={{color:template.accent,fontSize:Math.max(11,fontSize-2),lineHeight:20,textAlign:'center',fontWeight:'800',fontFamily:family}}>{DEVOTIONAL_FOOTER}</Text>
        {contactLines.length?<Text allowFontScaling={false} style={{color:template.body,fontSize:10,lineHeight:16,textAlign:'center',fontFamily:family}}>{contactLines.join('  •  ')}</Text>:null}
      </View>
    </View>
  </View>;
});
const s=StyleSheet.create({
  canvas:{alignSelf:'center'},
  header:{flexDirection:'row',alignItems:'center',paddingBottom:7,marginBottom:5,borderBottomWidth:1},
  headerSide:{width:'25%',alignItems:'center',justifyContent:'center',minHeight:48},
  headerCenter:{width:'50%',alignItems:'center',justifyContent:'center',paddingHorizontal:8,gap:1},
  badge:{fontWeight:'700',includeFontPadding:true},
  title:{fontWeight:'800',marginTop:6,includeFontPadding:true},
  label:{fontWeight:'700',includeFontPadding:true},
  body:{includeFontPadding:true,flexShrink:1},
  tallContent:{flexGrow:1,justifyContent:'space-evenly'},
  footer:{marginTop:6,paddingTop:5,borderTopWidth:1,gap:1},
  deity:{alignItems:'center',justifyContent:'center'},
  selected:{borderWidth:1,borderColor:'#E8C97D',borderRadius:6}
});
