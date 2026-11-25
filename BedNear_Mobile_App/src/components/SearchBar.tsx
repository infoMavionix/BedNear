import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Search, SlidersHorizontal } from 'lucide-react-native';
import { colors } from '../constants/theme';
import { styles } from './SearchBar.styles';
type Props={value:string;onChangeText:(value:string)=>void;placeholder?:string;onFilterPress?:()=>void};
export default function SearchBar({value,onChangeText,placeholder='Locality, college or office',onFilterPress}:Props){return <View style={styles.row}><View style={styles.search}><Search size={20} color={colors.primary}/><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.muted} style={styles.input} returnKeyType="search" accessibilityLabel="Search PGs"/></View>{onFilterPress?<Pressable accessibilityRole="button" accessibilityLabel="Open filters" onPress={onFilterPress} style={styles.filter}><SlidersHorizontal size={21} color="#FFFFFF"/></Pressable>:null}</View>}
