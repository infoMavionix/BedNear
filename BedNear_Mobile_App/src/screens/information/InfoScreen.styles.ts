
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFF9F3",
  },

  container: {
    flex: 1,
    backgroundColor: "#FFF9F3",
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 35,
  },

  pressed: {
    opacity: 0.75,
  },

  // HEADER

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 17,
    gap: 12,
  },

  backButton: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EEE4F1",
    alignItems: "center",
    justifyContent: "center",
  },

  headerText: {
    flex: 1,
    minWidth: 0,
  },

  headerEyebrow: {
    color: "#A08EA9",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.3,
    marginBottom: 4,
  },

  headerTitle: {
    color: "#251B2D",
    fontSize: 20,
    fontWeight: "900",
  },

  headerIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: "#6330AB",
    alignItems: "center",
    justifyContent: "center",
  },

  // INTRO

  introCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 23,
    borderWidth: 1,
    borderColor: "#EEE4F1",
    padding: 21,
    marginBottom: 27,
  },

  introIcon: {
    width: 53,
    height: 53,
    borderRadius: 17,
    backgroundColor: "#F1EAFB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },

  introTitle: {
    color: "#302638",
    fontSize: 19,
    fontWeight: "900",
    lineHeight: 27,
  },

  introDescription: {
    color: "#8E8494",
    fontSize: 13,
    lineHeight: 22,
    marginTop: 9,
  },

  // SECTION HEADER

  sectionHeader: {
    marginBottom: 13,
    marginTop: 3,
  },

  sectionTitle: {
    color: "#251B2D",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.3,
  },

  // INFORMATION CARD

  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#EEE4F1",
    padding: 17,
    marginBottom: 13,
  },

  sectionHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 11,
  },

  numberBadge: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "#F1EAFB",
    alignItems: "center",
    justifyContent: "center",
  },

  numberText: {
    color: "#6330AB",
    fontSize: 12,
    fontWeight: "900",
  },

  sectionHeading: {
    flex: 1,
    color: "#302638",
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 21,
  },

  sectionBody: {
    color: "#817687",
    fontSize: 12,
    lineHeight: 21,
  },

  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 11,
    paddingLeft: 2,
    gap: 9,
  },

  bulletIcon: {
    marginTop: 3,
  },

  bulletText: {
    flex: 1,
    color: "#817687",
    fontSize: 12,
    lineHeight: 20,
  },

  // FAQ

  faqCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EEE4F1",
    paddingHorizontal: 15,
    paddingVertical: 16,
    marginBottom: 10,
  },

  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  faqQuestion: {
    flex: 1,
    color: "#302638",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 20,
  },

  faqAnswer: {
    color: "#8E8494",
    fontSize: 12,
    lineHeight: 21,
    marginTop: 13,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#EDE7EF",
  },

  // CONTACT

  contactCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EEE4F1",
    paddingHorizontal: 15,
    marginBottom: 25,
  },

  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 76,
    gap: 12,
  },

  contactIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: "#F2ECFC",
    alignItems: "center",
    justifyContent: "center",
  },

  contactText: {
    flex: 1,
    gap: 5,
  },

  contactTitle: {
    color: "#302638",
    fontSize: 13,
    fontWeight: "800",
  },

  contactValue: {
    color: "#8E8494",
    fontSize: 11,
  },

  contactDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#EDE7EF",
    marginLeft: 55,
  },

  // FOOTER

  footer: {
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 15,
  },

  footerLogo: {
    color: "#54219C",
    fontSize: 27,
    fontWeight: "900",
    letterSpacing: -1.2,
  },

  footerAccent: {
    color: "#E87832",
  },

  footerTagline: {
    color: "#8E8494",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 5,
  },

  footerVersion: {
    color: "#B0A6B3",
    fontSize: 10,
    marginTop: 10,
  },
});
