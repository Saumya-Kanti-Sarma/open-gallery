import React from 'react'
import { Text, Pressable, StyleSheet, GestureResponderEvent } from 'react-native'
import { theme } from '@/constants/theme';
type ButtonProps = {
  title?: string
  onPress?: (event: GestureResponderEvent) => void
}

export default function Button({ title = 'Button', onPress }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: theme.colors.green,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    opacity: 0.75
  },
  pressed: {
    opacity: 1,
  },
  text: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
})