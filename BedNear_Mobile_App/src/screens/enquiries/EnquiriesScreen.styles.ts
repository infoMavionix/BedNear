
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
    fontSize: 29,
    lineHeight: 38,
    fontWeight: '900',
    letterSpacing: -0.8,
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

  // INTRO CARD
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEE4F1',
    borderRadius: 19,
    padding: 15,
    gap: 12,
    marginBottom: 22,
  },

  infoIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: '#FFF0E4',
    alignItems: 'center',
    justifyContent: 'center',
  },

  infoText: {
    flex: 1,
  },

  infoTitle: {
    color: '#302638',
    fontSize: 13,
    fontWeight: '800',
  },

  infoDescription: {
    color: '#9A909E',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },

  // EMPTY STATE
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEE4F1',
    borderRadius: 25,
    paddingHorizontal: 21,
    paddingVertical: 27,
    alignItems: 'center',
  },

  illustration: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 18,
  },

  illustrationCircle: {
    width: 100,
    height: 100,
    borderRadius: 34,
    backgroundColor: '#F0E8FC',
    borderWidth: 1,
    borderColor: '#E5D9F3',
    alignItems: 'center',
    justifyContent: 'center',
  },

  illustrationAccent: {
    position: 'absolute',
    right: 0,
    top: 5,
    width: 35,
    height: 35,
    borderRadius: 12,
    backgroundColor: '#FFF0E4',
    alignItems: 'center',
    justifyContent: 'center',
  },

  smallDot: {
    position: 'absolute',
    left: 3,
    bottom: 12,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#E87832',
  },

  emptyTitle: {
    color: '#251B2D',
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.5,
  },

  emptyDescription: {
    color: '#928797',
    fontSize: 13,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 10,
  },

  exploreButton: {
    width: '100%',
    minHeight: 53,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: '#6030A6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 23,
  },

  exploreButtonText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
  },

  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 18,
  },

  privacyText: {
    color: '#779181',
    fontSize: 11,
    fontWeight: '700',
  },

  // HOW IT WORKS
  stepsSection: {
    marginTop: 28,
  },

  stepsHeading: {
    color: '#251B2D',
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.4,
    marginBottom: 14,
  },

  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEE4F1',
    borderRadius: 17,
    padding: 14,
    marginBottom: 10,
    gap: 13,
  },

  stepNumber: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#F0E8FC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  stepNumberText: {
    color: '#6030A6',
    fontSize: 12,
    fontWeight: '900',
  },

  stepContent: {
    flex: 1,
  },

  stepTitle: {
    color: '#302638',
    fontSize: 13,
    fontWeight: '800',
  },

  stepDescription: {
    color: '#9A909E',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },

  // FOOTER
  footer: {
    alignItems: 'center',
    paddingTop: 27,
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
