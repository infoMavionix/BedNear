
import React, { useState } from "react";

import {
  View,
  Text,
  ScrollView,
  Pressable,
  Linking,
  Alert,
  StatusBar,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import {
  ArrowLeft,
  ShieldCheck,
  FileText,
  HelpCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  MessageCircle,
  CheckCircle2,
} from "lucide-react-native";

import { NativeStackScreenProps } from "@react-navigation/native-stack";

import {
  RootStackParamList,
} from "../../navigation/AppNavigator";

import {
  InfoPage,
  infoContent,
} from "./infoContent";

import { styles } from "./InfoScreen.styles";

type InfoRouteName =
  | "PrivacySafety"
  | "TermsPrivacy"
  | "HelpSupport"
  | "AboutBedNear";

type Props = NativeStackScreenProps<
  RootStackParamList,
  InfoRouteName
>;

const SUPPORT_EMAIL = "support@yourdomain.com";
const SUPPORT_PHONE = "+919876543210";

const pageIcons = {
  privacy: ShieldCheck,
  terms: FileText,
  support: HelpCircle,
  about: Info,
};

const InfoScreen = ({ navigation, route }: Props) => {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const page: InfoPage = route.params.page;

  const content = infoContent[page];
  const PageIcon = pageIcons[page];

  const openEmail = async () => {
    const url =
      `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
        "BedNear Support Request"
      )}`;

    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        "Unable to open email",
        `Please email us at ${SUPPORT_EMAIL}`
      );
    }
  };

  const openPhone = async () => {
    try {
      await Linking.openURL(`tel:${SUPPORT_PHONE}`);
    } catch {
      Alert.alert(
        "Unable to make a call",
        `Please contact us at ${SUPPORT_PHONE}`
      );
    }
  };

  const openWhatsApp = async () => {
    const phone = SUPPORT_PHONE.replace(/\D/g, "");

    try {
      await Linking.openURL(
        `https://wa.me/${phone}?text=${encodeURIComponent(
          "Hello BedNear Support, I need assistance."
        )}`
      );
    } catch {
      Alert.alert(
        "Unable to open WhatsApp",
        "Please try another support option."
      );
    }
  };

  const toggleFAQ = (index: number) => {
    setExpandedFAQ((previous) =>
      previous === index ? null : index
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFF9F3"
      />

      <View style={styles.container}>

        {/* HEADER */}

        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
          >
            <ArrowLeft size={21} color="#302638" />
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.headerEyebrow}>
              BEDNEAR INFORMATION
            </Text>

            <Text style={styles.headerTitle}>
              {content.title}
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <PageIcon size={22} color="#FFFFFF" />
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >

          {/* INTRO CARD */}

          <View style={styles.introCard}>
            <View style={styles.introIcon}>
              <PageIcon size={28} color="#6330AB" />
            </View>

            <Text style={styles.introTitle}>
              {content.subtitle}
            </Text>

            <Text style={styles.introDescription}>
              {content.intro}
            </Text>
          </View>

          {/* INFORMATION SECTIONS */}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {page === "support"
                ? "Support Information"
                : page === "about"
                ? "Discover BedNear"
                : "Important Information"}
            </Text>
          </View>

          {content.sections.map((section, index) => (
            <View
              key={`${page}-${index}`}
              style={styles.sectionCard}
            >
              <View style={styles.sectionHeadingRow}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberText}>
                    {index + 1}
                  </Text>
                </View>

                <Text style={styles.sectionHeading}>
                  {section.heading}
                </Text>
              </View>

              <Text style={styles.sectionBody}>
                {section.body}
              </Text>

              {section.bullets?.map((bullet, bulletIndex) => (
                <View
                  key={`${index}-${bulletIndex}`}
                  style={styles.bulletRow}
                >
                  <CheckCircle2
                    size={15}
                    color="#6330AB"
                    style={styles.bulletIcon}
                  />

                  <Text style={styles.bulletText}>
                    {bullet}
                  </Text>
                </View>
              ))}
            </View>
          ))}

          {/* FAQ */}

          {content.faqs && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  Frequently Asked Questions
                </Text>
              </View>

              {content.faqs.map((faq, index) => {
                const isExpanded = expandedFAQ === index;

                return (
                  <Pressable
                    key={index}
                    style={({ pressed }) => [
                      styles.faqCard,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => toggleFAQ(index)}
                  >
                    <View style={styles.faqHeader}>
                      <Text style={styles.faqQuestion}>
                        {faq.question}
                      </Text>

                      {isExpanded ? (
                        <ChevronUp
                          size={19}
                          color="#6330AB"
                        />
                      ) : (
                        <ChevronDown
                          size={19}
                          color="#8E8494"
                        />
                      )}
                    </View>

                    {isExpanded && (
                      <Text style={styles.faqAnswer}>
                        {faq.answer}
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </>
          )}

          {/* SUPPORT CONTACT */}

          {page === "support" && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  Contact Our Support Team
                </Text>
              </View>

              <View style={styles.contactCard}>
                <Pressable
                  style={styles.contactRow}
                  onPress={openEmail}
                >
                  <View style={styles.contactIcon}>
                    <Mail size={19} color="#6330AB" />
                  </View>

                  <View style={styles.contactText}>
                    <Text style={styles.contactTitle}>
                      Email Support
                    </Text>

                    <Text style={styles.contactValue}>
                      {SUPPORT_EMAIL}
                    </Text>
                  </View>

                  <ArrowLeft
                    size={16}
                    color="#9A909E"
                    style={{ transform: [{ rotate: "135deg" }] }}
                  />
                </Pressable>

                <View style={styles.contactDivider} />

                <Pressable
                  style={styles.contactRow}
                  onPress={openPhone}
                >
                  <View style={styles.contactIcon}>
                    <Phone size={19} color="#E87832" />
                  </View>

                  <View style={styles.contactText}>
                    <Text style={styles.contactTitle}>
                      Phone Support
                    </Text>

                    <Text style={styles.contactValue}>
                      {SUPPORT_PHONE}
                    </Text>
                  </View>
                </Pressable>

                <View style={styles.contactDivider} />

                <Pressable
                  style={styles.contactRow}
                  onPress={openWhatsApp}
                >
                  <View style={styles.contactIcon}>
                    <MessageCircle
                      size={19}
                      color="#239B65"
                    />
                  </View>

                  <View style={styles.contactText}>
                    <Text style={styles.contactTitle}>
                      WhatsApp Support
                    </Text>

                    <Text style={styles.contactValue}>
                      Chat with our team
                    </Text>
                  </View>
                </Pressable>
              </View>
            </>
          )}

          {/* FOOTER */}

          <View style={styles.footer}>
            <Text style={styles.footerLogo}>
              Bed<Text style={styles.footerAccent}>Near</Text>
            </Text>

            <Text style={styles.footerTagline}>
              Find Your Next Home, Nearby.
            </Text>

            <Text style={styles.footerVersion}>
              Made with care by BedNear
            </Text>
          </View>

        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default InfoScreen;
