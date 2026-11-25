import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ArrowLeft, Bell, MessageCircle, MessageSquare, Smartphone } from "lucide-react-native";

import { api } from "../../services/api";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { styles } from "./NotificationSettingsScreen.styles";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type NotificationSettings = {
  whatsappEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
};

const DEFAULT_SETTINGS: NotificationSettings = {
  whatsappEnabled: true,
  smsEnabled: true,
  pushEnabled: true,
};

// Change this path if your backend uses a different route.
const NOTIFICATION_SETTINGS_ENDPOINT = "/profile/notification-settings";

const NotificationSettingsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<keyof NotificationSettings | null>(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(NOTIFICATION_SETTINGS_ENDPOINT);
      const data = response?.data?.settings ?? response?.data ?? {};

      setSettings({
        whatsappEnabled:
          typeof data.whatsappEnabled === "boolean"
            ? data.whatsappEnabled
            : DEFAULT_SETTINGS.whatsappEnabled,
        smsEnabled:
          typeof data.smsEnabled === "boolean"
            ? data.smsEnabled
            : DEFAULT_SETTINGS.smsEnabled,
        pushEnabled:
          typeof data.pushEnabled === "boolean"
            ? data.pushEnabled
            : DEFAULT_SETTINGS.pushEnabled,
      });
    } catch (error: any) {
      console.error(
        "[BedNear] Notification settings load failed:",
        error?.response?.data || error?.message,
      );
      Alert.alert(
        "Unable to load settings",
        error?.response?.data?.message ||
          "Please check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [loadSettings]),
  );

  const updateSetting = async (key: keyof NotificationSettings, value: boolean) => {
    if (savingKey) return;

    const previousValue = settings[key];
    setSettings((current) => ({ ...current, [key]: value }));
    setSavingKey(key);

    try {
      const response = await api.patch(NOTIFICATION_SETTINGS_ENDPOINT, {
        [key]: value,
      });

      const data = response?.data?.settings ?? response?.data;
      if (data && typeof data[key] === "boolean") {
        setSettings((current) => ({ ...current, [key]: data[key] }));
      }
    } catch (error: any) {
      setSettings((current) => ({ ...current, [key]: previousValue }));
      console.error(
        "[BedNear] Notification setting update failed:",
        error?.response?.data || error?.message,
      );
      Alert.alert(
        "Update failed",
        error?.response?.data?.message ||
          "Your preference could not be saved. Please try again.",
      );
    } finally {
      setSavingKey(null);
    }
  };

  const SettingRow = ({
    icon,
    title,
    description,
    settingKey,
    last = false,
  }: {
    icon: React.ReactNode;
    title: string;
    description: string;
    settingKey: keyof NotificationSettings;
    last?: boolean;
  }) => (
    <View style={[styles.settingRow, last && styles.lastSettingRow]}>
      <View style={styles.settingIcon}>{icon}</View>
      <View style={styles.settingText}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        value={settings[settingKey]}
        onValueChange={(value) => updateSetting(settingKey, value)}
        disabled={loading || savingKey !== null}
        trackColor={{ false: "#D9D2DE", true: "#C9B4E8" }}
        thumbColor={settings[settingKey] ? "#6330AB" : "#F7F5F8"}
        ios_backgroundColor="#D9D2DE"
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
            hitSlop={8}
          >
            <ArrowLeft size={20} color="#6330AB" />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>PREFERENCES</Text>
            <Text style={styles.title}>Notification <Text style={styles.titleAccent}>Settings</Text></Text>
            <Text style={styles.subtitle}>Choose how you want to hear from BedNear</Text>
          </View>
          <View style={styles.headerIcon}>
            <Bell size={22} color="#FFFFFF" />
          </View>
        </View>

        <View style={styles.introCard}>
          <View style={styles.introIcon}>
            <Bell size={20} color="#6330AB" />
          </View>
          <View style={styles.introText}>
            <Text style={styles.introTitle}>Stay in the loop</Text>
            <Text style={styles.introDescription}>
              Turn each channel on or off. Your choices are saved to your account.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>NOTIFICATION CHANNELS</Text>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#6330AB" />
            <Text style={styles.loadingText}>Loading your preferences...</Text>
          </View>
        ) : (
          <View style={styles.settingsCard}>
            <SettingRow
              icon={<MessageCircle size={21} color="#238B55" />}
              title="WhatsApp Notifications"
              description="Receive updates and enquiry messages on WhatsApp"
              settingKey="whatsappEnabled"
            />
            <SettingRow
              icon={<MessageSquare size={21} color="#E87832" />}
              title="SMS Notifications"
              description="Receive important updates through normal text messages"
              settingKey="smsEnabled"
            />
            <SettingRow
              icon={<Smartphone size={21} color="#6330AB" />}
              title="Push Notifications"
              description="Receive alerts directly on your device"
              settingKey="pushEnabled"
              last
            />
          </View>
        )}

        <View style={styles.footerNote}>
          <Text style={styles.footerNoteText}>
            You can change these preferences anytime. Essential account and security
            messages may still be sent when required.
          </Text>
        </View>
        {savingKey !== null && (
          <View style={styles.savingRow}>
            <ActivityIndicator size="small" color="#6330AB" />
            <Text style={styles.savingText}>Saving preference...</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default NotificationSettingsScreen;
