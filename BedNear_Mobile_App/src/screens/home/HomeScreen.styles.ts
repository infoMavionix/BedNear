
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
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 40,
  },

  // BRAND HEADER
  header: {
    width: '100%',
    marginBottom: 22,
  },

  brandSection: {
    width: '100%',
  },

  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 54,
  },

  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  logo: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '900',
    color: '#54239C',
    letterSpacing: -1.7,
    includeFontPadding: false,
  },

  logoAccent: {
    color: '#F28A3B',
  },

  logoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F28A3B',
    marginTop: 19,
    marginLeft: 3,
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#642FB0',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#642FB0',
    shadowOpacity: 0.18,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
  },

  // LOCATION
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    maxWidth: '100%',
    gap: 9,
    marginTop: 13,
    paddingVertical: 5,
  },

  locationIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#EEE7FA',
    justifyContent: 'center',
    alignItems: 'center',
  },

  locationInfo: {
    flexShrink: 1,
    minWidth: 0,
  },

  locationCaption: {
    fontSize: 9,
    fontWeight: '800',
    color: '#9A8DA2',
    letterSpacing: 1,
    marginBottom: 3,
  },

  locationText: {
    color: '#34283E',
    fontSize: 13,
    fontWeight: '700',
  },

  // HERO BANNER
  hero: {
    width: '100%',
    backgroundColor: '#54239C',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingTop: 23,
    paddingBottom: 20,
    marginBottom: 29,
    overflow: 'hidden',
    position: 'relative',
    elevation: 5,
    shadowColor: '#54239C',
    shadowOpacity: 0.17,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
  },

  heroDecorationOne: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.055)',
    right: -90,
    top: -90,
  },

  heroDecorationTwo: {
    position: 'absolute',
    width: 125,
    height: 125,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.045)',
    right: -45,
    bottom: -65,
  },

  heroOrangeDecoration: {
    position: 'absolute',
    width: 105,
    height: 105,
    borderRadius: 55,
    backgroundColor: 'rgba(242,138,59,0.16)',
    right: -47,
    bottom: 75,
  },

  heroContent: {
    zIndex: 1,
  },

  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(255,178,107,0.35)',
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 20,
  },

  heroBadgeText: {
    color: '#FFF1E5',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
  },

  heroTitle: {
    color: '#FFFFFF',
    fontSize: 31,
    lineHeight: 39,
    fontWeight: '900',
    marginTop: 17,
    letterSpacing: -0.8,
  },

  heroTitleAccent: {
    color: '#FFB36B',
  },

  heroDescription: {
    color: '#E9DDF8',
    fontSize: 13,
    lineHeight: 21,
    marginTop: 10,
    marginBottom: 19,
    maxWidth: 290,
  },

  searchWrapper: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    overflow: 'hidden',
  },

  heroBenefits: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 11,
    marginTop: 17,
  },

  heroBenefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  heroBenefitText: {
    color: '#F3E9FF',
    fontSize: 11,
    fontWeight: '600',
  },

  heroBenefitDivider: {
    width: 1,
    height: 15,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },

  // CATEGORY SECTION
  categorySection: {
    marginBottom: 23,
  },

  sectionHeading: {
    marginBottom: 15,
    position: 'relative',
  },

  sectionTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: '#292230',
    letterSpacing: -0.5,
  },

  sectionSubtitle: {
    fontSize: 12,
    color: '#89818F',
    marginTop: 5,
    lineHeight: 18,
  },

  orangeAccentLine: {
    width: 37,
    height: 4,
    borderRadius: 3,
    backgroundColor: '#F28A3B',
    marginTop: 9,
  },

  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 11,
  },

  categoryCard: {
    width: '48.5%',
    minHeight: 91,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEE6F1',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 13,
    gap: 8,
  },

  pressedCard: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },

  categoryIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },

  categoryTextContainer: {
    flex: 1,
    minWidth: 0,
  },

  categoryTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#33283B',
  },

  categorySubtitle: {
    fontSize: 9,
    color: '#918797',
    marginTop: 4,
    lineHeight: 13,
  },

  // TRUST CARD
  trustCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    backgroundColor: '#F0EAFB',
    borderRadius: 18,
    padding: 15,
    marginBottom: 28,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E8DDF5',
  },

  trustIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  trustContent: {
    flex: 1,
  },

  trustTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#49247C',
  },

  trustDescription: {
    color: '#766A84',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },

  trustAccent: {
    position: 'absolute',
    width: 5,
    height: '100%',
    backgroundColor: '#F28A3B',
    right: 0,
    top: 0,
  },

  // FEATURED LISTINGS
  listingSection: {
    marginBottom: 15,
  },

  // FOOTER
  bottomMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 11,
    marginTop: 22,
    marginBottom: 7,
  },

  bottomMessageLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E9E0ED',
  },

  bottomLogo: {
    color: '#54239C',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.6,
  },

  bottomLogoAccent: {
    color: '#F28A3B',
  },

  bottomTagline: {
    color: '#918797',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 10,
  },
});
