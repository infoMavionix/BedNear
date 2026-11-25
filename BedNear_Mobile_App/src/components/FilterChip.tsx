import React from 'react';
import { Pressable, Text } from 'react-native';
import { styles } from './FilterChip.styles';
type Props={label:string;selected:boolean;onPress:()=>void};
export default function FilterChip({label,selected,onPress}:Props){return <Pressable onPress={onPress} style={[styles.chip,selected&&styles.selected]}><Text style={[styles.text,selected&&styles.selectedText]}>{label}</Text></Pressable>}
