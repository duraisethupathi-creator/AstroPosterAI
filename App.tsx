import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {HomeScreen} from './src/screens/HomeScreen';
import {BrandProfileScreen} from './src/screens/BrandProfileScreen';

const Tab = createBottomTabNavigator();

function Placeholder({title}: {title: string}) {
  const {SafeAreaView, Text} = require('react-native');
  return <SafeAreaView style={{flex:1,backgroundColor:'#090B14',alignItems:'center',justifyContent:'center'}}><Text style={{color:'#FFF',fontSize:22,fontWeight:'700'}}>{title}</Text></SafeAreaView>;
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{headerShown:false, tabBarStyle:{backgroundColor:'#10131E',borderTopColor:'#24283A'},tabBarActiveTintColor:'#D6B46A',tabBarInactiveTintColor:'#777B8D'}}>
        <Tab.Screen name="Home" component={HomeScreen}/>
        <Tab.Screen name="Create" children={() => <Placeholder title="Create Poster"/>}/>
        <Tab.Screen name="Brand" component={BrandProfileScreen}/>
        <Tab.Screen name="Projects" children={() => <Placeholder title="My Projects"/>}/>
        <Tab.Screen name="Settings" children={() => <Placeholder title="Settings"/>}/>
      </Tab.Navigator>
    </NavigationContainer>
  );
}
