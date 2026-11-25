import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { colors } from '../constants/theme';
import { styles } from './SectionHeader.styles';
type Props={title:string;subtitle?:string;actionLabel?:string;onAction?:()=>void};
export default function SectionHeader({title,subtitle,actionLabel,onAction}:Props){return <View style={styles.row}><View style={styles.content}><Text style={styles.title}>{title}</Text>{subtitle?<Text style={styles.subtitle}>{subtitle}</Text>:null}</View>{actionLabel&&onAction?<Pressable onPress={onAction} hitSlop={8}><Text style={styles.action}>{actionLabel}</Text></Pressable>:null}</View>}
