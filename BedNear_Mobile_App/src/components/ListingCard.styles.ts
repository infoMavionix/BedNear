
import { StyleSheet } from 'react-native';
import { colors, radius } from '../constants/theme';

export const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginBottom: 17,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },

  imageWrap: {
    height: 185,
    backgroundColor: colors.primaryLight,
  },

  image: {
    width: '100%',
    height: '100%',
  },

  heart: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 42,
    height: 42,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  badgeWrap: {
    position: 'absolute',
    left: 10,
    bottom: 10,
  },

  content: {
    padding: 15,
  },

  name: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 7,
  },

  location: {
    flex: 1,
    fontSize: 13,
    color: colors.muted,
  },

  // Route distance and estimated travel time
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 9,
  },

  routeText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },

  routeUnavailable: {
    marginTop: 9,
    fontSize: 11,
    color: colors.muted,
  },

  tags: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },

  tag: {
    backgroundColor: colors.primaryLight,
    color: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
    overflow: 'hidden',
    fontSize: 11,
    fontWeight: '700',
  },

  footer: {
    marginTop: 15,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  rent: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.primary,
  },

  month: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.muted,
  },

  deposit: {
    marginTop: 5,
    color: colors.muted,
    fontSize: 12,
  },

  arrow: {
    width: 40,
    height: 40,
    backgroundColor: colors.accentLight,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
