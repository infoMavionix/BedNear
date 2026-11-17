
import React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import * as Location from 'expo-location';

import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useListingRoutes } from '../../hooks/useListingRoutes';

import {
  UserRound,
  MapPin,
  RefreshCw,
  ShieldCheck,
  BedDouble,
  Wallet,
  ArrowRight,
  Sparkles,
  MapPinned,
  Home,
} from 'lucide-react-native';

import { getListings } from '../../services/listing.service';


import { RootStackParamList } from '../../navigation/AppNavigator';

import SearchBar from '../../components/SearchBar';
import ListingCard from '../../components/ListingCard';
import SectionHeader from '../../components/SectionHeader';
import LoadingView from '../../components/LoadingView';
import EmptyState from '../../components/EmptyState';

import { styles } from './HomeScreen.styles';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

type LocationStatus = 'loading' | 'ready' | 'denied' | 'error';



const QUICK_CATEGORIES = [
  {
    id: 'boys',
    title: 'Boys PG',
    subtitle: 'Male accommodation',
    icon: UserRound,
    color: '#FCE8D9',
  },
  {
    id: 'girls',
    title: 'Girls PG',
    subtitle: 'Female accommodation',
    icon: Home,
    color: '#FCE7F3',
  },
  {
    id: 'budget',
    title: 'Budget stays',
    subtitle: 'Affordable options',
    icon: Wallet,
    color: '#E2F5EC',
  },
  {
    id: 'nearby',
    title: 'Nearby PGs',
    subtitle: 'Explore your area',
    icon: MapPinned,
    color: '#FFF0DB',
  },
];

export default function HomeScreen() {
  const navigation = useNavigation<Navigation>();

  const [query, setQuery] = React.useState('');
  const [locationName, setLocationName] = React.useState('');
  const [locationStatus, setLocationStatus] =
    React.useState<LocationStatus>('loading');

  
  const listings = useQuery({
    queryKey: ['home-listings'],
    queryFn: () => getListings(),
    retry: 1,
  });

  const featured = React.useMemo(() => {
    const available = (listings.data ?? []).filter(
      item => item.availableBeds > 0
    );

    return available.slice(0, 4);
  }, [listings.data]);

  const {
    listingsWithRoutes: featuredWithRoutes,
    origin,
    isLocationLoading,
    refreshLocation,
  } = useListingRoutes(featured);
  // --------------------------------------------------
  // CURRENT LOCATION
  // --------------------------------------------------

  React.useEffect(() => {
    let cancelled = false;

    if (isLocationLoading) {
      setLocationStatus('loading');
      return () => {
        cancelled = true;
      };
    }

    if (!origin) {
      setLocationName('');
      setLocationStatus('denied');
      return () => {
        cancelled = true;
      };
    }

    setLocationStatus('loading');

    Location.reverseGeocodeAsync(origin)
      .then(places => {
        if (cancelled) return;

        const place = places[0];
        if (!place) {
          setLocationName('Current location');
          setLocationStatus('ready');
          return;
        }

        const locality =
          place.district ||
          place.subregion ||
          place.city ||
          place.region ||
          '';
        const city = place.city || '';

        const formattedLocation =
          locality && city && locality !== city
            ? `${locality}, ${city}`
            : locality || city || 'Current location';

        setLocationName(formattedLocation);
        setLocationStatus('ready');
      })
      .catch(error => {
        console.warn('Location reverse geocoding failed:', error);
        if (!cancelled) {
          setLocationName('');
          setLocationStatus('error');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [origin, isLocationLoading]);

  const fetchCurrentLocation = React.useCallback(async () => {
    setLocationStatus('loading');
    try {
      const result = await refreshLocation();
      if (!result.data) {
        setLocationName('');
        setLocationStatus('denied');
      }
      // When the shared origin updates, the effect above updates its label.
    } catch (error) {
      console.warn('Location refresh failed:', error);
      setLocationName('');
      setLocationStatus('error');
    }
  }, [refreshLocation]);

  // --------------------------------------------------
  // LOCATION BUTTON
  // --------------------------------------------------

  function handleLocationPress() {
    if (locationStatus === 'loading') return;

    if (locationStatus === 'denied') {
      Alert.alert(
        'Location permission required',
        'Please allow location access in your phone settings to show your current location.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Retry',
            onPress: () => void fetchCurrentLocation(),
          },
        ]
      );

      return;
    }

    if (locationStatus === 'error') {
      void fetchCurrentLocation();
      return;
    }

    Alert.alert(
      'Your current location',
      locationName || 'Current location',
      [
        {
          text: 'Refresh location',
          onPress: () => void fetchCurrentLocation(),
        },
        { text: 'OK', style: 'cancel' },
      ]
    );
  }

  function getLocationLabel() {
    switch (locationStatus) {
      case 'loading':
        return 'Detecting location...';

      case 'denied':
        return 'Enable location access';

      case 'error':
        return 'Tap to retry location';

      case 'ready':
        return locationName;

      default:
        return 'Current location';
    }
  }

  // --------------------------------------------------
  // SEARCH NAVIGATION
  // --------------------------------------------------

  function openSearch() {
    navigation.navigate(
      'MainTabs',
      {
        screen: 'Search',
        params: {
          query: query.trim(),
        },
      } as never
    );
  }

  // --------------------------------------------------
  // HOME SCREEN UI
  // --------------------------------------------------

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.brandSection}>
            <View style={styles.brandRow}>
              <View style={styles.logoContainer}>
                <Text style={styles.logo}>
                  bed
                  <Text style={styles.logoAccent}>near</Text>
                </Text>

                <View style={styles.logoDot} />
              </View>

              <Pressable
                style={styles.avatar}
                onPress={() =>
                  navigation.navigate(
                    'MainTabs',
                    { screen: 'Profile' } as never
                  )
                }
                accessibilityRole="button"
                accessibilityLabel="Open profile"
              >
                <UserRound size={21} color="#FFFFFF" />
              </Pressable>
            </View>

            {/* LOCATION */}
            <Pressable
              onPress={handleLocationPress}
              disabled={locationStatus === 'loading'}
              accessibilityRole="button"
              accessibilityLabel="Current location"
              style={styles.locationContainer}
            >
              <View style={styles.locationIcon}>
                <MapPin size={16} color="#6330AB" />
              </View>

              <View style={styles.locationInfo}>
                <Text style={styles.locationCaption}>
                  YOUR LOCATION
                </Text>

                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={styles.locationText}
                >
                  {getLocationLabel()}
                </Text>
              </View>

              <RefreshCw size={15} color="#E87832" />
            </Pressable>
          </View>
        </View>

        {/* HERO */}
        <View style={styles.hero}>
          <View style={styles.heroDecorationOne} />
          <View style={styles.heroDecorationTwo} />
          <View style={styles.heroOrangeDecoration} />

          <View style={styles.heroContent}>
            <View style={styles.heroBadge}>
              <Sparkles size={14} color="#FFB36B" />

              <Text style={styles.heroBadgeText}>
                YOUR NEW HOME AWAITS
              </Text>
            </View>

            <Text style={styles.heroTitle}>
              Find a place{'\n'}
              <Text style={styles.heroTitleAccent}>
                to call home.
              </Text>
            </Text>

            <Text style={styles.heroDescription}>
              Discover comfortable PG stays near your
              college or workplace.
            </Text>

            <View style={styles.searchWrapper}>
              <SearchBar
                value={query}
                onChangeText={setQuery}
                placeholder="Search locality, college or office"
                onSubmitEditing={openSearch}
                onFilterPress={openSearch}
              />
            </View>

            <View style={styles.heroBenefits}>
              <View style={styles.heroBenefit}>
                <ShieldCheck size={15} color="#FFD2A8" />
                <Text style={styles.heroBenefitText}>
                  Trusted listings
                </Text>
              </View>

              <View style={styles.heroBenefitDivider} />

              <View style={styles.heroBenefit}>
                <BedDouble size={15} color="#FFD2A8" />
                <Text style={styles.heroBenefitText}>
                  Vacancy updates
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* EXPLORE CATEGORIES */}
        <View style={styles.categorySection}>
          <View style={styles.sectionHeading}>
            <View>
              <Text style={styles.sectionTitle}>
                Explore stays
              </Text>

              <Text style={styles.sectionSubtitle}>
                Find the right accommodation for you
              </Text>
            </View>

            <View style={styles.orangeAccentLine} />
          </View>

          <View style={styles.categoryGrid}>
            {QUICK_CATEGORIES.map(category => {
              const Icon = category.icon;

              return (
                <Pressable
                  key={category.id}
                  style={({ pressed }) => [
                    styles.categoryCard,
                    pressed && styles.pressedCard,
                  ]}
                  onPress={openSearch}
                >
                  <View
                    style={[
                      styles.categoryIcon,
                      { backgroundColor: category.color },
                    ]}
                  >
                    <Icon size={21} color="#6330AB" />
                  </View>

                  <View style={styles.categoryTextContainer}>
                    <Text style={styles.categoryTitle}>
                      {category.title}
                    </Text>

                    <Text style={styles.categorySubtitle}>
                      {category.subtitle}
                    </Text>
                  </View>

                  <ArrowRight size={16} color="#E87832" />
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* TRUST CARD */}
        <View style={styles.trustCard}>
          <View style={styles.trustIcon}>
            <ShieldCheck size={22} color="#6330AB" />
          </View>

          <View style={styles.trustContent}>
            <Text style={styles.trustTitle}>
              Search with confidence
            </Text>

            <Text style={styles.trustDescription}>
              Check rent, amenities and bed availability
              before contacting the owner.
            </Text>
          </View>

          <View style={styles.trustAccent} />
        </View>

        {/* POPULAR STAYS */}
        <View style={styles.listingSection}>
          <SectionHeader
            title="Popular stays"
            subtitle="Explore available PGs in Bengaluru"
            actionLabel="See all"
            onAction={openSearch}
          />

          {listings.isLoading ? (
            <LoadingView message="Finding PGs near you..." />
          ) : listings.isError ? (
            <EmptyState
              title="Could not load PGs"
              message="Check your connection and try again."
              actionLabel="Retry"
              onAction={() => listings.refetch()}
            />
          ) : featured.length === 0 ? (
            <EmptyState
              title="No available PGs yet"
              message="Try searching another locality or check again later."
            />
          ) : (
            featuredWithRoutes.map(item => (
              <ListingCard
                key={item.id}
                listing={item}
                travelMode="DRIVE"
                onPress={() =>
                  navigation.navigate('ListingDetails', {
                    listingId: item.id,
                  })
                }
              />
            ))
          )}
        </View>

        {/* FOOTER */}
        <View style={styles.bottomMessage}>
          <View style={styles.bottomMessageLine} />

          <Text style={styles.bottomLogo}>
            bed<Text style={styles.bottomLogoAccent}>near</Text>
          </Text>

          <View style={styles.bottomMessageLine} />
        </View>

        <Text style={styles.bottomTagline}>
          Find your bed. Find your place.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
