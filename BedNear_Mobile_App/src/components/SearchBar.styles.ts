import { StyleSheet } from 'react-native';
import { colors, radius } from '../constants/theme';
export const styles=StyleSheet.create({row:{flexDirection:'row',gap:10},search:{flex:1,minHeight:52,flexDirection:'row',alignItems:'center',gap:10,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,paddingHorizontal:14},input:{flex:1,color:colors.text,fontSize:14,paddingVertical:10},filter:{width:52,height:52,borderRadius:radius.md,backgroundColor:colors.primary,alignItems:'center',justifyContent:'center'}});
