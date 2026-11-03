
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF9F3',
  },

  screen: {
    flex: 1,
    backgroundColor: '#FFF9F3',
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 14,
    flexGrow: 1,
  },

  pressed: {
    opacity: 0.78,
  },

  // HEADER
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 23,
  },

  headerText: {
    flex: 1,
    minWidth: 0,
  },

  eyebrow: {
    color: '#A08EA9',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 5,
  },

  title: {
    color: '#251B2D',
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '900',
    letterSpacing: -1,
  },

  titleAccent: {
    color: '#E87832',
  },

  subtitle: {
    color: '#928797',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 5,
  },

  headerIcon: {
    width: 49,
    height: 49,
    borderRadius: 17,
    backgroundColor: '#6030A6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },

  // SUMMARY
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEE4F1',
    borderRadius: 19,
    padding: 13,
    marginBottom: 25,
    gap: 11,
  },

  summaryIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFF0E4',
    alignItems: 'center',
    justifyContent: 'center',
  },

  summaryText: {
    flex: 1,
    minWidth: 0,
  },

  summaryTitle: {
    color: '#302638',
    fontSize: 12,
    fontWeight: '800',
  },

  summarySubtitle: {
    color: '#9A909E',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },

  countBadge: {
    minWidth: 34,
    height: 34,
    paddingHorizontal: 7,
    borderRadius: 12,
    backgroundColor: '#F1EAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  countNumber: {
    color: '#6030A6',
    fontSize: 14,
    fontWeight: '900',
  },

  // LIST
  listSection: {
    width: '100%',
  },

  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },

  listTitle: {
    color: '#251B2D',
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.4,
  },

  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F0E8FC',
  },

  browseText: {
    color: '#6030A6',
    fontSize: 10,
    fontWeight: '800',
  },

  stateContainer: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 250,
  },

  // EMPTY STATE
  emptyContainer: {
    flexGrow: 1,
    minHeight: 380,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 30,
  },

  emptyIllustration: {
    width: 125,
    height: 125,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 24,
  },

  emptyCircle: {
    width: 105,
    height: 105,
    borderRadius: 35,
    backgroundColor: '#F0E8FC',
    borderWidth: 1,
    borderColor: '#E5D9F3',
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyAccent: {
    position: 'absolute',
    right: 1,
    top: 5,
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#FFF0E4',
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTitle: {
    color: '#251B2D',
    fontSize: 21,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.4,
  },

  emptyDescription: {
    color: '#928797',
    fontSize: 13,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 10,
    maxWidth: 310,
  },

  exploreButton: {
    minHeight: 49,
    paddingHorizontal: 24,
    borderRadius: 15,
    backgroundColor: '#6030A6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginTop: 23,
  },

  exploreButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },

  emptyHint: {
    color: '#B0A6B3',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 18,
  },

  // FOOTER
  footer: {
    alignItems: 'center',
    paddingTop: 25,
    paddingBottom: 10,
  },

  footerLogo: {
    color: '#54219C',
    fontSize: 23,
    fontWeight: '900',
    letterSpacing: -1,
  },

  footerAccent: {
    color: '#E87832',
  },

  footerDot: {
    color: '#E87832',
  },

  footerText: {
    color: '#A096A5',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 5,
  },
});
