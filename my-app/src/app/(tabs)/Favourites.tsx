import { View, Text } from 'react-native'
import React from 'react'
import { useTheme } from '@/theme/ThemeProvider'

export default function Favourites() {
  const theme = useTheme();
  return (
    <View style={{
      backgroundColor: theme.colors.background,
      height: '100%'
    }}>
      <Text style={{ color: theme.colors.text }}>Favourites</Text>
    </View>
  )
}