
import React, { useEffect, useMemo, useRef, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

import { useQuery } from '@tanstack/react-query';

import {
  RouteProp,
  useNavigation,
  useRoute,
} from '@react-navigation/native';

import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../../constants/theme';
import { getListings } from '../../services/listing.service';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { Listing } from '../../types/listing';

// --------------------------------------------------
// TYPES
// --------------------------------------------------

type MapRoute = RouteProp<RootStackParamList, 'MapSearch'>;

type GeoListing = {
  listing: Listing;
  latitude: number;
  longitude: number;
};

type MarkerProps = {
  item: GeoListing;
  selected: boolean;
  onPress: () => void;
};

// --------------------------------------------------
// DEFAULT MAP REGION
// --------------------------------------------------

const BENGALURU_REGION: Region = {
  latitude: 12.9716,
  longitude: 77.5946,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};

// --------------------------------------------------
// GET LISTING COORDINATES
// --------------------------------------------------

function getCoordinates(item: Listing) {
  const raw = item as Listing & {
    latitude?: number | string;
    longitude?: number | string;
    lat?: number | string;
    lng?: number | string;
    location?: {
      latitude?: number | string;
      longitude?: number | string;
      lat?: number | string;
      lng?: number | string;
    };
  };

  const latitude = Number(
    raw.latitude ??
    raw.lat ??
    raw.location?.latitude ??
    raw.location?.lat
  );

  const longitude = Number(
    raw.longitude ??
    raw.lng ??
    raw.location?.longitude ??
    raw.location?.lng
  );

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180 ||
    (latitude === 0 && longitude === 0)
  ) {
    return null;
  }

  return { latitude, longitude };
}

// --------------------------------------------------
// PRICE MARKER
// --------------------------------------------------

function PriceMarker({
  item,
  selected,
  onPress,
}: MarkerProps) {
  return (
    <Marker
      coordinate={{
        latitude: item.latitude,
        longitude: item.longitude,
      }}
      onPress={onPress}
      tracksViewChanges={false}
      zIndex={selected ? 10 : 1}
    >
      <View
        style={[
          styles.marker,
          selected && styles.markerSelected,
        ]}
      >
        <Text
          style={[
            styles.markerText,
            selected && styles.markerTextSelected,
          ]}
        >
          ₹{item.listing.rent.toLocaleString('en-IN')}
        </Text>
      </View>
    </Marker>
  );
}

// --------------------------------------------------
// MAP SEARCH SCREEN
// --------------------------------------------------

export default function MapSearchScreen() {
  const insets = useSafeAreaInsets();

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const route = useRoute<MapRoute>();

  // Safe area positioning
  const topBarTop = insets.top + 14;
  const countTop = topBarTop + 56;

  // Search filters
  const {
    locality = '',
    sharing = 'Any',
    maxRent = 10000,
    gender = 'Any',
    accommodationType = 'Any',
  } = route.params ?? {};

  // Selected listing
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapLocality, setMapLocality] = useState(locality);
  const [locationInput, setLocationInput] = useState(locality);
  const mapRef = useRef<MapView | null>(null);

  // --------------------------------------------------
  // FETCH LISTINGS
  // --------------------------------------------------

  const query = useQuery({
    queryKey: [
      'map-listings',
      mapLocality,
      sharing,
      maxRent,
      gender,
      accommodationType,
    ],

    queryFn: () =>
      getListings({
        locality: mapLocality.trim() || undefined,
        sharing,
        maxRent,
        gender,
        accommodationType,
      }),

    retry: 1,
  });

  // Center the map on a locality supplied by SearchScreen.
  useEffect(() => {
    if (!locality.trim()) return;

    let cancelled = false;

    Location.geocodeAsync(locality.trim())
      .then(matches => {
        if (cancelled || !matches.length) return;

        const { latitude, longitude } = matches[0];
        mapRef.current?.animateToRegion(
          {
            latitude,
            longitude,
            latitudeDelta: 0.045,
            longitudeDelta: 0.045,
          },
          650
        );
      })
      .catch(error => {
        console.warn('Could not center map on selected locality:', error);
      });

    return () => {
      cancelled = true;
    };
  }, [locality]);

  // --------------------------------------------------
  // PROCESS LISTINGS
  // --------------------------------------------------

  const geoListings: GeoListing[] = useMemo(() => {
    return (query.data ?? [])
      .map((listing) => {
        const coordinates = getCoordinates(listing);

        return coordinates
          ? { listing, ...coordinates }
          : null;
      })
      .filter(
        (item): item is GeoListing => item !== null
      );
  }, [query.data]);

  // --------------------------------------------------
  // SELECTED LISTING
  // --------------------------------------------------

  const selected =
    geoListings.find(
      (item) => item.listing.id === selectedId
    ) ?? geoListings[0] ?? null;

  // Reset selection when filter results change
  useEffect(() => {
    const selectionExists = geoListings.some(
      (item) => item.listing.id === selectedId
    );

    if (!selectionExists) {
      setSelectedId(geoListings[0]?.listing.id ?? null);
    }
  }, [geoListings, selectedId]);

  // --------------------------------------------------
  // SEARCH A LOCALITY / ADDRESS ON THE MAP
  // --------------------------------------------------

  async function searchMapLocation() {
    const searchText = locationInput.trim();

    if (!searchText) {
      Alert.alert('Enter a location', 'Type a locality, area or address to search.');
      return;
    }

    try {
      const matches = await Location.geocodeAsync(searchText);

      if (!matches.length) {
        Alert.alert('Location not found', 'Try a nearby area or a more specific location.');
        return;
      }

      const { latitude, longitude } = matches[0];
      const nextRegion: Region = {
        latitude,
        longitude,
        latitudeDelta: 0.045,
        longitudeDelta: 0.045,
      };

      mapRef.current?.animateToRegion(nextRegion, 650);
      setMapLocality(searchText);
      setSelectedId(null);
    } catch (error) {
      console.warn('Map location search failed:', error);
      Alert.alert(
        'Could not search location',
        'Please check your internet connection and try again.'
      );
    }
  }

  // --------------------------------------------------
  // OPEN LISTING DETAILS
  // --------------------------------------------------

  function showListing(item: Listing) {
    navigation.navigate('ListingDetails', {
      listingId: item.id,
    });
  }

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <View style={styles.screen}>

      {/* MAP */}

      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={BENGALURU_REGION}
        showsUserLocation={false}
        showsMyLocationButton={false}
        onPress={() => setSelectedId(null)}
      >
        {geoListings.map((item) => (
          <PriceMarker
            key={item.listing.id}
            item={item}
            selected={selected?.listing.id === item.listing.id}
            onPress={() => setSelectedId(item.listing.id)}
          />
        ))}
      </MapView>

      {/* TOP SEARCH BAR */}

      <View
        style={[
          styles.topBar,
          { top: topBarTop },
        ]}
      >
        {/* BACK BUTTON */}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.roundButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color="#211A2A"
          />
        </Pressable>

        {/* SEARCH LOCATION */}

        <View style={styles.locationPill}>
          <Ionicons
            name="search-outline"
            size={18}
            color={colors.primary}
          />

          <TextInput
            value={locationInput}
            onChangeText={setLocationInput}
            onSubmitEditing={searchMapLocation}
            placeholder="Search area or locality"
            placeholderTextColor="#938A9B"
            returnKeyType="search"
            style={styles.locationInput}
            accessibilityLabel="Search map location"
          />

          <Pressable
            onPress={searchMapLocation}
            accessibilityRole="button"
            accessibilityLabel="Search this location"
            style={styles.searchLocationButton}
          >
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* REFRESH */}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Refresh listings"
          style={styles.roundButton}
          onPress={() => query.refetch()}
          disabled={query.isFetching}
        >
          <Ionicons
            name="refresh-outline"
            size={21}
            color="#211A2A"
          />
        </Pressable>
      </View>

      {/* LISTING COUNT */}

      <View
        style={[
          styles.countPill,
          { top: countTop },
        ]}
      >
        <Ionicons
          name="location"
          size={16}
          color={colors.primary}
        />

        <Text style={styles.countText}>
          {query.isLoading
            ? 'Finding PGs...'
            : `${geoListings.length} PGs${mapLocality ? ` near ${mapLocality}` : ' on map'}`}
        </Text>
      </View>

      {/* LOADING */}

      {query.isLoading && (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />

          <Text style={styles.loadingText}>
            Loading nearby PGs...
          </Text>
        </View>
      )}

      {/* EMPTY STATE */}

      {!query.isLoading &&
        !query.isError &&
        geoListings.length === 0 && (
          <View style={styles.emptyCard}>
            <Ionicons
              name="map-outline"
              size={28}
              color={colors.primary}
            />

            <Text style={styles.emptyTitle}>
              No mapped PGs yet
            </Text>

            <Text style={styles.emptyText}>
              Matching listings need valid latitude and
              longitude coordinates. Try the list view
              or update the listing location.
            </Text>
          </View>
        )}

      {/* ERROR STATE */}

      {query.isError && (
        <View style={styles.errorCard}>
          <Ionicons
            name="alert-circle-outline"
            size={28}
            color="#D94A4A"
          />

          <Text style={styles.emptyTitle}>
            Could not load the map listings
          </Text>

          <Pressable onPress={() => query.refetch()}>
            <Text style={styles.retryText}>
              Try again
            </Text>
          </Pressable>
        </View>
      )}

      {/* SELECTED PG PREVIEW */}

      {selected && !query.isLoading && (
        <View
          style={[
            styles.preview,
            { bottom: Math.max(insets.bottom, 12) + 18 },
          ]}
        >
          <Pressable
            onPress={() => showListing(selected.listing)}
            style={styles.previewPressable}
          >
            <Image
              source={{ uri: selected.listing.image }}
              style={styles.previewImage}
              resizeMode="cover"
            />

            <View style={styles.previewContent}>

              <View style={styles.previewTitleRow}>
                <Text
                  style={styles.previewTitle}
                  numberOfLines={1}
                >
                  {selected.listing.name}
                </Text>

                <Ionicons
                  name="arrow-forward-circle"
                  size={27}
                  color={colors.primary}
                />
              </View>

              <Text
                style={styles.previewLocality}
                numberOfLines={1}
              >
                {selected.listing.locality}
              </Text>

              <Text style={styles.previewRent}>
                ₹{selected.listing.rent.toLocaleString('en-IN')}

                <Text style={styles.month}>
                  {' '}/ month
                </Text>
              </Text>

              <Text style={styles.previewBeds}>
                {selected.listing.availableBeds} beds available
              </Text>

            </View>
          </Pressable>
        </View>
      )}

    </View>
  );
}

// --------------------------------------------------
// STYLES
// --------------------------------------------------

const styles = StyleSheet.create({

  screen: {
    flex: 1,
    backgroundColor: '#E8EDF0',
  },

  // TOP BAR

  topBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 10,
  },

  roundButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },

  locationPill: {
    flex: 1,
    height: 44,
    borderRadius: 24,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    elevation: 3,
  },

  locationText: {
    flex: 1,
    color: '#211A2A',
    fontWeight: '700',
  },

  locationInput: {
    flex: 1,
    minWidth: 0,
    height: 44,
    paddingVertical: 0,
    color: '#211A2A',
    fontSize: 13,
    fontWeight: '600',
  },

  searchLocationButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // COUNT

  countPill: {
    position: 'absolute',
    left: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    elevation: 3,
    zIndex: 10,
  },

  countText: {
    color: '#292333',
    fontSize: 12,
    fontWeight: '700',
  },

  // MARKERS

  marker: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.primary,
    elevation: 4,
  },

  markerSelected: {
    backgroundColor: colors.primary,
    borderColor: '#FFFFFF',
  },

  markerText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 12,
  },

  markerTextSelected: {
    color: '#FFFFFF',
  },

  // LOADING

  loading: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    elevation: 4,
  },

  loadingText: {
    color: '#292333',
    fontWeight: '600',
  },

  // EMPTY STATE

  emptyCard: {
    position: 'absolute',
    left: 20,
    right: 20,
    top: '30%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    alignItems: 'center',
    gap: 10,
    elevation: 4,
  },

  // ERROR STATE

  errorCard: {
    position: 'absolute',
    left: 20,
    right: 20,
    top: '35%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    gap: 10,
    elevation: 4,
  },

  emptyTitle: {
    color: '#211A2A',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },

  emptyText: {
    color: colors.muted,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 19,
  },

  retryText: {
    color: colors.primary,
    fontWeight: '800',
    padding: 8,
  },

  // PREVIEW CARD

  preview: {
    position: 'absolute',
    left: 14,
    right: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 10,
    elevation: 8,
    zIndex: 10,
  },

  previewPressable: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },

  previewImage: {
    width: 112,
    height: 120,
    borderRadius: 15,
    backgroundColor: '#EEE',
  },

  previewContent: {
    flex: 1,
    gap: 5,
  },

  previewTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  previewTitle: {
    flex: 1,
    color: '#211A2A',
    fontSize: 16,
    fontWeight: '800',
  },

  previewLocality: {
    color: colors.muted,
    fontSize: 13,
  },

  previewRent: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
  },

  month: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '400',
  },

  previewBeds: {
    color: '#16834A',
    fontSize: 12,
    fontWeight: '700',
  },

});
