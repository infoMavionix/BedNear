
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
    paddingBottom: 35,
  },

  pressed: {
    opacity: 0.75,
  },

  // HEADER
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },

  headerText: {
    flex: 1,
    minWidth: 0,
  },

  headerEyebrow: {
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
    marginTop: 5,
  },

  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 17,
    backgroundColor: '#6030A6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },

  // PROFILE CARD
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EEE4F1',
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 21,
    marginBottom: 28,
    alignItems: 'center',
  },

  avatar: {
    width: 76,
    height: 76,
    borderRadius: 25,
    backgroundColor: '#F0E8FC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8DDF6',
    marginBottom: 17,
  },

  name: {
    color: '#251B2D',
    fontSize: 21,
    lineHeight: 28,
    fontWeight: '900',
    letterSpacing: -0.4,
    textAlign: 'center',
  },

  description: {
    color: '#8E8494',
    fontSize: 12,
    lineHeight: 20,
    marginTop: 9,
    textAlign: 'center',
    maxWidth: 330,
  },

  // SIGN-IN BUTTON
  signInButton: {
    width: '100%',
    minHeight: 53,
    borderRadius: 15,
    backgroundColor: '#6030A6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginTop: 20,
    gap: 10,
  },

  signInText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },

  signInArrow: {
    width: 29,
    height: 29,
    borderRadius: 10,
    backgroundColor: '#E87832',
    alignItems: 'center',
    justifyContent: 'center',
  },

  guestFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 16,
  },

  guestLabel: {
    color: '#7D8D80',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },

  // SECTION HEADERS
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 13,
  },

  sectionTitle: {
    color: '#251B2D',
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.4,
  },

  sectionSubtitle: {
    color: '#A096A5',
    fontSize: 11,
    marginTop: 4,
  },

  sectionIcon: {
    width: 37,
    height: 37,
    borderRadius: 13,
    backgroundColor: '#FFF0E4',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // MENU CARDS
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 21,
    borderWidth: 1,
    borderColor: '#EEE4F1',
    paddingHorizontal: 14,
    paddingVertical: 3,
    marginBottom: 27,
  },

  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 76,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EDE7EF',
  },

  lastMenuRow: {
    borderBottomWidth: 0,
  },

  menuIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: '#F2ECFC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  menuText: {
    flex: 1,
    minWidth: 0,
  },

  menuTitle: {
    color: '#302638',
    fontSize: 13,
    fontWeight: '800',
  },

  menuSubtitle: {
    color: '#9A909E',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
  },

  chevron: {
    width: 27,
    height: 27,
    borderRadius: 9,
    backgroundColor: '#FAF7FC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // FOOTER
  footer: {
    alignItems: 'center',
    paddingTop: 5,
    paddingBottom: 12,
  },

  footerLogo: {
    color: '#54219C',
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: -1.2,
  },

  footerLogoAccent: {
    color: '#E87832',
  },

  footerDot: {
    color: '#E87832',
  },

  footerTagline: {
    color: '#8E8494',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
  },

  version: {
    color: '#B0A6B3',
    fontSize: 10,
    marginTop: 9,
  },

  
  // LOADING
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF9F3',
  },

  loadingText: {
    color: '#8E8494',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 13,
  },

  // LOGGED-IN AVATAR
  avatarInitial: {
    color: '#6330AB',
    fontSize: 32,
    fontWeight: '900',
  },

  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1EAFB',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    marginTop: 10,
  },

  roleBadgeText: {
    color: '#6330AB',
    fontSize: 11,
    fontWeight: '800',
  },

  // EDIT PROFILE BUTTON
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    backgroundColor: '#6330AB',
    borderRadius: 14,
    paddingHorizontal: 22,
    paddingVertical: 13,
    marginTop: 19,
    minWidth: 150,
  },

  editButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  editActions: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
  },

  cancelButton: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#E4D8F1',
    backgroundColor: '#F8F4FC',
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  cancelButtonText: {
    color: '#6330AB',
    fontSize: 12,
    fontWeight: '800',
  },

  saveButton: {
    flex: 1.5,
    minHeight: 48,
    backgroundColor: '#6330AB',
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 8,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  // PERSONAL INFORMATION
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 21,
    borderWidth: 1,
    borderColor: '#EEE4F1',
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 28,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 76,
    gap: 13,
    paddingVertical: 10,
  },

  infoIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#F3EDFC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  infoText: {
    flex: 1,
    minWidth: 0,
  },

  infoLabel: {
    color: '#A096A5',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 5,
  },

  infoValue: {
    color: '#302638',
    fontSize: 13,
    fontWeight: '800',
  },

  infoInput: {
    color: '#302638',
    fontSize: 13,
    fontWeight: '700',
    minHeight: 38,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#FAF7FC',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#E5D9F1',
  },

  readOnlyLabel: {
    color: '#A69BAA',
    fontSize: 9,
    marginTop: 4,
  },

  infoDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#EDE7EF',
    marginLeft: 55,
  },

  // LOGOUT
  logoutButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    borderWidth: 1,
    borderColor: '#F3DADA',
    backgroundColor: '#FFF5F4',
    borderRadius: 15,
    marginBottom: 28,
  },

  logoutText: {
    color: '#D94A4A',
    fontSize: 13,
    fontWeight: '800',
  },

});
