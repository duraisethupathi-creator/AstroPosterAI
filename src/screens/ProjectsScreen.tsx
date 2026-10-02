import React, {useCallback, useMemo, useState} from 'react';
import {ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect, useRouter} from 'expo-router';
import {useLanguage} from '../i18n/LanguageProvider';
import {SUPPORTED_LANGUAGES} from '../i18n';
import {getCategory} from '../features/astrology/categories';
import {ZODIACS} from '../features/astrology/zodiac';
import {contentDraftStorage} from '../services/storage/contentDraftStorage';
import {posterProjectStorage} from '../services/storage/posterProjectStorage';
import type {PosterProject} from '../features/projects/types';
import type {ContentDraft} from '../types/contentStudio';
import {useContentStudio} from '../providers/ContentStudioProvider';
import {isStudioDirty} from '../state/contentStudioStore';
import {confirmStudioReplacement} from '../components/confirmStudioReplacement';
import {AppButton} from '../components/AppButton';
import {theme} from '../theme';

type Filter='all'|'favorite'|'batch';
export function ProjectsScreen() {
  const {t, language}=useLanguage(); const router=useRouter(); const {store}=useContentStudio();
  const [drafts,setDrafts]=useState<ContentDraft[]>([]),[posters,setPosters]=useState<PosterProject[]>([]);
  const [loading,setLoading]=useState(true),[error,setError]=useState(false),[attempt,setAttempt]=useState(0);
  const [query,setQuery]=useState(''),[filter,setFilter]=useState<Filter>('all'),[renaming,setRenaming]=useState<string>(),[renameValue,setRenameValue]=useState('');
  const reload=useCallback(()=>setAttempt(n=>n+1),[]);
  useFocusEffect(useCallback(()=>{let alive=true;setLoading(true);setError(false);
    Promise.all([contentDraftStorage.list(),posterProjectStorage.list()]).then(([d,p])=>{if(alive){setDrafts(d);setPosters(p);}}).catch(()=>{if(alive)setError(true);}).finally(()=>{if(alive)setLoading(false);});
    return()=>{alive=false;};},[attempt]));
  const batchCounts=useMemo(()=>posters.reduce<Record<string,number>>((a,p)=>(a[p.batchId]=(a[p.batchId]??0)+1,a),{}),[posters]);
  const visible=useMemo(()=>{const q=query.trim().toLocaleLowerCase();return posters.filter(p=>{
    if(filter==='favorite'&&!p.favorite)return false;if(filter==='batch'&&(batchCounts[p.batchId]??0)<2)return false;
    return !q||[p.name,p.zodiacName,getCategory(p.categoryId).id,p.language].filter(Boolean).some(v=>String(v).toLocaleLowerCase().includes(q));
  });},[posters,query,filter,batchCounts]);
  async function openDraft(draft:ContentDraft){const current=store.getSnapshot();if(current.session?.draftId===draft.id){router.push('/studio');return;}
    if(isStudioDirty(current)&&!await confirmStudioReplacement(t))return;store.open(draft);router.push('/studio');}
  function openProject(project:PosterProject){store.start(project.request,{success:true,categoryId:project.categoryId,zodiacId:project.zodiacId,language:project.language,mode:'live',content:project.content},{id:project.id,editorLayout:project.editorLayout,smartDesign:project.smartDesign});router.push('/studio');}
  async function saveRename(project:PosterProject){const value=renameValue.trim();if(value)await posterProjectStorage.update(project.id,{name:value});setRenaming(undefined);reload();}
  function remove(project:PosterProject){Alert.alert('Delete Project',`Delete “${project.name??project.zodiacName}”?`,[{text:'Cancel',style:'cancel'},{text:'Delete',style:'destructive',onPress:()=>void posterProjectStorage.remove(project.id).then(reload)}]);}
  function removeBatch(project:PosterProject){const count=batchCounts[project.batchId]??1;Alert.alert('Delete Batch',`Delete all ${count} posters in this batch?`,[{text:'Cancel',style:'cancel'},{text:'Delete All',style:'destructive',onPress:()=>void posterProjectStorage.removeBatch(project.batchId).then(reload)}]);}
  return <SafeAreaView edges={['top','left','right']} style={s.page}><ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
    <Text style={s.title}>{t('projects')}</Text><Text style={s.sub}>Offline Project Library · {posters.length} posters · {drafts.length} drafts</Text>
    <TextInput value={query} onChangeText={setQuery} placeholder="Search project, Rasi, category…" placeholderTextColor={theme.colors.muted} style={s.search}/>
    <View style={s.row}>{(['all','favorite','batch'] as Filter[]).map(x=><Pressable key={x} onPress={()=>setFilter(x)} style={[s.chip,filter===x&&s.chipOn]}><Text style={filter===x?s.chipTextOn:s.chipText}>{x==='all'?'All':x==='favorite'?'★ Favorites':'12-Rasi Batches'}</Text></Pressable>)}</View>
    {loading?<ActivityIndicator color={theme.colors.gold}/>:error?<View style={s.card}><Text style={s.error}>{t('studio.loadFailed')}</Text><AppButton title={t('ai.retry')} onPress={reload}/></View>
    :!drafts.length&&!posters.length?<Text style={s.hint}>{t('projectsEmpty')}</Text>:<>
      {visible.map(project=><View key={project.id} style={s.card}>
        <Pressable onPress={()=>openProject(project)}><Text style={s.name}>{project.favorite?'★ ':''}{project.zodiacSymbol} {project.name??project.zodiacName}</Text>
          <Text style={s.hint}>{t(getCategory(project.categoryId).translationKey)} · {SUPPORTED_LANGUAGES.find(i=>i.code===project.language)?.nativeName} · Batch {batchCounts[project.batchId]??1}</Text>
          <Text style={s.hint}>{new Date(project.updatedAt).toLocaleString(language)}</Text></Pressable>
        {renaming===project.id?<View style={s.row}><TextInput autoFocus value={renameValue} onChangeText={setRenameValue} style={[s.search,{flex:1,marginBottom:0}]}/><Pressable style={s.action} onPress={()=>void saveRename(project)}><Text style={s.actionText}>Save</Text></Pressable></View>:null}
        <View style={s.row}>
          <Pressable style={s.action} onPress={()=>{setRenaming(project.id);setRenameValue(project.name??project.zodiacName);}}><Text style={s.actionText}>Rename</Text></Pressable>
          <Pressable style={s.action} onPress={()=>void posterProjectStorage.duplicate(project.id).then(reload)}><Text style={s.actionText}>Duplicate</Text></Pressable>
          <Pressable style={s.action} onPress={()=>void posterProjectStorage.update(project.id,{favorite:!project.favorite}).then(reload)}><Text style={s.actionText}>{project.favorite?'Unstar':'★ Star'}</Text></Pressable>
          <Pressable style={s.danger} onPress={()=>remove(project)}><Text style={s.actionText}>Delete</Text></Pressable>
        </View>
        {(batchCounts[project.batchId]??0)>1?<Pressable onPress={()=>removeBatch(project)}><Text style={s.batchDanger}>Delete entire batch ({batchCounts[project.batchId]})</Text></Pressable>:null}
      </View>)}
      {filter==='all'&&!query&&drafts.map(draft=>{const category=getCategory(draft.request.categoryId),zodiac=ZODIACS.find(sign=>sign.id===draft.request.zodiacId);const title=draft.version.content.title?.trim()||draft.version.content.headline?.trim()||t(category.translationKey);
        return <Pressable key={draft.id} onPress={()=>void openDraft(draft)} style={[s.card,s.draft]}><Text style={s.name}>Draft · {title}</Text><Text style={s.hint}>{t(category.translationKey)}{zodiac?` · ${t(zodiac.translationKey)}`:''}</Text><Text style={s.hint}>{t('studio.lastEdited')}: {new Date(draft.updatedAt).toLocaleString(language)}</Text></Pressable>;})}
    </>}
  </ScrollView></SafeAreaView>;
}
const s=StyleSheet.create({page:{flex:1,backgroundColor:theme.colors.bg},content:{padding:20,gap:14},title:{fontSize:27,fontWeight:'800',color:theme.colors.text},sub:{color:theme.colors.muted},
 search:{minHeight:48,borderRadius:14,borderWidth:1,borderColor:theme.colors.border,backgroundColor:theme.colors.surface,color:theme.colors.text,paddingHorizontal:14,marginBottom:2},
 row:{flexDirection:'row',gap:8,flexWrap:'wrap',alignItems:'center'},chip:{paddingHorizontal:12,paddingVertical:9,borderRadius:20,borderWidth:1,borderColor:theme.colors.border},chipOn:{backgroundColor:theme.colors.gold},chipText:{color:theme.colors.muted},chipTextOn:{color:'#111',fontWeight:'800'},
 card:{backgroundColor:theme.colors.surface,padding:16,gap:8,borderRadius:16,borderWidth:1,borderColor:theme.colors.border},draft:{borderStyle:'dashed'},name:{fontSize:17,color:theme.colors.goldLight,lineHeight:25,fontWeight:'700'},hint:{color:theme.colors.muted,lineHeight:21},error:{color:theme.colors.danger},
 action:{backgroundColor:'#24283A',paddingHorizontal:11,paddingVertical:9,borderRadius:10},danger:{backgroundColor:'#5A2028',paddingHorizontal:11,paddingVertical:9,borderRadius:10},actionText:{color:'#FFF',fontSize:12,fontWeight:'700'},batchDanger:{color:theme.colors.danger,fontSize:12,fontWeight:'700',paddingTop:3}});
