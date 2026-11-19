import React from 'react';
import { Home } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { colors } from '../constants/theme';
import AppButton from './AppButton';
import { styles } from './EmptyState.styles';
type Props={title:string;message:string;actionLabel?:string;onAction?:()=>void};
export default function EmptyState({title,message,actionLabel,onAction}:Props){return <View style={styles.container}><View style={styles.icon}><Home size={30} color={colors.primary}/></View><Text style={styles.title}>{title}</Text><Text style={styles.message}>{message}</Text>{actionLabel&&onAction?<AppButton title={actionLabel} onPress={onAction} style={styles.button}/>:null}</View>}
