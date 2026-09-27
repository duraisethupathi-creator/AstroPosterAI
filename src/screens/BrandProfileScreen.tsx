import React, {useState} from 'react';
import {ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useLanguage} from '../i18n/LanguageProvider';

export function BrandProfileScreen() {
  const {t} = useLanguage();
  const [businessName, setBusinessName] = useState('');
  const [astrologerName, setAstrologerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.page}>
      <ScrollView>
      <Text style={styles.title}>{t('brandProfile')}</Text>
      <Text style={styles.copy}>{t('brandDescription')}</Text>
      <View style={styles.form}>
        <TextInput value={businessName} onChangeText={setBusinessName} placeholder={t('businessName')} accessibilityLabel={t('businessName')} placeholderTextColor="#777B8D" style={styles.input}/>
        <TextInput value={astrologerName} onChangeText={setAstrologerName} placeholder={t('astrologerName')} accessibilityLabel={t('astrologerName')} placeholderTextColor="#777B8D" style={styles.input}/>
        <TextInput value={phone} onChangeText={setPhone} placeholder={t('phone')} accessibilityLabel={t('phone')} placeholderTextColor="#777B8D" keyboardType="phone-pad" style={styles.input}/>
        <TextInput value={address} onChangeText={setAddress} placeholder={t('address')} accessibilityLabel={t('address')} placeholderTextColor="#777B8D" multiline style={[styles.input, styles.multiline]}/>
        <View style={styles.logoBox}><Text style={styles.logoText}>＋ {t('logoUpload')}</Text></View>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:'#090B14',padding:20}, title:{color:'#FFF',fontSize:28,fontWeight:'800'},
  copy:{color:'#999DAF',marginTop:8,lineHeight:20}, form:{gap:12,marginTop:24},
  input:{backgroundColor:'#131624',borderWidth:1,borderColor:'#292D40',borderRadius:14,padding:15,color:'#FFF'},
  multiline:{minHeight:90,textAlignVertical:'top'}, logoBox:{height:120,borderRadius:16,borderWidth:1,borderStyle:'dashed',borderColor:'#665538',alignItems:'center',justifyContent:'center'},
  logoText:{color:'#D6B46A',fontWeight:'700'}
});
