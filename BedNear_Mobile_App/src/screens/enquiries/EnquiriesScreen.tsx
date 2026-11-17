
import React from 'react';

import {
  ScrollView,
  Text,
  View,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';

import {
  useNavigation,
  useFocusEffect,
} from '@react-navigation/native';

import type {
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';

import {
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import * as SecureStore from 'expo-secure-store';

import {
  MessageSquareText,
  Search,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  MapPin,
  CalendarDays,
  RefreshCw,
} from 'lucide-react-native';

import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import {
  RootStackParamList,
} from '../../navigation/AppNavigator';

import {
  getMyEnquiries,
} from '../../services/enquiry.service';

import {
  styles,
} from './EnquiriesScreen.styles';

// --------------------------------------------------
// TYPES
// --------------------------------------------------

type Navigation =
  NativeStackNavigationProp<RootStackParamList>;

const TOKEN_KEY = 'bednear_access_token';

// --------------------------------------------------
// SCREEN
// --------------------------------------------------

export default function EnquiriesScreen() {
  const navigation = useNavigation<Navigation>();

  const insets = useSafeAreaInsets();

  const queryClient = useQueryClient();

  // --------------------------------------------------
  // AUTHENTICATION STATE
  // --------------------------------------------------

  const [authChecked, setAuthChecked] =
    React.useState(false);

  const [isAuthenticated, setIsAuthenticated] =
    React.useState(false);

  const [authError, setAuthError] =
    React.useState(false);

  // --------------------------------------------------
  // CHECK LOGIN STATUS
  // --------------------------------------------------

  const checkAuthentication = React.useCallback(
    async () => {
      try {
        setAuthError(false);

        const token =
          await SecureStore.getItemAsync(TOKEN_KEY);

        const authenticated = Boolean(token);

        setIsAuthenticated(authenticated);

        return authenticated;
      } catch (error) {
        console.error(
          '[BedNear] Authentication check failed:',
          error
        );

        setAuthError(true);
        setIsAuthenticated(false);

        return false;
      } finally {
        setAuthChecked(true);
      }
    },
    []
  );

  // --------------------------------------------------
  // INITIAL AUTH CHECK
  // --------------------------------------------------

  React.useEffect(() => {
    void checkAuthentication();
  }, [checkAuthentication]);

  // --------------------------------------------------
  // ENQUIRY API
  // --------------------------------------------------

  const enquiriesQuery = useQuery({
    queryKey: ['my-enquiries'],

    queryFn: getMyEnquiries,

    // Only authenticated users can request enquiries.
    enabled: authChecked && isAuthenticated,

    // Avoid repeated unauthorized requests.
    retry: false,

    staleTime: 0,
  });

  // --------------------------------------------------
  // REFRESH AUTH WHEN TAB GETS FOCUS
  // --------------------------------------------------

  useFocusEffect(
    React.useCallback(() => {
      let active = true;

      const refreshAuthentication = async () => {
        try {
          const token =
            await SecureStore.getItemAsync(TOKEN_KEY);

          if (!active) return;

          const authenticated = Boolean(token);

          const wasAuthenticated = isAuthenticated;

          setAuthChecked(true);
          setIsAuthenticated(authenticated);

          // Fetch enquiries after a new login.
          if (authenticated) {
            if (!wasAuthenticated) {
              await queryClient.invalidateQueries({
                queryKey: ['my-enquiries'],
              });
            }
          } else {
            // Do not keep displaying previous user's enquiries.
            queryClient.removeQueries({
              queryKey: ['my-enquiries'],
            });
          }
        } catch (error) {
          console.error(
            '[BedNear] Focus authentication check failed:',
            error
          );

          if (active) {
            setIsAuthenticated(false);
            setAuthChecked(true);
            setAuthError(true);
          }
        }
      };

      void refreshAuthentication();

      return () => {
        active = false;
      };
    }, [isAuthenticated, queryClient])
  );

  // --------------------------------------------------
  // NAVIGATION
  // --------------------------------------------------

  const goToSearch = () => {
    navigation.navigate(
      'MainTabs',
      { screen: 'Search' }
    );
  };

  const goToLogin = () => {
    navigation.navigate('PhoneLogin');
  };

  // --------------------------------------------------
  // DATA
  // --------------------------------------------------

  const enquiries = enquiriesQuery.data ?? [];

  const formatStatus = (status: string) =>
    status.replace(/_/g, ' ');

  // --------------------------------------------------
  // AUTH CHECK LOADING
  // --------------------------------------------------

  if (!authChecked) {
    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={['top']}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <ActivityIndicator
            size="large"
            color="#6733A8"
          />

          <Text
            style={{
              color: '#77717E',
              marginTop: 12,
              fontSize: 13,
            }}
          >
            Checking your account...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // --------------------------------------------------
  // GUEST USER UI
  // --------------------------------------------------

  if (!isAuthenticated) {
    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={['top']}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 25,
          }}
        >
          <View style={styles.illustration}>
            <View style={styles.illustrationCircle}>
              <MessageSquareText
                size={43}
                color="#6733A8"
              />
            </View>
          </View>

          <Text style={styles.emptyTitle}>
            Sign in to view enquiries
          </Text>

          <Text style={styles.emptyDescription}>
            Log in with your mobile number to track your
            PG enquiries, owner contacts and visit requests.
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={goToLogin}
            style={({ pressed }) => [
              styles.exploreButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.exploreButtonText}>
              Login to continue
            </Text>

            <ArrowRight
              size={19}
              color="#FFFFFF"
            />
          </Pressable>

          <Pressable
            onPress={goToSearch}
            style={{
              marginTop: 18,
              padding: 10,
            }}
          >
            <Text
              style={{
                color: '#6733A8',
                fontWeight: '700',
                fontSize: 13,
              }}
            >
              Explore PGs instead
            </Text>
          </Pressable>

          {authError ? (
            <Text
              style={{
                color: '#C0392B',
                fontSize: 11,
                marginTop: 12,
              }}
            >
              Unable to check login status. Please try again.
            </Text>
          ) : null}
        </View>
      </SafeAreaView>
    );
  }

  // --------------------------------------------------
  // MAIN ENQUIRIES UI
  // --------------------------------------------------

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top']}
    >
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom:
              Math.max(insets.bottom, 20) + 20,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={enquiriesQuery.isRefetching}
            onRefresh={() =>
              void enquiriesQuery.refetch()
            }
          />
        }
      >

        {/* HEADER */}

        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>
              STAY CONNECTED
            </Text>

            <Text style={styles.title}>
              My{' '}
              <Text style={styles.titleAccent}>
                Enquiries.
              </Text>
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

        {/* INFO CARD */}

        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Sparkles
              size={19}
              color="#E87832"
            />
          </View>

          <View style={styles.infoText}>
            <Text style={styles.infoTitle}>
              Your conversations, organised.
            </Text>

            <Text style={styles.infoDescription}>
              Connect with PG owners and keep your
              accommodation search moving forward.
            </Text>
          </View>
        </View>

        {/* LOADING */}

        {enquiriesQuery.isLoading ? (
          <View style={styles.emptyCard}>
            <ActivityIndicator
              size="large"
              color="#6733A8"
            />

            <Text style={styles.emptyTitle}>
              Loading enquiries...
            </Text>
          </View>

        ) : enquiriesQuery.isError ? (

          /* ERROR */

          <View style={styles.emptyCard}>
            <RefreshCw
              size={35}
              color="#6733A8"
            />

            <Text style={styles.emptyTitle}>
              Unable to load enquiries
            </Text>

            <Text style={styles.emptyDescription}>
              Your session may have expired. Please try
              again or log in again.
            </Text>

            <Pressable
              style={styles.exploreButton}
              onPress={() =>
                void enquiriesQuery.refetch()
              }
            >
              <Text style={styles.exploreButtonText}>
                Try again
              </Text>
            </Pressable>

          </View>

        ) : enquiries.length === 0 ? (

          /* EMPTY STATE */

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
              Once you contact a PG owner, your enquiries
              and conversations will appear here. Start
              exploring and find a place that feels like home.
            </Text>

            <Pressable
              accessibilityRole="button"
              onPress={goToSearch}
              style={({ pressed }) => [
                styles.exploreButton,
                pressed && styles.pressed,
              ]}
            >
              <Search
                size={19}
                color="#FFFFFF"
              />

              <Text style={styles.exploreButtonText}>
                Find your PG
              </Text>

              <ArrowRight
                size={19}
                color="#FFFFFF"
              />
            </Pressable>

            <View style={styles.privacyRow}>
              <ShieldCheck
                size={17}
                color="#438A69"
              />

              <Text style={styles.privacyText}>
                Connect directly with PG owners
              </Text>
            </View>
          </View>

        ) : (

          /* ENQUIRY LIST */

          <View>
            <Text style={styles.stepsHeading}>
              Your enquiries ({enquiries.length})
            </Text>

            {enquiries.map(enquiry => (
              <View
                key={enquiry.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 13,
                  borderWidth: 1,
                  borderColor: '#EAE2F1',
                }}
              >

                {/* PG NAME */}

                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '800',
                    color: '#292230',
                  }}
                >
                  {enquiry.listing?.name ??
                    'PG accommodation'}
                </Text>

                {/* LOCATION */}

                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: 9,
                  }}
                >
                  <MapPin
                    size={15}
                    color="#6733A8"
                  />

                  <Text
                    style={{
                      color: '#77717E',
                      fontSize: 12,
                      marginLeft: 5,
                    }}
                  >
                    {enquiry.listing?.locality ??
                      'Location unavailable'}
                  </Text>
                </View>

                {/* RENT */}

                <Text
                  style={{
                    color: '#6330AB',
                    fontSize: 14,
                    fontWeight: '800',
                    marginTop: 10,
                  }}
                >
                  {enquiry.listing?.monthlyRent != null
                    ? `₹${Number(
                        enquiry.listing.monthlyRent
                      ).toLocaleString('en-IN')} / month`
                    : 'Rent not available'}
                </Text>

                {/* STATUS */}

                <View
                  style={{
                    alignSelf: 'flex-start',
                    backgroundColor: '#EEE7FA',
                    borderRadius: 20,
                    paddingHorizontal: 11,
                    paddingVertical: 6,
                    marginTop: 12,
                  }}
                >
                  <Text
                    style={{
                      color: '#6330AB',
                      fontSize: 11,
                      fontWeight: '800',
                    }}
                  >
                    {formatStatus(enquiry.status)}
                  </Text>
                </View>

                {/* VISIT DATE */}

                {enquiry.preferredVisitAt ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginTop: 12,
                    }}
                  >
                    <CalendarDays
                      size={15}
                      color="#77717E"
                    />

                    <Text
                      style={{
                        color: '#77717E',
                        fontSize: 12,
                        marginLeft: 6,
                      }}
                    >
                      Visit:{' '}
                      {new Date(
                        enquiry.preferredVisitAt
                      ).toLocaleString('en-IN')}
                    </Text>
                  </View>
                ) : null}

                {/* CREATED DATE */}

                <Text
                  style={{
                    color: '#99919F',
                    fontSize: 11,
                    marginTop: 12,
                  }}
                >
                  Enquired on{' '}
                  {new Date(
                    enquiry.createdAt
                  ).toLocaleDateString('en-IN')}
                </Text>

              </View>
            ))}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
