import React, {useRef, useState} from 'react';
import {Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions} from 'react-native';
import {useRouter} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';
import {captureRef, releaseCapture} from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import {translate, type TranslationKey} from '../i18n';
import {useLanguage} from '../i18n/LanguageProvider';
import {ZODIACS} from '../features/astrology/zodiac';
import {useContentStudio} from '../providers/ContentStudioProvider';
import {getCategory} from '../features/astrology/categories';
import {PosterCanvas} from '../components/PosterCanvas';
import {hasZodiacConflict} from '../features/astrology/zodiacConsistency';
import type {PosterEditorLayout, PosterElementId, PosterElementTransform, PosterProject, SocialContent} from '../features/projects/types';
import {posterProjectStorage} from '../services/storage/posterProjectStorage';
import {POSTER_TEMPLATES} from '../features/templates/templates';

const variants = ['design.gold', 'design.temple', 'design.cosmic', 'design.traditional', 'design.modern'] as const satisfies readonly TranslationKey[];
const fonts = ['preview.fontDefault', 'preview.fontSerif', 'preview.fontBold'] as const;
const backgrounds = ['preview.backgroundNight', 'preview.backgroundPlum', 'preview.backgroundForest'] as const;
const exportPresets=[{id:'portrait',name:'Instagram Portrait',w:1080,h:1350},{id:'square',name:'Square',w:1080,h:1080},{id:'story',name:'Story / WhatsApp',w:1080,h:1920},{id:'facebook',name:'Facebook',w:1200,h:1500}] as const;

export function PosterEditorScreen() {
  const {t, language} = useLanguage();
  const router = useRouter();
  const {width} = useWindowDimensions();
  const {state: {design}} = useContentStudio();
  const category = design ? getCategory(design.request.categoryId) : undefined;
  const contentLanguage = design?.version.language ?? language;
  // Presentation state never writes to the Studio, original request, or language provider.
  const [variant, setVariant] = useState(design?.smartDesign?.variant??0);
  const [font, setFont] = useState(design?.smartDesign?.font??0);
  const [background, setBackground] = useState(design?.smartDesign?.background??0);
  const [selectedElement,setSelectedElement]=useState<PosterElementId>('title');
  const defaultTransform: PosterElementTransform={x:0,y:0,scale:1,rotation:0,opacity:1};
  const [elementTransforms,setElementTransforms]=useState<PosterEditorLayout>(()=>design?.editorLayout??{});
  const [projectId,setProjectId]=useState<string|undefined>(design?.projectId);
  const [savingProject,setSavingProject]=useState(false);
  const [projectSaved,setProjectSaved]=useState(false);
  const [smartDesign,setSmartDesign]=useState(design?.smartDesign?.smartDesign??0);
  const [smartLayoutStep,setSmartLayoutStep]=useState(0);
  const [templateId,setTemplateId]=useState(design?.smartDesign?.templateId??POSTER_TEMPLATES[design?.smartDesign?.smartDesign??0]?.id??POSTER_TEMPLATES[0].id);
  const currentTransform=elementTransforms[selectedElement]??defaultTransform;
  const patchSelected=(patch:Partial<PosterElementTransform>)=>setElementTransforms(all=>({...all,[selectedElement]:{...(all[selectedElement]??defaultTransform),...patch}}));
  const smartLayout=(seed:number):PosterEditorLayout=>{const mode=seed%4;const side=mode%2===0?1:-1;return {
    logo:{...defaultTransform,x:-side*(12+mode*3),y:mode===2?6:0,scale:mode===1?1.08:.92},
    brand:{...defaultTransform,x:0,y:mode===0?-8:mode===1?6:0,scale:mode===3?.94:1},
    profile:{...defaultTransform,x:side*(12+mode*3),y:mode===2?6:0,scale:mode===1?1.08:.92},
    deity:{...defaultTransform,x:side*(12+mode*3),y:mode===2?6:0,scale:mode===1?1.08:.92},
    badge:{...defaultTransform,x:side*(mode===0?18:10),y:mode===1?10:-2,scale:mode===2?1.15:1.05},
    title:{...defaultTransform,x:mode===3?side*12:0,y:mode===0?10:mode===2?-8:2,scale:mode===1?1.12:1.04},
    content:{...defaultTransform,x:mode===3?side*8:0,y:mode===2?10:0,scale:mode===0?.96:1},
    footer:{...defaultTransform,x:0,y:mode===1?-8:mode===3?8:2,scale:mode===2?.9:.96}
  };};
  const applySmartDesign=()=>{const zodiacIndex=zodiac?ZODIACS.findIndex(sign=>sign.id===zodiac.id):0;const next=(smartDesign+1+Math.max(0,zodiacIndex))%POSTER_TEMPLATES.length;setSmartDesign(next);setTemplateId(POSTER_TEMPLATES[next].id);setVariant(next%variants.length);setFont(next%fonts.length);setBackground(next%backgrounds.length);setElementTransforms(smartLayout(next));setProjectSaved(false);};
  const zodiac = ZODIACS.find(sign => sign.id === design?.request.zodiacId);
  const zodiacConflict = !!design && hasZodiacConflict(design.version.content, design.request.zodiacId);
  const canvas = useRef<View>(null);
  const exportLock = useRef(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(false);
  const [exportPreset,setExportPreset]=useState(0);
  const [exportQuality,setExportQuality]=useState<'standard'|'high'|'max'>('high');
  const [batchCount,setBatchCount]=useState(0);
  const [social,setSocial]=useState<SocialContent>(()=>design?.socialState?.content??{caption:'',description:'',hashtags:'',cta:''});
  const [socialPreset,setSocialPreset]=useState<'instagram'|'facebook'|'whatsapp'>(()=>design?.socialState?.platform??'instagram');
  const [socialVariant,setSocialVariant]=useState(design?.socialState?.variant??0);
  const posterWidth = Math.min(560, Math.max(1, width - 40));
  const activePreset=exportPresets[exportPreset];
  const posterHeight=Math.round(posterWidth*(activePreset.h/activePreset.w));
  const sections = category && design ? category.outputSections.map(key => ({
    key, label: translate(contentLanguage, `output.${key}`), text: design.version.content[key] ?? '',
  })) : [{key: 'general', label: t('output.general'), text: t('editorSample')}];
  const title = category ? translate(contentLanguage, category.translationKey) : t('todayHoroscope');
  const badge = zodiac ? `${zodiac.symbol} ${translate(contentLanguage, zodiac.translationKey)}` : undefined;
  const brand = design?.request.brand;
  const generateSocial=()=>{const next=socialVariant+1;setSocialVariant(next);const sign=zodiac?translate(contentLanguage,zodiac.translationKey):'';const cat=category?translate(contentLanguage,category.translationKey):title;const general=design?.version.content.general??'';const business=brand?.businessName||brand?.astrologerName||'AstroPoster AI';const ta=contentLanguage==='ta';const hook=ta?(next%2?'✨ இன்று உங்கள் ராசிக்கு என்ன பலன்?':'🔮 இன்றைய ராசி வழிகாட்டல்'):(next%2?'✨ What does today hold for your sign?':'🔮 Your astrology guidance for today');const platform=socialPreset==='instagram'?'Instagram':socialPreset==='facebook'?'Facebook':'WhatsApp';setSocial({caption:`${hook}\n${zodiac?.symbol??'✨'} ${sign} · ${cat}\n${general}`,description:ta?`${sign} ${cat}. ${business} வழங்கும் இன்றைய ஜோதிட வழிகாட்டலை சேமித்து பகிருங்கள். · ${platform}`:`${cat} for ${sign}. Save and share today’s astrology guidance from ${business}. · ${platform}`,hashtags:socialPreset==='whatsapp'?'':`#${sign.replace(/\\s+/g,'')} #Astrology #RasiPalan #Horoscope #${business.replace(/\\s+/g,'')}`,cta:brand?.whatsapp?(ta?`மேலும் விவரங்களுக்கு WhatsApp: ${brand.whatsapp}`:`For details WhatsApp: ${brand.whatsapp}`):(ta?`${business}-ஐ தொடர்ந்து பாருங்கள்.`:`Follow ${business} for more astrology updates.`)});};
  const copySocial=async(key:keyof SocialContent)=>{await Clipboard.setStringAsync(social[key]);Alert.alert('Copied',key+' copied to clipboard.');};
  const copyAllSocial=async()=>{await Clipboard.setStringAsync([social.caption,social.description,social.hashtags,social.cta].filter(Boolean).join('\n\n'));Alert.alert('Copied','Social content copied.');};
  // Remount only canvas layout state when its inputs change; generated text is immutable here.
  const layoutKey = JSON.stringify([posterWidth, posterHeight, sections, title, badge, brand, templateId, font, variant, background, elementTransforms]);
  const [ready, setReady] = useState<{key: string; height: number}>();
  async function saveProject() {
    if (!design || !zodiac || savingProject) return;
    setSavingProject(true); setProjectSaved(false);
    const now=new Date().toISOString();
    try {
      if (projectId) {
        await posterProjectStorage.update(projectId,{editorLayout:elementTransforms,smartDesign:{variant,font,background,smartDesign,templateId},socialContent:social,socialState:{content:social,platform:socialPreset,variant:socialVariant}});
      } else {
        const id=`poster-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
        const project: PosterProject={id,batchId:id,createdAt:now,updatedAt:now,zodiacId:zodiac.id,
          zodiacName:translate(contentLanguage,zodiac.translationKey),zodiacSymbol:zodiac.symbol,language:contentLanguage,
          categoryId:design.request.categoryId,content:design.version.content,brand:design.request.brand,
          request:design.request,editorLayout:elementTransforms,smartDesign:{variant,font,background,smartDesign,templateId},socialContent:social,socialState:{content:social,platform:socialPreset,variant:socialVariant}};
        await posterProjectStorage.saveAll([project]); setProjectId(id);
      }
      setProjectSaved(true);
    } catch { Alert.alert('Save Project','Could not save this project. Please try again.'); }
    finally { setSavingProject(false); }
  }
  async function capturePoster(format:'png'|'jpg',presetIndex=exportPreset){if(ready?.key!==layoutKey||!canvas.current)throw new Error('NOT_READY');const preset=exportPresets[presetIndex];const q=exportQuality==='standard'?.82:exportQuality==='high'?.94:1;const targetW=exportQuality==='standard'?Math.min(900,preset.w):preset.w;const targetH=Math.round(targetW*(preset.h/preset.w));return captureRef(canvas,{format,quality:q,result:'tmpfile',width:targetW,height:targetH});}
  async function saveGallery(){
    if(exportLock.current||zodiacConflict)return;
    exportLock.current=true;setExporting(true);setExportError(false);let uri:string|undefined;
    try{
      uri=await capturePoster('png');
      if(!await Sharing.isAvailableAsync())throw new Error('Unavailable');
      await Sharing.shareAsync(uri,{mimeType:'image/png',UTI:'public.png',dialogTitle:'Save poster'});
    }catch{setExportError(true);}finally{if(uri)releaseCapture(uri);exportLock.current=false;setExporting(false);}
  }
  async function exportAllSizes(){
    Alert.alert('Export All Sizes','Expo Go compatibility mode is active. Select a preset and use Save / Share. A release build can restore direct gallery batch saving.');
  }
  async function inspectBatch(){if(!projectId)return;const current=await posterProjectStorage.get(projectId);if(!current)return;const batch=await posterProjectStorage.listBatch(current.batchId);setBatchCount(batch.length);Alert.alert('12-Rasi Batch',batch.length>1?String(batch.length)+' saved posters found. Open 12-Rasi Batches in My Projects to export each saved poster safely.':'This project is not part of a multi-poster batch.');}
  async function exportPoster(format: 'png' | 'jpg') {
    if (zodiacConflict || exportLock.current || ready?.key !== layoutKey || !canvas.current) return;
    exportLock.current = true;
    setExporting(true); setExportError(false);
    let uri: string | undefined;
    try {
      if (!await Sharing.isAvailableAsync()) throw new Error('Unavailable');
      uri = await capturePoster(format);
      await Sharing.shareAsync(uri, {mimeType: format === 'png' ? 'image/png' : 'image/jpeg',
        UTI: format === 'png' ? 'public.png' : 'public.jpeg'});
    } catch { setExportError(true); }
    finally {
      if (uri) releaseCapture(uri);
      exportLock.current = false; setExporting(false);
    }
  }
  const control = (label: string, value: string, onPress: () => void, hint?: string) => (
    <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${value}`} accessibilityHint={hint}
      disabled={exporting} onPress={onPress} style={s.button}>
      <Text style={s.controlLabel}>{label}</Text><Text style={s.buttonText}>{value}</Text>
    </Pressable>
  );
  return (
    <SafeAreaView style={s.page}>
      <ScrollView contentContainerStyle={s.content} removeClippedSubviews={false}>
        <Text style={s.title}>{t('posterEditor')}</Text>
        <Text accessibilityRole="header" style={s.heading}>{t('preview.title')}</Text>
        {zodiacConflict ? <View><Text accessibilityRole="alert" style={s.error}>{t('preview.zodiacMismatch')}</Text>
          <Pressable accessibilityRole="button" style={s.button} onPress={() => router.push('/studio')}><Text style={s.buttonText}>{t('studio.resume')}</Text></Pressable>
        </View> : <PosterCanvas key={layoutKey} ref={canvas} width={posterWidth} height={posterHeight} title={title} badge={badge}
          sections={sections} brand={brand} templateId={templateId} variant={variant} font={font} background={background} editable selectedElement={selectedElement} elementTransforms={elementTransforms} onElementPress={setSelectedElement} onElementMove={(element,dx,dy)=>{setSelectedElement(element);setElementTransforms(all=>{const base=all[element]??defaultTransform;return {...all,[element]:{...base,x:Math.max(-posterWidth*.35,Math.min(posterWidth*.35,base.x+dx)),y:Math.max(-posterWidth*.35,Math.min(posterWidth*.35,base.y+dy))}}});}}
          onReady={height => setReady({key: layoutKey, height})}/>}
        <View style={s.controls}>
          <Text accessibilityRole="header" style={s.heading}>{t('preview.controls')}</Text>
          <View style={s.smartCard}>
            <Text style={s.smartTitle}>✨ Smart Design</Text>
            <Text style={s.controlLabel}>One tap automatically balances style, font and background without changing your astrology content.</Text>
            <View style={s.actions}><Pressable accessibilityRole="button" onPress={applySmartDesign} style={s.smartButton}><Text style={s.smartButtonText}>Magic Design · {smartDesign+1}/{POSTER_TEMPLATES.length}</Text></Pressable>
            <Pressable accessibilityRole="button" onPress={()=>{const next=(smartLayoutStep+1)%4;setSmartLayoutStep(next);const templateIndex=(next+Math.max(0,zodiac?ZODIACS.findIndex(sign=>sign.id===zodiac.id):0))%POSTER_TEMPLATES.length;setTemplateId(POSTER_TEMPLATES[templateIndex].id);setSmartDesign(templateIndex);setVariant(templateIndex%variants.length);setFont(next%fonts.length);setBackground(next%backgrounds.length);setElementTransforms(smartLayout(next));setProjectSaved(false);}} style={s.smartButton}><Text style={s.smartButtonText}>Smart Layout · {smartLayoutStep+1}/4</Text></Pressable></View>
          </View>
          <Pressable accessibilityRole="button" disabled={!design||savingProject} onPress={()=>void saveProject()} style={[s.saveProject,(!design||savingProject)&&s.disabled]}>
            <Text style={s.saveProjectText}>{savingProject?'Saving…':projectSaved?'Saved ✓':'Save Project'}</Text>
          </Pressable>
          <View style={s.stage9}>
            <Text style={s.stage9Title}>Selected: {selectedElement}</Text>
            <Text style={s.controlLabel}>Tap logo, profile/deity, brand, zodiac, title, content or footer on the poster.</Text>
            <View style={s.actions}>
              <Pressable style={s.button} onPress={()=>patchSelected({scale:Math.max(.5,+(currentTransform.scale-.1).toFixed(1))})}><Text style={s.buttonText}>− Size</Text></Pressable>
              <Pressable style={s.button} onPress={()=>patchSelected({scale:Math.min(2,+(currentTransform.scale+.1).toFixed(1))})}><Text style={s.buttonText}>+ Size</Text></Pressable>
              <Pressable style={s.button} onPress={()=>patchSelected({rotation:(currentTransform.rotation+15)%360})}><Text style={s.buttonText}>Rotate</Text></Pressable>
            </View>
            <View style={s.actions}>
              <Pressable style={s.button} onPress={()=>patchSelected({opacity:currentTransform.opacity<.8?1:.65})}><Text style={s.buttonText}>Opacity {Math.round(currentTransform.opacity*100)}%</Text></Pressable>
              <Pressable style={s.button} onPress={()=>setElementTransforms(all=>({...all,[selectedElement]:defaultTransform}))}><Text style={s.buttonText}>Reset</Text></Pressable>
            </View>
            <Text style={s.controlLabel}>Drag selected element directly on poster · Size {Math.round(currentTransform.scale*100)}% · Rotation {currentTransform.rotation}° · X {Math.round(currentTransform.x)} Y {Math.round(currentTransform.y)}</Text>
          </View>
          <View style={s.actions}>
            {control(t('preview.style'), t(variants[variant]), () => setVariant(value => (value + 1) % variants.length))}
            {control(t('zodiac'), badge ?? t('zodiac'), () => Alert.alert(t('zodiac'), t('preview.zodiacHint'), [
              {text: t('studio.cancel'), style: 'cancel'},
              {text: t('create'), onPress: () => router.navigate({pathname: '/(tabs)/create', params: {
                contentLanguage, categoryId: design?.request.categoryId ?? 'daily', zodiacId: zodiac?.id ?? '', selectionId: String(Date.now()),
              }})},
            ]), t('preview.zodiacHint'))}
          </View>
          <View style={s.actions}>
            {control(t('font'), t(fonts[font]), () => setFont(value => (value + 1) % fonts.length))}
            {control(t('background'), t(backgrounds[background]), () => setBackground(value => (value + 1) % backgrounds.length))}
          </View>
          <View style={s.socialCard}><Text style={s.smartTitle}>Social Content Studio</Text><Text style={s.controlLabel}>Offline Tamil/English social copy. Select platform, generate variants, edit and copy.</Text><View style={s.actions}>{(['instagram','facebook','whatsapp'] as const).map(p=><Pressable key={p} onPress={()=>setSocialPreset(p)} style={[s.exportChip,socialPreset===p&&s.exportChipOn]}><Text style={socialPreset===p?s.exportChipTextOn:s.exportChipText}>{p[0].toUpperCase()+p.slice(1)}</Text></Pressable>)}</View><View style={s.actions}><Pressable onPress={generateSocial} style={s.smartButton}><Text style={s.smartButtonText}>{socialVariant?'Regenerate Variant':'Generate Social Content'}</Text></Pressable><Pressable onPress={()=>void copyAllSocial()} style={s.smartButton}><Text style={s.smartButtonText}>Copy All</Text></Pressable></View>{(['caption','description','hashtags','cta'] as const).map(key=><View key={key}><View style={s.socialHead}><Text style={s.socialLabel}>{key.toUpperCase()}</Text><Pressable onPress={()=>void copySocial(key)}><Text style={s.copyText}>Copy</Text></Pressable></View><TextInput multiline value={social[key]} onChangeText={value=>setSocial(old=>({...old,[key]:value}))} placeholder={'Enter '+key} placeholderTextColor="#666" style={s.socialInput}/></View>)}</View>
                    <View style={s.exportCard}>
            <Text style={s.stage9Title}>Professional Export</Text>
            <Text style={s.controlLabel}>Preset · {exportPresets[exportPreset].name} · {exportPresets[exportPreset].w}×{exportPresets[exportPreset].h}</Text>
            <View style={s.actions}>{exportPresets.map((p,i)=><Pressable key={p.id} onPress={()=>setExportPreset(i)} style={[s.exportChip,exportPreset===i&&s.exportChipOn]}><Text style={exportPreset===i?s.exportChipTextOn:s.exportChipText}>{p.name}</Text></Pressable>)}</View>
            <Text style={s.controlLabel}>Quality</Text><View style={s.actions}>{(['standard','high','max'] as const).map(q=><Pressable key={q} onPress={()=>setExportQuality(q)} style={[s.exportChip,exportQuality===q&&s.exportChipOn]}><Text style={exportQuality===q?s.exportChipTextOn:s.exportChipText}>{q[0].toUpperCase()+q.slice(1)}</Text></Pressable>)}</View>
          </View>
                    <View style={s.actions}>
            <Pressable disabled={exporting||ready?.key!==layoutKey} onPress={()=>void saveGallery()} style={[s.export,(exporting||ready?.key!==layoutKey)&&s.disabled]}><Text style={s.exportText}>Save to Gallery</Text></Pressable>
            <Pressable disabled={exporting||ready?.key!==layoutKey} onPress={()=>void exportAllSizes()} style={[s.export,(exporting||ready?.key!==layoutKey)&&s.disabled]}><Text style={s.exportText}>Export All Sizes</Text></Pressable>
          </View>
          {projectId?<View style={s.batchExport}><Text style={s.stage9Title}>12-Rasi Batch Export</Text><Text style={s.controlLabel}>{batchCount?String(batchCount)+' posters detected':'Check the saved batch before exporting.'}</Text><Pressable disabled={exporting} onPress={()=>void inspectBatch()} style={s.smartButton}><Text style={s.smartButtonText}>Check Saved Batch</Text></Pressable><Text style={s.controlLabel}>Batch safety mode keeps every Rasi own text, zodiac and saved design. Export individual posters from the saved batch; no content is substituted during capture.</Text></View>:null}
          {exportError ? <Text accessibilityRole="alert" style={s.error}>{t('preview.exportFailed')}</Text> : null}
          {exporting ? <Text accessibilityLiveRegion="polite" style={s.controlLabel}>{t('preview.exporting')}</Text> : null}
          <View style={s.actions}>
            {(['png', 'jpg'] as const).map(format => <Pressable key={format} accessibilityRole="button"
              disabled={zodiacConflict || exporting || ready?.key !== layoutKey} onPress={() => void exportPoster(format)}
              style={[s.export, (zodiacConflict || exporting || ready?.key !== layoutKey) && s.disabled]}>
              <Text style={s.exportText}>{t(format === 'png' ? 'preview.exportPng' : 'preview.exportJpeg')}</Text>
            </Pressable>)}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  page: {flex: 1, backgroundColor: '#090B14'}, content: {padding: 20, alignItems: 'stretch'},
  title: {color: '#FFF', fontSize: 27, fontWeight: '900'}, heading: {color: '#E8C97D', fontSize: 17, fontWeight: '700', marginVertical: 16},
  controls: {marginTop: 24, borderTopWidth: 1, borderTopColor: '#393345'},
  smartCard:{padding:14,borderWidth:1,borderColor:'#7C5CFF',backgroundColor:'#121025',borderRadius:16,marginBottom:14,gap:8},smartTitle:{color:'#E8C97D',fontSize:18,fontWeight:'900'},smartButton:{flex:1,minHeight:48,borderRadius:13,backgroundColor:'#5B35D5',alignItems:'center',justifyContent:'center',paddingHorizontal:10},smartButtonText:{color:'#FFF',fontWeight:'900'},
  stage9:{padding:12,borderWidth:1,borderColor:'#D6B46A',borderRadius:14,marginBottom:14,gap:8},stage9Title:{color:'#E8C97D',fontWeight:'900',fontSize:16},
  actions: {flexDirection: 'row', gap: 10, marginBottom: 10},
  button: {flex: 1, minHeight: 64, backgroundColor: '#171A28', borderRadius: 13, padding: 13, justifyContent: 'center'},
  controlLabel: {color: '#AAA7B7', fontSize: 12, marginBottom: 5}, buttonText: {color: '#FFF', fontWeight: '700', lineHeight: 23},
  saveProject:{minHeight:52,backgroundColor:'#E8C97D',borderRadius:15,alignItems:'center',justifyContent:'center',marginBottom:14}, saveProjectText:{color:'#111',fontWeight:'900',fontSize:16},
  socialCard:{padding:14,borderWidth:1,borderColor:'#7C5CFF',backgroundColor:'#121025',borderRadius:16,marginBottom:14,gap:10},socialHead:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},copyText:{color:'#BCA8FF',fontWeight:'800',fontSize:12},socialLabel:{color:'#E8C97D',fontSize:11,fontWeight:'900',marginTop:4},socialInput:{minHeight:58,color:'#FFF',backgroundColor:'#0B0D18',borderWidth:1,borderColor:'#393345',borderRadius:11,padding:11,textAlignVertical:'top'},
  batchExport:{padding:14,borderWidth:1,borderColor:'#7C5CFF',borderRadius:16,marginBottom:14,gap:8},
  exportCard:{padding:14,borderWidth:1,borderColor:'#393345',borderRadius:16,marginBottom:14,gap:8},exportChip:{flex:1,minWidth:120,padding:10,borderWidth:1,borderColor:'#393345',borderRadius:11,alignItems:'center'},exportChipOn:{backgroundColor:'#E8C97D'},exportChipText:{color:'#AAA7B7',fontSize:11,fontWeight:'700'},exportChipTextOn:{color:'#111',fontSize:11,fontWeight:'900'},
  export: {flex: 1, minHeight: 48, backgroundColor: '#D6B46A', padding: 14, borderRadius: 15, alignItems: 'center', justifyContent: 'center'},
  exportText: {color: '#111', fontWeight: '800', textAlign: 'center'}, disabled: {opacity: 0.45}, error: {color: '#FFB0A4', marginVertical: 10},
});
