import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFF9F3" },
  screen: { flex: 1, backgroundColor: "#FFF9F3" },
  content: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 40 },
  pressed: { opacity: 0.72 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 25 },
  backButton: {
    width: 42, height: 42, borderRadius: 14, backgroundColor: "#F0E8FC",
    alignItems: "center", justifyContent: "center", marginRight: 11,
  },
  headerText: { flex: 1, minWidth: 0 },
  eyebrow: { color: "#A08EA9", fontSize: 9, fontWeight: "900", letterSpacing: 1.5, marginBottom: 4 },
  title: { color: "#251B2D", fontSize: 24, lineHeight: 31, fontWeight: "900", letterSpacing: -0.7 },
  titleAccent: { color: "#E87832" },
  subtitle: { color: "#928797", fontSize: 11, marginTop: 4 },
  headerIcon: {
    width: 43, height: 43, borderRadius: 15, backgroundColor: "#6330AB",
    alignItems: "center", justifyContent: "center", marginLeft: 8,
  },
  introCard: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF",
    borderRadius: 19, borderWidth: 1, borderColor: "#EEE4F1",
    padding: 16, marginBottom: 27,
  },
  introIcon: {
    width: 43, height: 43, borderRadius: 14, backgroundColor: "#F0E8FC",
    alignItems: "center", justifyContent: "center", marginRight: 12,
  },
  introText: { flex: 1 },
  introTitle: { color: "#302638", fontSize: 14, fontWeight: "900" },
  introDescription: { color: "#928797", fontSize: 11, lineHeight: 17, marginTop: 4 },
  sectionTitle: { color: "#A096A5", fontSize: 10, fontWeight: "900", letterSpacing: 1.3, marginBottom: 11 },
  settingsCard: {
    backgroundColor: "#FFFFFF", borderRadius: 21, borderWidth: 1,
    borderColor: "#EEE4F1", paddingHorizontal: 15,
  },
  settingRow: {
    flexDirection: "row", alignItems: "center", minHeight: 91,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#EDE7EF",
    paddingVertical: 13, gap: 11,
  },
  lastSettingRow: { borderBottomWidth: 0 },
  settingIcon: {
    width: 43, height: 43, borderRadius: 14, backgroundColor: "#FAF7FC",
    alignItems: "center", justifyContent: "center",
  },
  settingText: { flex: 1, minWidth: 0 },
  settingTitle: { color: "#302638", fontSize: 12, fontWeight: "900" },
  settingDescription: { color: "#9A909E", fontSize: 10, lineHeight: 15, marginTop: 4 },
  loadingCard: {
    minHeight: 180, backgroundColor: "#FFFFFF", borderRadius: 21,
    borderWidth: 1, borderColor: "#EEE4F1", alignItems: "center",
    justifyContent: "center", padding: 20,
  },
  loadingText: { color: "#928797", fontSize: 12, marginTop: 12 },
  footerNote: { marginTop: 17, paddingHorizontal: 4 },
  footerNoteText: { color: "#9A909E", fontSize: 10, lineHeight: 16 },
  savingRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 15 },
  savingText: { color: "#81758A", fontSize: 10, fontWeight: "600" },
});
