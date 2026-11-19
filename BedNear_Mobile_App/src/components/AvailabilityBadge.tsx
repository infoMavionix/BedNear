import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '../constants/theme';
import { isAvailabilityRecent } from '../utils/formatters';
import { styles } from './AvailabilityBadge.styles';
type Props={availableBeds:number;confirmedAt?:string|null};
export default function AvailabilityBadge({availableBeds,confirmedAt}:Props){const recent=isAvailabilityRecent(confirmedAt);const available=availableBeds>0;const bg=available&&recent?colors.successLight:colors.warningLight;const fg=available&&recent?colors.success:colors.warning;const label=!available?'No beds available':recent?`${availableBeds} beds · Confirmed recently`:`${availableBeds} beds · Reconfirm`;return <View style={[styles.badge,{backgroundColor:bg}]}><View style={[styles.dot,{backgroundColor:fg}]}/><Text style={[styles.text,{color:fg}]}>{label}</Text></View>}
