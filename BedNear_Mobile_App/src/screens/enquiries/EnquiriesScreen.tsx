
import React from 'react';
import {
  ScrollView,
  Text,
  View,
  Pressable,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  MessageSquareText,
  Search,
  Sparkles,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react-native';

import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { RootStackParamList } from '../../navigation/AppNavigator';
import { styles } from './EnquiriesScreen.styles';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export default function EnquiriesScreen() {
  const navigation = useNavigation<Navigation>();
  const insets = useSafeAreaInsets();

  const goToSearch = () => {
    navigation.navigate(
      'MainTabs',
      { screen: 'Search' } as never
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: Math.max(insets.bottom, 20) + 20,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>
              STAY CONNECTED
            </Text>

            <Text style={styles.title}>
              My <Text style={styles.titleAccent}>Enquiries.</Text>
            </Text>

            <Text style={styles.subtitle}>
              Keep track of the PGs you've contacted.
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <MessageSquareText
              size={25}
              color="#FFFFFF"
            />
          </View>
        </View>

        {/* INTRO CARD */}
        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Sparkles size={19} color="#E87832" />
          </View>

          <View style={styles.infoText}>
            <Text style={styles.infoTitle}>
              Your conversations, organised.
            </Text>

            <Text style={styles.infoDescription}>
              Connect with PG owners and keep your accommodation
              search moving forward.
            </Text>
          </View>
        </View>

        {/* EMPTY STATE */}
        <View style={styles.emptyCard}>
          <View style={styles.illustration}>
            <View style={styles.illustrationCircle}>
              <MessageSquareText
                size={43}
                color="#6733A8"
                strokeWidth={1.8}
              />
            </View>

            <View style={styles.illustrationAccent}>
              <Sparkles
                size={17}
                color="#E87832"
              />
            </View>

            <View style={styles.smallDot} />
          </View>

          <Text style={styles.emptyTitle}>
            No enquiries yet!
          </Text>

          <Text style={styles.emptyDescription}>
            Once you contact a PG owner, your enquiries and
            conversations will appear here. Start exploring
            and find a place that feels like home.
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={goToSearch}
            style={({ pressed }) => [
              styles.exploreButton,
              pressed && styles.pressed,
            ]}
          >
            <Search size={19} color="#FFFFFF" />

            <Text style={styles.exploreButtonText}>
              Find your PG
            </Text>

            <ArrowRight size={19} color="#FFFFFF" />
          </Pressable>

          <View style={styles.privacyRow}>
            <ShieldCheck size={17} color="#438A69" />

            <Text style={styles.privacyText}>
              Connect directly with PG owners
            </Text>
          </View>
        </View>

        {/* HOW IT WORKS */}
        <View style={styles.stepsSection}>
          <Text style={styles.stepsHeading}>
            How it works
          </Text>

          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>01</Text>
            </View>

            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>
                Discover a PG
              </Text>

              <Text style={styles.stepDescription}>
                Browse PGs based on your location and budget.
              </Text>
            </View>
          </View>

          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>02</Text>
            </View>

            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>
                Contact the owner
              </Text>

              <Text style={styles.stepDescription}>
                Send an enquiry about rooms, rent and availability.
              </Text>
            </View>
          </View>

          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>03</Text>
            </View>

            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>
                Track your enquiries
              </Text>

              <Text style={styles.stepDescription}>
                Keep track of your PG conversations in one place.
              </Text>
            </View>
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerLogo}>
            bed<Text style={styles.footerAccent}>near</Text>
            <Text style={styles.footerDot}>.</Text>
          </Text>

          <Text style={styles.footerText}>
            Find your bed. Find your place.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
