import {Stack} from 'expo-router';
import {StatusBar} from 'expo-status-bar';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {LanguageProvider} from '../src/i18n/LanguageProvider';
import {BrandProfileProvider} from '../src/providers/BrandProfileProvider';
import {ContentStudioProvider} from '../src/providers/ContentStudioProvider';

export default function RootLayout() {
  return <SafeAreaProvider><LanguageProvider><BrandProfileProvider><ContentStudioProvider>
    <StatusBar style="light"/>
    <Stack screenOptions={{headerShown: false, contentStyle: {backgroundColor: '#090B14'}}}>
      <Stack.Screen name="(tabs)"/><Stack.Screen name="editor"/><Stack.Screen name="export"/>
      <Stack.Screen name="studio"/><Stack.Screen name="rasi-results"/><Stack.Screen name="rasi-posters"/>
    </Stack>
  </ContentStudioProvider></BrandProfileProvider></LanguageProvider></SafeAreaProvider>;
}
