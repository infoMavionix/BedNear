
import React from 'react';
import {
  Pressable,
  TextInput,
  View,
  Keyboard,
} from 'react-native';
import { Search, SlidersHorizontal } from 'lucide-react-native';

import { colors } from '../constants/theme';
import { styles } from './SearchBar.styles';

type Props = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  onFilterPress?: () => void;
  onSubmitEditing?: () => void;
};

export default function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search locality, college or office',
  onFilterPress,
  onSubmitEditing,
}: Props) {
  const handleSubmit = () => {
    Keyboard.dismiss();
    onSubmitEditing?.();
  };

  return (
    <View style={styles.row}>
      <View style={styles.search}>
        <Search size={20} color={colors.primary} />

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          style={styles.input}
          returnKeyType="search"
          onSubmitEditing={handleSubmit}
          accessibilityLabel="Search PGs by locality, college or office"
          accessibilityHint="Enter a place and press search to see matching PGs"
          autoCapitalize="words"
          autoCorrect={false}
        />
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open search filters"
        accessibilityHint="Choose budget, gender, sharing and amenities"
        onPress={onFilterPress}
        style={({ pressed }) => [
          styles.filter,
          pressed && { opacity: 0.8 },
        ]}
      >
        <SlidersHorizontal size={21} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}
