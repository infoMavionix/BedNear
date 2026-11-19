import { StyleSheet } from 'react-native';
import { colors } from '../constants/theme';
export const styles=StyleSheet.create({row:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:16},content:{flex:1},title:{color:colors.text,fontSize:21,fontWeight:'800'},subtitle:{color:colors.muted,fontSize:12,marginTop:5},action:{color:colors.primary,fontSize:13,fontWeight:'700',marginLeft:12}});
