import React, {useMemo, useState} from 'react';
import {Alert, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRouter} from 'expo-router';
import {AppButton} from '../src/components/AppButton';
import {PosterCanvas} from '../src/components/PosterCanvas';
import {DeityPicker} from '../src/components/DeityPicker';
import {DEFAULT_DEITY_SELECTION} from '../src/features/deities/types';
import {DEITIES} from '../src/features/deities/deities';
import {useLanguage} from '../src/i18n/LanguageProvider';
import {translate} from '../src/i18n';
import {getCategory} from '../src/features/astrology/categories';
import {ZODIACS} from '../src/features/astrology/zodiac';
import {rasiStore} from '../src/features/rasi/rasiStore';
import {posterProjectStorage} from '../src/services/storage/posterProjectStorage';
import {useContentStudio} from '../src/providers/ContentStudioProvider';
import {theme} from '../src/theme';
import type {PosterProject} from '../src/features/projects/types';
import {POSTER_TEMPLATES, DEFAULT_TEMPLATE_ID} from '../src/features/templates/templates';

function makeProjects(): PosterProject[] {
  const batch = rasiStore.getSnapshot();
  if (!batch || batch.items.some(item => item.status !== 'success' || !item.result)) return [];
  const now = new Date().toISOString();
  return batch.items.map((item, index) => {
    const zodiac = ZODIACS.find(sign => sign.id === item.zodiacId)!;
    return {
      id: `rasi-${batch.id}-${item.zodiacId}`, batchId: batch.id, createdAt: now, updatedAt: now,
      zodiacId: item.zodiacId, zodiacName: translate(batch.baseRequest.language, zodiac.translationKey), zodiacSymbol: zodiac.symbol,
      language: item.result!.language, categoryId: item.request.categoryId, date: item.request.period?.date,
      content: JSON.parse(JSON.stringify(item.result!.content)), brand: item.request.brand,
      request: JSON.parse(JSON.stringify(item.request)), templateId: POSTER_TEMPLATES[index % POSTER_TEMPLATES.length]?.id ?? DEFAULT_TEMPLATE_ID, deity: {...DEFAULT_DEITY_SELECTION},
    };
  });
}
export default function RasiPostersScreen() {
  const {t} = useLanguage(); const router = useRouter(); const {store: studio} = useContentStudio();
  const initialProjects = useMemo(makeProjects, []); const [projects, setProjects] = useState(initialProjects); const [index, setIndex] = useState(0); const [saving, setSaving] = useState(false);
  const project = projects[index]; const category = project ? getCategory(project.categoryId) : undefined;
  if (!project || !category) return <SafeAreaView style={s.page}><View style={s.content}><Text style={s.title}>12 Rasi Posters</Text>
    <Text style={s.muted}>Generate all 12 Rasi first.</Text><AppButton title={t('create')} onPress={() => router.replace('/create')}/></View></SafeAreaView>;
  const sections = category.outputSections.map(key => ({key, label: translate(project.language, `output.${key}` as any), text: project.content[key] ?? ''}));
  const title = translate(project.language, category.translationKey); const badge = `${project.zodiacSymbol} ${project.zodiacName}`;
  function edit() {
    studio.start(project.request, {success: true, categoryId: project.categoryId, zodiacId: project.zodiacId, language: project.language, mode: 'live', content: project.content});
    router.push('/studio');
  }
  async function saveAll() {
    if (saving) return; setSaving(true);
    try { await posterProjectStorage.saveAll(projects); Alert.alert('Saved', 'All 12 Rasi posters are saved in My Projects.'); }
    catch { Alert.alert('Save failed', 'Please retry.'); } finally { setSaving(false); }
  }
  return <SafeAreaView style={s.page}><ScrollView contentContainerStyle={s.content}>
    <Text style={s.kicker}>MAGIC 12 RASI</Text><Text style={s.title}>12 Poster Preview</Text>
    <Text style={s.counter}>{index + 1} / 12</Text>
    <PosterCanvas width={330} title={title} badge={badge} sections={sections} brand={project.brand} templateId={project.templateId} deity={project.deity} onReady={() => {}}/>
    <Text style={s.sectionTitle}>Choose Template</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.templates}>
      {POSTER_TEMPLATES.map(template => <Pressable key={template.id} onPress={() => setProjects(current => current.map((item,i) => i===index ? {...item,templateId:template.id,updatedAt:new Date().toISOString()} : item))}
        style={[s.templateCard, project.templateId===template.id&&s.templateSelected]}>
        <Text style={s.templateIcon}>{template.icon}</Text><Text style={[s.templateName,project.templateId===template.id&&s.templateNameSelected]}>{template.name}</Text>
      </Pressable>)}
    </ScrollView>
    <DeityPicker value={project.deity} onChange={deity=>setProjects(items=>items.map((item,i)=>i===index?{...item,deity,updatedAt:new Date().toISOString()}:item))}/>
    {project.deity?.mode==='manual'?<Pressable style={s.shuffle} onPress={()=>{const current=DEITIES.findIndex(d=>d.id===project.deity?.deityId);const next=DEITIES[(current+1+DEITIES.length)%DEITIES.length];setProjects(items=>items.map((item,i)=>i===index?{...item,deity:{...(item.deity??DEFAULT_DEITY_SELECTION),mode:'manual',deityId:next.id,uri:undefined},updatedAt:new Date().toISOString()}:item));}}><Text style={s.secondaryText}>✨ Change God Image</Text></Pressable>:null}
    <Pressable style={s.shuffle} onPress={() => {const current=POSTER_TEMPLATES.findIndex(t=>t.id===project.templateId); const next=POSTER_TEMPLATES[(current+1)%POSTER_TEMPLATES.length];
      setProjects(items=>items.map((item,i)=>i===index?{...item,templateId:next.id,updatedAt:new Date().toISOString()}:item));}}><Text style={s.secondaryText}>✨ Change Design</Text></Pressable>
    <Pressable onPress={edit} style={s.secondary}><Text style={s.secondaryText}>Edit Content</Text></Pressable>
    <View style={s.row}><Pressable disabled={index === 0} onPress={() => setIndex(value => value - 1)} style={[s.nav,index===0&&s.disabled]}><Text style={s.navText}>Previous</Text></Pressable>
      <Pressable disabled={index === 11} onPress={() => setIndex(value => value + 1)} style={[s.nav,index===11&&s.disabled]}><Text style={s.navText}>Next</Text></Pressable></View>
    <AppButton title={saving ? 'Saving...' : 'Save All 12'} disabled={saving} onPress={() => void saveAll()}/>
  </ScrollView></SafeAreaView>;
}
const s=StyleSheet.create({page:{flex:1,backgroundColor:theme.colors.bg},content:{padding:20,paddingBottom:48,gap:16,alignItems:'stretch'},
  kicker:{color:theme.colors.gold,fontWeight:'900',letterSpacing:2},title:{color:theme.colors.text,fontSize:30,fontWeight:'900'},
  counter:{color:theme.colors.goldLight,fontWeight:'800',textAlign:'center',fontSize:18},muted:{color:theme.colors.muted},
  row:{flexDirection:'row',gap:12},nav:{flex:1,padding:16,borderRadius:14,backgroundColor:theme.colors.surface,alignItems:'center',borderWidth:1,borderColor:theme.colors.border},
  navText:{color:theme.colors.goldLight,fontWeight:'800'},disabled:{opacity:.35},secondary:{padding:15,alignItems:'center'},secondaryText:{color:theme.colors.gold,fontWeight:'900'},sectionTitle:{color:theme.colors.text,fontSize:18,fontWeight:'900'},templates:{gap:10,paddingVertical:4},templateCard:{width:116,minHeight:86,padding:12,borderRadius:16,backgroundColor:theme.colors.surface,borderWidth:1,borderColor:theme.colors.border,justifyContent:'center',alignItems:'center',gap:6},templateSelected:{borderColor:theme.colors.gold,backgroundColor:'#211B16'},templateIcon:{fontSize:22},templateName:{color:theme.colors.muted,fontWeight:'800',textAlign:'center'},templateNameSelected:{color:theme.colors.goldLight},shuffle:{padding:14,borderRadius:14,borderWidth:1,borderColor:theme.colors.gold,alignItems:'center'}});
