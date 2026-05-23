import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';

export default function LoginScreen() {
  const isDark = useColorScheme() === 'dark';
  return (
    <View style={[styles.container,{backgroundColor:isDark?'#252525':'#fff'}]}>
      <Text style={[styles.text,{color:isDark?'#fff':'#000'}]}>LOGIN SCREEN</Text>
    </View>
  )
}
const styles = StyleSheet.create({
container:{flex:1,justifyContent:'center',alignItems:'center'},
text:{fontFamily:'impact',fontSize:32}
})
