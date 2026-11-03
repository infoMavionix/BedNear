
import React from 'react';
import {
  Alert,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Keyboard,
  ScrollView,
} from 'react-native';

import {
  RouteProp,
  useNavigation,
  useRoute,
} from '@react-navigation/native';

import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  CheckCircle2,
  ShieldCheck,
  ArrowLeft,
  Smartphone,
  LockKeyhole,
} from 'lucide-react-native';

import { api } from '../../services/api';
import { saveToken } from '../../services/auth.service';
import { RootStackParamList } from '../../navigation/AppNavigator';

type OtpRoute = RouteProp<RootStackParamList, 'OtpVerification'>;
type Navigation = NativeStackNavigationProp<RootStackParamList>;

const PURPLE = '#6330AB';
const DARK_PURPLE = '#482080';
const ORANGE = '#F97316';
const LIGHT_PURPLE = '#F5F0FC';
const TEXT_DARK = '#251B35';
const TEXT_MUTED = '#81788D';
const BORDER = '#E8DFF2';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

export default function OtpVerificationScreen() {
  const route = useRoute<OtpRoute>();
  const navigation = useNavigation<Navigation>();

  const {
  phone,
  listingId,
  pendingAction,
  preferredVisitAt,
  contactType,
} = route.params;

  const [otp, setOtp] = React.useState('');
  const [focusedIndex, setFocusedIndex] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [resending, setResending] = React.useState(false);
  const [countdown, setCountdown] = React.useState(RESEND_SECONDS);

  const inputRefs = React.useRef<Array<TextInput | null>>([]);

  // --------------------------------------------------
  // RESEND OTP COUNTDOWN
  // --------------------------------------------------

  React.useEffect(() => {
    if (countdown <= 0) return;

    const timer = setTimeout(() => {
      setCountdown(current => Math.max(0, current - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  // --------------------------------------------------
  // OTP INPUT HANDLING
  // --------------------------------------------------

  const handleOtpChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, OTP_LENGTH);

    setOtp(digits);

    if (digits.length < OTP_LENGTH) {
      setFocusedIndex(digits.length);

      inputRefs.current[digits.length]?.focus();
    } else {
      setFocusedIndex(OTP_LENGTH - 1);
      Keyboard.dismiss();
    }
  };

  const handleBoxChange = (value: string, index: number) => {
    const digits = value.replace(/\D/g, '');

    if (digits.length > 1) {
      // Supports pasting the complete OTP.
      handleOtpChange(digits);
      return;
    }

    const updated = otp.split('');

    updated[index] = digits;

    const nextOtp = updated.join('').slice(0, OTP_LENGTH);

    setOtp(nextOtp);

    if (digits && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
      setFocusedIndex(index + 1);
    } else if (index === OTP_LENGTH - 1 && digits) {
      Keyboard.dismiss();
      setFocusedIndex(index);
    } else {
      setFocusedIndex(index);
    }
  };

  const handleKeyPress = (
    event: any,
    index: number,
  ) => {
    if (
      event.nativeEvent.key === 'Backspace' &&
      !otp[index] &&
      index > 0
    ) {
      inputRefs.current[index - 1]?.focus();
      setFocusedIndex(index - 1);
    }
  };

  // --------------------------------------------------
  // VERIFY OTP
  // --------------------------------------------------

  async function verifyOtp() {
    if (loading || resending) return;

    if (!/^\d{6}$/.test(otp)) {
      Alert.alert(
        'Invalid OTP',
        'Please enter all 6 digits of your verification code.',
      );
      return;
    }

    Keyboard.dismiss();
    setLoading(true);

    try {
      const response = await api.post('/auth/verify-otp', {
        phone,
        otp,
      });

      const token =
        response.data?.accessToken ??
        response.data?.token;

      if (!token) {
        throw new Error(
          'The server did not return an authentication token.',
        );
      }

      if (response.data?.user?.role !== 'CANDIDATE') {
        throw new Error(
          'This mobile number is not connected to a candidate account.',
        );
      }

      // Save candidate token before navigation.
      await saveToken(token);

      // Return to selected PG and continue requested contact action.
      // Return to the selected PG and resume the pending action.
if (listingId) {
  navigation.reset({
    index: 1,
    routes: [
      {
        name: 'MainTabs',
        params: { screen: 'Home' },
      },
      {
        name: 'ListingDetails',
        params: {
          listingId,
          pendingAction,
          preferredVisitAt,
          contactType,
        },
      },
    ],
  });

  return;
}

// Normal login opens Home.
navigation.reset({
  index: 0,
  routes: [
    {
      name: 'MainTabs',
      params: { screen: 'Home' },
    },
  ],
});
    } catch (error: any) {
      const message =
        error?.response?.data?.message ??
        error?.message ??
        'Unable to verify your mobile number. Please try again.';

      Alert.alert('Verification failed', message);
    } finally {
      setLoading(false);
    }
  }

  // --------------------------------------------------
  // RESEND OTP
  // --------------------------------------------------

  async function resendOtp() {
    if (resending || loading || countdown > 0) return;

    setResending(true);

    try {
      await api.post('/auth/send-otp', { phone });

      setOtp('');
      setCountdown(RESEND_SECONDS);
      setFocusedIndex(0);

      inputRefs.current[0]?.focus();

      Alert.alert(
        'OTP sent',
        `A new verification code has been requested for ${phone}.`,
      );
    } catch (error: any) {
      const message =
        error?.response?.data?.message ??
        error?.message ??
        'Could not request another OTP. Please try again.';

      Alert.alert('Unable to resend OTP', message);
    } finally {
      setResending(false);
    }
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* BRAND HEADER */}

        <View style={styles.topSection}>
          <View style={styles.brandIcon}>
            <View style={styles.brandIconInner}>
              <Smartphone size={25} color="#FFFFFF" />
            </View>
            <View style={styles.brandDot} />
          </View>

          <Text style={styles.brandName}>
            Bed<Text style={styles.brandOrange}>Near</Text>
          </Text>

          <Text style={styles.brandTagline}>
            Find your bed. Find your place.
          </Text>
        </View>

        {/* VERIFICATION ICON */}

        <View style={styles.verificationIconWrapper}>
          <View style={styles.verificationOuterCircle}>
            <View style={styles.verificationInnerCircle}>
              <ShieldCheck
                size={39}
                color={PURPLE}
                strokeWidth={2}
              />
            </View>
          </View>

          <View style={styles.orangeCheck}>
            <CheckCircle2
              size={22}
              color="#FFFFFF"
              fill={ORANGE}
            />
          </View>
        </View>

        {/* HEADING */}

        <View style={styles.headingSection}>
          <Text style={styles.title}>
            Verify your number
          </Text>

          <Text style={styles.subtitle}>
            We've sent a 6-digit verification code to your
            registered mobile number.
          </Text>
        </View>

        {/* PHONE NUMBER */}

        <View style={styles.phoneCard}>
          <View style={styles.phoneIconBox}>
            <Smartphone size={20} color={PURPLE} />
          </View>

          <View style={styles.phoneTextContainer}>
            <Text style={styles.phoneLabel}>
              Verification code sent to
            </Text>

            <Text style={styles.phoneNumber}>
              {phone}
            </Text>
          </View>

          <View style={styles.secureBadge}>
            <LockKeyhole size={15} color={ORANGE} />
          </View>
        </View>

        {/* OTP INPUT */}

        <View style={styles.otpSection}>
          <Text style={styles.otpLabel}>
            Enter verification code
          </Text>

          <View style={styles.otpContainer}>
            {Array.from({ length: OTP_LENGTH }).map((_, index) => {
              const digit = otp[index] || '';
              const isFocused = focusedIndex === index;

              return (
                <Pressable
                  key={index}
                  onPress={() => {
                    setFocusedIndex(index);
                    inputRefs.current[index]?.focus();
                  }}
                  style={[
                    styles.otpBox,
                    digit ? styles.otpBoxFilled : null,
                    isFocused ? styles.otpBoxFocused : null,
                  ]}
                >
                  <TextInput
                    ref={ref => {
                      inputRefs.current[index] = ref;
                    }}
                    value={digit}
                    onChangeText={value =>
                      handleBoxChange(value, index)
                    }
                    onKeyPress={event =>
                      handleKeyPress(event, index)
                    }
                    keyboardType="number-pad"
                    maxLength={OTP_LENGTH}
                    textContentType="oneTimeCode"
                    autoComplete="sms-otp"
                    selectTextOnFocus
                    caretHidden
                    contextMenuHidden={false}
                    editable={!loading && !resending}
                    style={styles.otpDigitInput}
                    selectionColor={ORANGE}
                    accessibilityLabel={`OTP digit ${index + 1}`}
                  />
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.otpHelper}>
            Enter the code to securely access your account.
          </Text>
        </View>

        {/* VERIFY BUTTON */}

        <Pressable
          onPress={verifyOtp}
          disabled={loading || resending}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.verifyButton,
            pressed && styles.buttonPressed,
            (loading || resending) && styles.disabled,
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Text style={styles.verifyButtonText}>
                Verify & Continue
              </Text>

              <CheckCircle2
                size={21}
                color="#FFFFFF"
                strokeWidth={2.5}
              />
            </>
          )}
        </Pressable>

        {/* RESEND OTP */}

        <View style={styles.resendContainer}>
          <Text style={styles.resendDescription}>
            Didn't receive the code?
          </Text>

          <Pressable
            onPress={resendOtp}
            disabled={resending || loading || countdown > 0}
            accessibilityRole="button"
            style={styles.resendButton}
          >
            <Text
              style={[
                styles.resendText,
                countdown > 0 && styles.resendDisabled,
              ]}
            >
              {resending
                ? 'Sending...'
                : countdown > 0
                  ? `Resend code in 00:${String(countdown).padStart(2, '0')}`
                  : 'Resend OTP'}
            </Text>
          </Pressable>
        </View>

        {/* SECURITY NOTE */}

        <View style={styles.securityCard}>
          <ShieldCheck
            size={19}
            color={PURPLE}
          />

          <Text style={styles.securityText}>
            Your account is protected with secure verification.
            Never share your OTP with anyone.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// --------------------------------------------------
// PREMIUM BEDNEAR OTP STYLES
// --------------------------------------------------

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 23,
    paddingTop: 30,
    paddingBottom: 28,
    justifyContent: 'center',
  },

  // BRAND

  topSection: {
    alignItems: 'center',
    marginBottom: 33,
  },

  brandIcon: {
    width: 57,
    height: 57,
    borderRadius: 19,
    backgroundColor: LIGHT_PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  brandIconInner: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  brandDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: ORANGE,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    position: 'absolute',
    right: 1,
    top: 1,
  },

  brandName: {
    fontSize: 25,
    fontWeight: '900',
    color: PURPLE,
    letterSpacing: -0.7,
    marginTop: 10,
  },

  brandOrange: {
    color: ORANGE,
  },

  brandTagline: {
    fontSize: 11,
    color: TEXT_MUTED,
    marginTop: 3,
    letterSpacing: 0.5,
  },

  // VERIFICATION ICON

  verificationIconWrapper: {
    alignSelf: 'center',
    position: 'relative',
    marginBottom: 21,
  },

  verificationOuterCircle: {
    width: 83,
    height: 83,
    borderRadius: 42,
    backgroundColor: '#F3ECFB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  verificationInnerCircle: {
    width: 65,
    height: 65,
    borderRadius: 33,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: PURPLE,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },

  orangeCheck: {
    position: 'absolute',
    right: -3,
    bottom: -1,
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: ORANGE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  // HEADING

  headingSection: {
    alignItems: 'center',
    marginBottom: 25,
  },

  title: {
    color: TEXT_DARK,
    fontSize: 27,
    fontWeight: '900',
    letterSpacing: -0.7,
    textAlign: 'center',
  },

  subtitle: {
    color: TEXT_MUTED,
    fontSize: 13,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 9,
    paddingHorizontal: 7,
  },

  // PHONE CARD

  phoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LIGHT_PURPLE,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#E9DDF8',
    padding: 13,
    marginBottom: 27,
  },

  phoneIconBox: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  phoneTextContainer: {
    flex: 1,
  },

  phoneLabel: {
    fontSize: 11,
    color: TEXT_MUTED,
    marginBottom: 4,
  },

  phoneNumber: {
    color: PURPLE,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  secureBadge: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // OTP

  otpSection: {
    marginBottom: 23,
  },

  otpLabel: {
    color: TEXT_DARK,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 15,
    textAlign: 'center',
  },

  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 9,
  },

  otpBox: {
    flex: 1,
    maxWidth: 49,
    height: 57,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: BORDER,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  otpBoxFilled: {
    borderColor: PURPLE,
    backgroundColor: '#F9F6FD',
  },

  otpBoxFocused: {
    borderColor: ORANGE,
    borderWidth: 2,
    backgroundColor: '#FFF8F2',
    elevation: 2,
    shadowColor: ORANGE,
    shadowOpacity: 0.12,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },

  otpDigitInput: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    color: TEXT_DARK,
    fontSize: 22,
    fontWeight: '900',
    padding: 0,
  },

  otpHelper: {
    color: TEXT_MUTED,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 13,
  },

  // VERIFY BUTTON

  verifyButton: {
    backgroundColor: PURPLE,
    borderRadius: 15,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 11,
    elevation: 4,
    shadowColor: PURPLE,
    shadowOpacity: 0.2,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
  },

  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.2,
  },

  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },

  disabled: {
    opacity: 0.6,
  },

  // RESEND

  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 24,
    gap: 5,
  },

  resendDescription: {
    color: TEXT_MUTED,
    fontSize: 12,
  },

  resendButton: {
    paddingVertical: 5,
    paddingHorizontal: 3,
  },

  resendText: {
    color: ORANGE,
    fontSize: 12,
    fontWeight: '900',
  },

  resendDisabled: {
    color: TEXT_MUTED,
  },

  // SECURITY

  securityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    backgroundColor: '#F7F3FC',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#EDE5F7',
    paddingHorizontal: 13,
    paddingVertical: 12,
    marginTop: 30,
  },

  securityText: {
    flex: 1,
    color: TEXT_MUTED,
    fontSize: 10,
    lineHeight: 16,
  },
});
