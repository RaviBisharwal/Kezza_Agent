import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Colors, Space } from '@/constants/theme';

export function FormField({ label, value, onChangeText, placeholder, keyboardType, maxLength, autoCapitalize = 'none', multiline = false, editable = true }: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'phone-pad' | 'number-pad';
  maxLength?: number;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  multiline?: boolean;
  editable?: boolean;
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#82919A"
        keyboardType={keyboardType}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        multiline={multiline}
        editable={editable}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[styles.input, multiline && styles.multiline, !editable && styles.readonly]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Space.sm },
  label: { color: Colors.ink, fontSize: 13, fontWeight: '700' },
  input: { minHeight: 52, borderRadius: 13, borderWidth: 1, borderColor: Colors.line, backgroundColor: Colors.surface, paddingHorizontal: 15, color: Colors.ink, fontSize: 16 },
  multiline: { minHeight: 90, paddingTop: 14 },
  readonly: { opacity: 0.75 },
});
