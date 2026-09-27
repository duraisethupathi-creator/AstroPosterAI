import React from 'react';
import {StyleSheet, Text, TextInput, type TextInputProps, View} from 'react-native';
import {theme} from '../theme';

export function AppInput({label, error, style, ...props}: TextInputProps & {label?: string; error?: string}) {
  return (
    <View>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <TextInput placeholderTextColor="#707487" accessibilityLabel={label} accessibilityHint={error}
        {...props} style={[s.input, props.multiline && s.multi, error && s.invalid, style]}/>
      {error ? <Text accessibilityRole="alert" style={s.error}>{error}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  label: {color: '#C9CAD2', fontWeight: '700', marginBottom: 8},
  input: {backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border,
    borderRadius: theme.radius.md, padding: 14, color: theme.colors.text},
  multi: {minHeight: 96, textAlignVertical: 'top'},
  invalid: {borderColor: theme.colors.danger},
  error: {color: theme.colors.danger, marginTop: 6, lineHeight: 20},
});
