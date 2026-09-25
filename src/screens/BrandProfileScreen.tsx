import React, {useState} from 'react';
import {SafeAreaView, StyleSheet, Text, TextInput, View} from 'react-native';

export function BrandProfileScreen() {
  const [businessName, setBusinessName] = useState('');
  const [astrologerName, setAstrologerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  return (
    <SafeAreaView style={styles.page}>
      <Text style={styles.title}>Brand Profile</Text>
      <Text style={styles.copy}>ஒருமுறை save செய்த brand details எல்லா poster-களிலும் பயன்படுத்தப்படும்.</Text>
      <View style={styles.form}>
        <TextInput value={businessName} onChangeText={setBusinessName} placeholder="Business / Astro Brand Name" placeholderTextColor="#777B8D" style={styles.input}/>
        <TextInput value={astrologerName} onChangeText={setAstrologerName} placeholder="Astrologer Name" placeholderTextColor="#777B8D" style={styles.input}/>
        <TextInput value={phone} onChangeText={setPhone} placeholder="Phone / WhatsApp" placeholderTextColor="#777B8D" keyboardType="phone-pad" style={styles.input}/>
        <TextInput value={address} onChangeText={setAddress} placeholder="Address" placeholderTextColor="#777B8D" multiline style={[styles.input, styles.multiline]}/>
        <View style={styles.logoBox}><Text style={styles.logoText}>＋ Logo / Photo upload module</Text></View>
      </View>
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
