import React from 'react';
import {FlatList, Pressable, SafeAreaView, StyleSheet, Text, View} from 'react-native';
import {POSTER_CATEGORIES} from '../config/categories';

export function HomeScreen() {
  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>ASTROPOSTER AI</Text>
        <Text style={styles.title}>ஜோதிட Content Studio</Text>
        <Text style={styles.subtitle}>AI content • Premium posters • Social-ready</Text>
      </View>

      <Pressable style={styles.magicCard}>
        <Text style={styles.magicLabel}>✨ MAGIC 12 RASI</Text>
        <Text style={styles.magicTitle}>12 ராசி Posters ஒரே Tap-ல்</Text>
        <Text style={styles.magicCopy}>Content → Zodiac design → Brand → Export</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>Poster Flows</Text>
      <FlatList
        data={POSTER_CATEGORIES}
        numColumns={2}
        keyExtractor={item => item.id}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        renderItem={({item}) => (
          <Pressable style={styles.card}>
            <Text style={styles.icon}>{item.icon}</Text>
            <Text style={styles.cardTitle}>{item.titleTa}</Text>
            <Text style={styles.cardSubtitle}>{item.titleEn}</Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {flex: 1, backgroundColor: '#090B14', paddingHorizontal: 18},
  header: {paddingTop: 20, paddingBottom: 18},
  eyebrow: {color: '#D6B46A', fontSize: 12, fontWeight: '800', letterSpacing: 2},
  title: {color: '#FFFFFF', fontSize: 27, fontWeight: '800', marginTop: 6},
  subtitle: {color: '#989BAD', marginTop: 6, fontSize: 14},
  magicCard: {backgroundColor: '#171326', borderWidth: 1, borderColor: '#5C4930', borderRadius: 22, padding: 20, marginBottom: 24},
  magicLabel: {color: '#E8C97D', fontSize: 12, fontWeight: '900'},
  magicTitle: {color: '#FFFFFF', fontSize: 20, fontWeight: '800', marginTop: 8},
  magicCopy: {color: '#B8B2C6', marginTop: 7},
  sectionTitle: {color: '#FFFFFF', fontSize: 18, fontWeight: '800', marginBottom: 12},
  list: {paddingBottom: 30},
  row: {gap: 12},
  card: {flex: 1, minHeight: 128, backgroundColor: '#121522', borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#24283A'},
  icon: {fontSize: 25},
  cardTitle: {color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginTop: 12},
  cardSubtitle: {color: '#85899B', fontSize: 11, marginTop: 4}
});
