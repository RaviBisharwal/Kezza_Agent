import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Colors, Space } from '@/constants/theme';

export function FormField({ label, value, onChangeText, placeholder, keyboardType, maxLength, autoCapitalize = 'none', multiline = false, editable = true, prefix, secureTextEntry = false, rightElement }: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'phone-pad' | 'number-pad' | 'email-address';
  maxLength?: number;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  multiline?: boolean;
  editable?: boolean;
  prefix?: string;
  secureTextEntry?: boolean;
  rightElement?: React.ReactNode;
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        {prefix ? <View pointerEvents="none" style={styles.prefix}><Text style={styles.prefixText}>{prefix}</Text></View> : null}
        <TextInput
          accessibilityLabel={label}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#7B91A1"
          keyboardType={keyboardType}
          maxLength={maxLength}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          editable={editable}
          textAlignVertical={multiline ? 'top' : 'center'}
          style={[
            styles.input,
            prefix && styles.inputWithPrefix,
            rightElement ? styles.inputWithRightElement : null,
            multiline && styles.multiline,
            !editable && styles.readonly,
          ]}
        />
        {rightElement ? <View style={styles.rightElement}>{rightElement}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Space.sm },
  label: { color: Colors.ink, fontSize: 13, fontWeight: '700' },
  inputContainer: { position: 'relative', justifyContent: 'center' },
  input: { minHeight: 52, borderRadius: 13, borderWidth: 1, borderColor: Colors.line, backgroundColor: Colors.surface, paddingHorizontal: 15, color: Colors.ink, fontSize: 16 },
  inputWithPrefix: { paddingLeft: 82 },
  inputWithRightElement: { paddingRight: 60 },
  rightElement: { position: 'absolute', right: 12, top: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  prefix: { position: 'absolute', zIndex: 1, left: 0, top: 0, bottom: 0, width: 68, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderRightColor: Colors.line },
  prefixText: { color: Colors.ink, fontSize: 16, fontWeight: '700' },
  multiline: { minHeight: 90, paddingTop: 14 },
  readonly: { opacity: 0.75 },
});
