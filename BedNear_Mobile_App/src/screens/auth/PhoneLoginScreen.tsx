
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { api } from '../../services/api';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useRoute, RouteProp } from '@react-navigation/native';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type LoginRoute = RouteProp<RootStackParamList, 'PhoneLogin'>;

export default function PhoneLoginScreen() {
  const navigation = useNavigation<Navigation>();
  const { width, height } = useWindowDimensions();
  const route = useRoute<LoginRoute>();
const listingId = route.params?.listingId;

  const [phone, setPhone] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [keyboardVisible, setKeyboardVisible] = React.useState(false);

  React.useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, () => {
      setKeyboardVisible(true);
    });

    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const compactHero = keyboardVisible;

  const heroHeight = keyboardVisible
    ? Math.min(Math.max(height * 0.19, 125), 165)
    : Math.min(Math.max(height * 0.39, 300), 390);

  function skipLogin() {
    Keyboard.dismiss();

    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'MainTabs',
          params: { screen: 'Home' },
        },
      ],
    });
  }

  async function sendOtp() {
    if (loading) return;

    const mobile = phone.replace(/\D/g, '');

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      Alert.alert(
        'Invalid mobile number',
        'Enter a valid 10-digit Indian mobile number.'
      );
      return;
    }

    Keyboard.dismiss();
    setLoading(true);

    try {
      const fullPhone = `+91${mobile}`;

      await api.post('/auth/send-otp', {
        phone: fullPhone,
      });

     navigation.navigate('OtpVerification', {
  phone: fullPhone,
  listingId,
  pendingAction: route.params?.pendingAction,
  preferredVisitAt: route.params?.preferredVisitAt,
  contactType: route.params?.contactType,
});
    } catch (error: any) {
      Alert.alert(
        'Unable to send OTP',
        error?.response?.data?.message ??
          'Could not send the OTP. Check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="light" backgroundColor="#54219C" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          bounces={false}
        >
          {/* HERO IMAGE */}
          <View style={[styles.hero, { height: heroHeight }]}>
            <ImageBackground
              source={require('../../assets/images/bednear-login-hero.png')}
              style={styles.heroImage}
              imageStyle={styles.heroPhoto}
              resizeMode="cover"
            >
              <LinearGradient
                colors={[
                  'rgba(47, 14, 91, 0.91)',
                  'rgba(75, 27, 133, 0.72)',
                  'rgba(84, 33, 156, 0.38)',
                ]}
                locations={[0, 0.58, 1]}
                style={styles.heroGradient}
              >
                <View style={styles.heroPadding}>
                  {/* BRAND */}
                  <View style={styles.topBar}>
                    <Text style={styles.logo}>
                      bed<Text style={styles.logoAccent}>near</Text>
                      <Text style={styles.logoDot}>.</Text>
                    </Text>

                    <Pressable
                      onPress={skipLogin}
                      accessibilityRole="button"
                      accessibilityLabel="Skip login and browse as guest"
                      hitSlop={12}
                      style={({ pressed }) => [
                        styles.skipButton,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={styles.skipText}>Skip</Text>
                      <ChevronRight size={20} color="#FFFFFF" />
                    </Pressable>
                  </View>

                  {/* HERO CONTENT */}
                  <View
                    style={[
                      styles.heroCopy,
                      compactHero && styles.compactHeroCopy,
                    ]}
                  >
                    {!compactHero && (
                      <View style={styles.eyebrow}>
                        <Sparkles size={14} color="#FFB45C" />
                        <Text style={styles.eyebrowText}>
                          YOUR NEXT HOME STARTS HERE
                        </Text>
                      </View>
                    )}

                    <Text
                      style={[
                        styles.heroTitle,
                        {
                          fontSize:
                            width < 360 ? 31 : width < 400 ? 35 : 40,
                          lineHeight:
                            width < 360 ? 37 : width < 400 ? 42 : 47,
                        },
                      ]}
                    >
                      Find a place{'\n'}
                      to call <Text style={styles.orange}>home.</Text>
                    </Text>

                    {!compactHero && (
                      <>
                        <View style={styles.orangeUnderline} />

                        <Text style={styles.heroDescription}>
                          Discover comfortable PG stays near your
                          college or workplace. Find a space that
                          feels like yours.
                        </Text>
                      </>
                    )}
                  </View>
                </View>
              </LinearGradient>
            </ImageBackground>
          </View>

          {/* LOGIN CARD */}
          <View style={styles.panel}>
            <View style={styles.panelContent}>
              <View style={styles.panelHandle} />

              <View style={styles.welcomeBadge}>
                <Sparkles size={14} color="#E87832" />
                <Text style={styles.welcomeBadgeText}>
                  WELCOME TO BEDNEAR
                </Text>
              </View>

              <Text style={styles.panelTitle}>
                Let's get you{' '}
                <Text style={styles.panelAccent}>started.</Text>
              </Text>

              <Text style={styles.panelDescription}>
                Sign in to discover your next stay and connect
                directly with property owners.
              </Text>

              {/* PHONE INPUT */}
              <Text style={styles.inputLabel}>MOBILE NUMBER</Text>

              <View
                style={[
                  styles.phoneInput,
                  phone.length === 10 && styles.phoneInputValid,
                ]}
              >
                <View style={styles.countrySection}>
                  <Text style={styles.flag}>🇮🇳</Text>
                  <Text style={styles.countryCode}>+91</Text>
                  <ChevronRight
                    size={17}
                    color="#8B8192"
                    style={styles.countryChevron}
                  />
                </View>

                <View style={styles.inputDivider} />

                <TextInput
                  value={phone}
                  onChangeText={value =>
                    setPhone(value.replace(/\D/g, '').slice(0, 10))
                  }
                  keyboardType="phone-pad"
                  maxLength={10}
                  placeholder="Enter mobile number"
                  placeholderTextColor="#A69DAD"
                  style={styles.input}
                  accessibilityLabel="Indian mobile number"
                  returnKeyType="done"
                  onSubmitEditing={sendOtp}
                  editable={!loading}
                  autoComplete="tel-national"
                />
              </View>

              <Text style={styles.inputHint}>
                We'll send a one-time password to verify your number.
              </Text>

              {/* CONTINUE */}
              <Pressable
                onPress={sendOtp}
                disabled={loading}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.buttonWrapper,
                  pressed && styles.pressed,
                  loading && styles.buttonDisabled,
                ]}
              >
                <LinearGradient
                  colors={['#7135BD', '#54219C']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.continueButton}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.continueText}>
                        Continue with OTP
                      </Text>

                      <View style={styles.buttonArrow}>
                        <ArrowRight size={19} color="#54219C" />
                      </View>
                    </>
                  )}
                </LinearGradient>
              </Pressable>

              {/* PRIVACY */}
              <View style={styles.securityRow}>
                <ShieldCheck size={16} color="#6D35AE" />
                <Text style={styles.securityText}>
                  Your number is secure and will never be displayed publicly.
                </Text>
              </View>

              {/* TERMS */}
              <Text style={styles.terms}>
                By continuing, you agree to our{' '}
                <Text
                  style={styles.termsLink}
                  onPress={() =>
                    Alert.alert(
                      'Terms of Service',
                      'Connect your Terms of Service page here.'
                    )
                  }
                >
                  Terms
                </Text>
                {' & '}
                <Text
                  style={styles.termsLink}
                  onPress={() =>
                    Alert.alert(
                      'Privacy Policy',
                      'Connect your Privacy Policy page here.'
                    )
                  }
                >
                  Privacy Policy
                </Text>
              </Text>
            </View>
          </View>

          {/* FOOTER */}
          {!keyboardVisible && (
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Find your bed. Find your place.
              </Text>
              <View style={styles.footerDot} />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
    backgroundColor: '#FFF9F3',
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: 12,
    backgroundColor: '#FFF9F3',
  },

  // HERO
  hero: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#54219C',
  },

  heroImage: {
    flex: 1,
    width: '100%',
  },

  heroPhoto: {
    opacity: 1,
  },

  heroGradient: {
    flex: 1,
  },

  heroPadding: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 22,
    justifyContent: 'space-between',
  },

  // HEADER
  topBar: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  logo: {
    color: '#FFFFFF',
    fontSize: 35,
    fontWeight: '900',
    letterSpacing: -2,
  },

  logoAccent: {
    color: '#FF9D32',
  },

  logoDot: {
    color: '#FF9D32',
  },

  skipButton: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 13,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.17)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },

  skipText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  // HERO TEXT
  heroCopy: {
    marginTop: 10,
    maxWidth: 430,
  },

  compactHeroCopy: {
    marginTop: 0,
  },

  eyebrow: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.16)',
    marginBottom: 17,
  },

  eyebrowText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },

  heroTitle: {
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: -1.3,
  },

  orange: {
    color: '#FFAD50',
  },

  orangeUnderline: {
    width: 100,
    height: 4,
    borderRadius: 5,
    backgroundColor: '#FF9D32',
    marginTop: 12,
    marginLeft: 88,
    transform: [{ rotate: '-3deg' }],
  },

  heroDescription: {
    color: '#F4EAFD',
    fontSize: 13,
    lineHeight: 21,
    marginTop: 14,
    maxWidth: 315,
  },

  // LOGIN PANEL
  panel: {
    flexGrow: 1,
    flexShrink: 0,
    backgroundColor: '#FFF9F3',
    marginTop: -22,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 11,
    paddingHorizontal: 22,
    paddingBottom: 22,
  },

  panelContent: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },

  panelHandle: {
    alignSelf: 'center',
    width: 43,
    height: 4,
    borderRadius: 5,
    backgroundColor: '#DCD3E1',
    marginBottom: 18,
  },

  welcomeBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF0E3',
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 8,
    marginBottom: 13,
  },

  welcomeBadgeText: {
    color: '#C96D2D',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.9,
  },

  panelTitle: {
    color: '#291D32',
    fontSize: 25,
    lineHeight: 33,
    fontWeight: '900',
    letterSpacing: -0.8,
  },

  panelAccent: {
    color: '#E87832',
  },

  panelDescription: {
    color: '#89818F',
    fontSize: 13,
    lineHeight: 21,
    marginTop: 7,
    marginBottom: 21,
  },

  // PHONE
  inputLabel: {
    color: '#574B61',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 9,
  },

  phoneInput: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.3,
    borderColor: '#E6DCEB',
    borderRadius: 15,
    paddingHorizontal: 11,
    backgroundColor: '#FFFFFF',
  },

  phoneInputValid: {
    borderColor: '#8A60BD',
  },

  countrySection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 6,
  },

  flag: {
    fontSize: 20,
    marginRight: 6,
  },

  countryCode: {
    color: '#302938',
    fontSize: 14,
    fontWeight: '800',
  },

  countryChevron: {
    transform: [{ rotate: '90deg' }],
    marginLeft: 2,
  },

  inputDivider: {
    height: 31,
    width: 1,
    backgroundColor: '#E8E0EA',
    marginHorizontal: 9,
  },

  input: {
    flex: 1,
    minWidth: 0,
    height: 54,
    color: '#28212F',
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 0,
  },

  inputHint: {
    color: '#968B9A',
    fontSize: 10,
    lineHeight: 16,
    marginTop: 8,
  },

  // CTA
  buttonWrapper: {
    marginTop: 18,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#54219C',
    shadowOpacity: 0.20,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  continueButton: {
    minHeight: 56,
    borderRadius: 16,
    paddingHorizontal: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 13,
  },

  continueText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },

  buttonArrow: {
    width: 29,
    height: 29,
    borderRadius: 10,
    backgroundColor: '#FFB45C',
    alignItems: 'center',
    justifyContent: 'center',
  },

  pressed: {
    opacity: 0.84,
  },

  buttonDisabled: {
    opacity: 0.65,
  },

  // SECURITY
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 17,
    paddingHorizontal: 5,
  },

  securityText: {
    color: '#81768A',
    fontSize: 10,
    lineHeight: 16,
    flexShrink: 1,
    textAlign: 'center',
  },

  // TERMS
  terms: {
    color: '#958A99',
    fontSize: 10,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 17,
    marginBottom: 3,
  },

  termsLink: {
    color: '#6330AB',
    fontWeight: '900',
  },

  // FOOTER
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingTop: 4,
    paddingBottom: 7,
  },

  footerText: {
    color: '#A096A5',
    fontSize: 10,
    fontWeight: '600',
  },

  footerDot: {
    width: 5,
    height: 5,
    borderRadius: 5,
    backgroundColor: '#F28A3B',
  },
});
