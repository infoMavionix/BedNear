import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { colors } from '../constants/theme';
import { styles } from './LoadingView.styles';
export default function LoadingView({message='Loading...'}:{message?:string}){return <View style={styles.container}><ActivityIndicator size="large" color={colors.primary}/><Text style={styles.message}>{message}</Text></View>}
