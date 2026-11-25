
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFF9F3',
  },

  content: {
    paddingHorizontal: 18,
    paddingBottom: 42,
  },

  // HEADER
  header: {
    marginBottom: 23,
  },

  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },

  headingContent: {
    flex: 1,
    minWidth: 0,
  },

  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 9,
  },

  eyebrowText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
    color: '#E87832',
  },

  title: {
    color: '#292230',
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.8,
  },

  titleAccent: {
    color: '#F28A3B',
  },

  subtitle: {
    color: '#89818F',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 7,
    maxWidth: 300,
  },

  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: '#EEE7FA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E4D8F2',
  },

  // SEARCH
  searchSection: {
    marginBottom: 17,
  },

  searchLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8F8495',
    letterSpacing: 0.9,
    marginBottom: 9,
  },

  // LIST / MAP
  viewToggle: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 25,
  },

  viewButton: {
    flex: 1,
    minHeight: 49,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E9DFED',
    backgroundColor: '#FFFFFF',
  },

  viewButtonActive: {
    backgroundColor: '#6330AB',
    borderColor: '#6330AB',
    elevation: 3,
    shadowColor: '#6330AB',
    shadowOpacity: 0.15,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },

  mapButton: {
    backgroundColor: '#6330AB',
    borderColor: '#6330AB',
  },

  viewButtonText: {
    color: '#6330AB',
    fontSize: 13,
    fontWeight: '800',
  },

  viewButtonTextActive: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  // FILTER HEADING
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 13,
  },

  filterHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },

  filterHeadingIcon: {
    width: 39,
    height: 39,
    borderRadius: 13,
    backgroundColor: '#EEE7FA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionTitle: {
    color: '#292230',
    fontSize: 16,
    fontWeight: '900',
  },

  sectionSubtitle: {
    color: '#958A9B',
    fontSize: 11,
    marginTop: 3,
  },

  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#EEE7FA',
  },

  filterToggleText: {
    color: '#6330AB',
    fontSize: 12,
    fontWeight: '800',
  },

  // FILTER PANEL
  panel: {
    padding: 16,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDE5EF',
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#39234D',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },

  filterGroup: {
    marginVertical: 7,
  },

  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 11,
  },

  labelIcon: {
    width: 29,
    height: 29,
    borderRadius: 10,
    backgroundColor: '#FFF0E4',
    justifyContent: 'center',
    alignItems: 'center',
  },

  label: {
    color: '#33283B',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 11,
  },

  helperText: {
    color: '#93889A',
    fontSize: 11,
    marginTop: -5,
    marginBottom: 12,
  },

  // RENT INPUT
  rentInputWrapper: {
    minHeight: 51,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9DFED',
    borderRadius: 14,
    paddingHorizontal: 13,
    backgroundColor: '#FFFCFA',
  },

  currencySymbol: {
    color: '#6330AB',
    fontSize: 18,
    fontWeight: '900',
    marginRight: 8,
  },

  input: {
    flex: 1,
    minWidth: 0,
    height: 49,
    paddingHorizontal: 0,
    color: '#292230',
    fontSize: 15,
    fontWeight: '700',
  },

  perMonth: {
    color: '#968A9C',
    fontSize: 11,
    fontWeight: '600',
  },

  // FILTER CHIPS
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 5,
  },

  separator: {
    height: 1,
    backgroundColor: '#F0EAF2',
    marginVertical: 12,
  },

  // SWITCHES
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 61,
    gap: 11,
  },

  switchIcon: {
    width: 37,
    height: 37,
    borderRadius: 12,
    backgroundColor: '#EEE7FA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  switchText: {
    flex: 1,
    minWidth: 0,
    paddingRight: 5,
  },

  switchTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#33283B',
  },

  switchSubtitle: {
    fontSize: 10,
    color: '#958A9B',
    marginTop: 4,
  },

  // RESET
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2D5F1',
    backgroundColor: '#F7F2FC',
    borderRadius: 14,
    paddingVertical: 13,
    marginTop: 17,
  },

  resetButtonText: {
    color: '#6330AB',
    fontSize: 13,
    fontWeight: '800',
  },

  // RESULTS
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 15,
  },

  resultsHeadingContent: {
    flex: 1,
  },

  resultsTitle: {
    color: '#292230',
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: -0.4,
  },

  result: {
    color: '#918797',
    fontSize: 12,
    marginTop: 5,
  },

  resetTextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    padding: 9,
    borderRadius: 11,
    backgroundColor: '#FFF0E4',
  },

  clear: {
    color: '#D96F2B',
    fontWeight: '800',
    fontSize: 12,
  },

  listings: {
    gap: 14,
  },

  // FOOTER
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 30,
    marginBottom: 8,
  },

  footerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E9E0ED',
  },

  footerLogo: {
    color: '#54239C',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.5,
  },

  footerLogoAccent: {
    color: '#F28A3B',
  },

  footerTagline: {
    color: '#968A9C',
    textAlign: 'center',
    fontSize: 11,
    marginBottom: 10,
  },
});
