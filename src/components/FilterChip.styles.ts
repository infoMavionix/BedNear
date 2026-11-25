import { StyleSheet } from 'react-native';
import { colors, radius } from '../constants/theme';
export const styles=StyleSheet.create({chip:{borderWidth:1,borderColor:colors.border,borderRadius:radius.pill,paddingHorizontal:13,paddingVertical:9,backgroundColor:colors.surface},selected:{backgroundColor:colors.primaryLight,borderColor:colors.primary},text:{color:colors.muted,fontSize:12,fontWeight:'600'},selectedText:{color:colors.primary}});
