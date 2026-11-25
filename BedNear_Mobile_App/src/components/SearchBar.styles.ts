import { StyleSheet } from "react-native";
import { colors, radius } from "../constants/theme";

export const styles = StyleSheet.create({
  row: {
    position: 'relative',
    width: '100%',
    height: 54,
  },

  search: {
    width: '100%',
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    paddingLeft: 14,
    paddingRight: 70,
  },

  input: {
    flex: 1,
    height: '100%',
    color: colors.text,
    fontSize: 14,
    paddingVertical: 10,
  },

  filter: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 54,
    height: 54,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

