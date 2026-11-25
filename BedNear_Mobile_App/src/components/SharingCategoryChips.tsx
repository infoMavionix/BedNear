
import React from 'react';
import {
  ScrollView,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';

import { colors } from '../constants/theme';
import { SharingOption } from '../types/listing';

type Props = {
  selected: SharingOption;
  onSelect: (value: SharingOption) => void;
};

const sharingOptions: SharingOption[] = [
  'Any',
  'Single',
  '2 Sharing',
  '3 Sharing',
  '4 Sharing',
  '5 Sharing',
  '6 Sharing',
];

export default function SharingCategoryChips({
  selected,
  onSelect,
}: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      {sharingOptions.map(option => {
        const isSelected = selected === option;

        return (
          <Pressable
            key={option}
            onPress={() => onSelect(option)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            style={[
              styles.chip,
              isSelected && styles.selectedChip,
            ]}
          >
            <Text
              style={[
                styles.label,
                isSelected && styles.selectedLabel,
              ]}
            >
              {option === 'Any' ? 'All PGs' : option}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
    paddingRight: 12,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  selectedChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  selectedLabel: {
    color: '#FFFFFF',
  },
});
