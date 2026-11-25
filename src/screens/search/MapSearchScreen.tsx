
import React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import MapView, { Marker, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

import { useQuery } from '@tanstack/react-query';
import {
  RouteProp,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors } from '../../constants/theme';
import { getListings } from '../../services/listing.service';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { Listing } from '../../types/listing';

type MapRoute = RouteProp<RootStackParamList, 'MapSearch'>;

type GeoListing = {
  listing: Listing;
  latitude: number;
  longitude: number;
};

type GeoGroup = {
  id: string;
  latitude: number;
  longitude: number;
  listings: GeoListing[];
};

const INITIAL_REGION: Region = {
  latitude: 12.9716,
  longitude: 77.5946,
  latitudeDelta: 0.18,
  longitudeDelta: 0.18,
};

function getCoordinates(item: Listing) {
  const raw = item as Listing & {
    latitude?: number | string | null;
    longitude?: number | string | null;
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

function formatRent(rent: number) {
  return `₹${Number(rent || 0).toLocaleString('en-IN')}`;
}

export default function MapSearchScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const route = useRoute<MapRoute>();

  const { locality = '' } = route.params ?? {};

  const mapRef = React.useRef<MapView>(null);

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [mapReady, setMapReady] = React.useState(false);

  const query = useQuery({
    queryKey: ['map-all-published-listings', locality.trim().toLowerCase()],

    // Only use the searched locality.
    // Do not apply the default rent, gender or sharing filters here.
    queryFn: () =>
      getListings({
        locality: locality.trim() || undefined,
      }),

    retry: 1,
  });

  const allListings = query.data ?? [];

  // Convert listings into valid map coordinates.
  const geoListings: GeoListing[] = React.useMemo(() => {
    return allListings
      .map((listing) => {
        const coordinates = getCoordinates(listing);

        if (!coordinates) return null;

        return {
          listing,
          ...coordinates,
        };
      })
      .filter((item): item is GeoListing => item !== null);
  }, [allListings]);

  // Group only listings that have exactly the same coordinates.
  // This prevents markers from hiding behind one another.
  const groupedListings: GeoGroup[] = React.useMemo(() => {
    const groups = new Map<string, GeoGroup>();

    geoListings.forEach((item) => {
      const key =
        `${item.latitude.toFixed(6)},${item.longitude.toFixed(6)}`;

      const existing = groups.get(key);

      if (existing) {
        existing.listings.push(item);
      } else {
        groups.set(key, {
          id: key,
          latitude: item.latitude,
          longitude: item.longitude,
          listings: [item],
        });
      }
    });

    return Array.from(groups.values());
  }, [geoListings]);

  // Initially select the first PG for the bottom preview.
  // This does not control the map's center or zoom.
  const selected = React.useMemo(() => {
    return (
      geoListings.find((item) => item.listing.id === selectedId) ??
      geoListings[0] ??
      null
    );
  }, [geoListings, selectedId]);

  React.useEffect(() => {
    if (!selected && selectedId !== null) {
      setSelectedId(null);
    }
  }, [selected, selectedId]);

  // Fit the map around ALL available PG locations.
  // A minimum zoom range prevents excessive zooming into one property.
  React.useEffect(() => {
    if (!mapReady || query.isLoading || query.isError) {
      return;
    }

    if (geoListings.length === 0) {
      return;
    }

    const latitudes = geoListings.map((item) => item.latitude);
    const longitudes = geoListings.map((item) => item.longitude);

    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    const centerLatitude = (minLat + maxLat) / 2;
    const centerLongitude = (minLng + maxLng) / 2;

    // Keep a reasonable viewing area when listings are close together.
    const latitudeDelta = Math.max(
      (maxLat - minLat) * 2.5,
      0.025
    );

    const longitudeDelta = Math.max(
      (maxLng - minLng) * 2.5,
      0.025
    );

    const region: Region = {
      latitude: centerLatitude,
      longitude: centerLongitude,
      latitudeDelta: Math.min(latitudeDelta, 0.5),
      longitudeDelta: Math.min(longitudeDelta, 0.5),
    };

    // Small delay allows the native map to finish laying out.
    const timer = setTimeout(() => {
      mapRef.current?.animateToRegion(region, 700);
    }, 300);

    return () => clearTimeout(timer);
  }, [mapReady, geoListings, query.isLoading, query.isError]);

  function openListing(item: Listing) {
    navigation.navigate('ListingDetails', {
      listingId: item.id,
    });
  }

  // When a marker represents multiple PGs, cycle through them.
  function handleGroupPress(group: GeoGroup) {
    if (group.listings.length === 1) {
      setSelectedId(group.listings[0].listing.id);
      return;
    }

    const currentIndex = group.listings.findIndex(
      (item) => item.listing.id === selectedId
    );

    const nextIndex =
      currentIndex < 0
        ? 0
        : (currentIndex + 1) % group.listings.length;

    setSelectedId(group.listings[nextIndex].listing.id);
  }

  function refreshListings() {
    setSelectedId(null);
    query.refetch();
  }

  return (
    <View style={styles.screen}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={INITIAL_REGION}
        onMapReady={() => setMapReady(true)}
        showsUserLocation={false}
        showsMyLocationButton={false}
        toolbarEnabled={false}
        loadingEnabled
      >
        {groupedListings.map((group) => {
          const activeListing =
            group.listings.find(
              (item) => item.listing.id === selectedId
            ) ?? group.listings[0];

          const isSelected =
            group.listings.some(
              (item) => item.listing.id === selectedId
            );

          return (
            <Marker
              key={group.id}
              coordinate={{
                latitude: group.latitude,
                longitude: group.longitude,
              }}
              onPress={() => handleGroupPress(group)}
              pinColor="red"
              zIndex={isSelected ? 100 : 1}
            >
              <View
                collapsable={false}
                style={[
                  styles.marker,
                  isSelected && styles.markerSelected,
                ]}
              >
                <Text style={styles.markerText}>
                  {group.listings.length > 1
                    ? `${group.listings.length} PGs`
                    : formatRent(activeListing.listing.rent)}
                </Text>
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Top navigation */}
      <View style={styles.topBar}>
        <Pressable
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

        <View style={styles.locationPill}>
          <Ionicons
            name="location-outline"
            size={18}
            color={colors.primary}
          />

          <Text numberOfLines={1} style={styles.locationText}>
            {locality.trim() || 'Bengaluru'}
          </Text>
        </View>

        <Pressable
          accessibilityLabel="Refresh PG listings"
          style={styles.roundButton}
          onPress={refreshListings}
          disabled={query.isFetching}
        >
          {query.isFetching ? (
            <ActivityIndicator
              size="small"
              color={colors.primary}
            />
          ) : (
            <Ionicons
              name="refresh-outline"
              size={21}
              color="#211A2A"
            />
          )}
        </Pressable>
      </View>

      {/* Listing count */}
      <View style={styles.countPill}>
        <Ionicons
          name="location"
          size={17}
          color="#DC2626"
        />

        <Text style={styles.countText}>
          {query.isLoading
            ? 'Finding PGs...'
            : `${allListings.length} PGs available in ${
                locality.trim() || 'Bengaluru'
              }`}
        </Text>
      </View>

      {/* Loading */}
      {query.isLoading && (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />

          <Text style={styles.loadingText}>
            Loading PG locations...
          </Text>
        </View>
      )}

      {/* API error */}
      {query.isError && (
        <View style={styles.messageCard}>
          <Ionicons
            name="alert-circle-outline"
            size={30}
            color="#DC2626"
          />

          <Text style={styles.emptyTitle}>
            Could not load PG listings
          </Text>

          <Text style={styles.emptyText}>
            Please check your connection and try again.
          </Text>

          <Pressable
            onPress={() => query.refetch()}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      )}

      {/* No listings */}
      {!query.isLoading &&
        !query.isError &&
        allListings.length === 0 && (
          <View style={styles.messageCard}>
            <Ionicons
              name="home-outline"
              size={30}
              color={colors.primary}
            />

            <Text style={styles.emptyTitle}>
              No PGs found
            </Text>

            <Text style={styles.emptyText}>
              No published PG listings were found in this location.
            </Text>
          </View>
        )}

      {/* Listings without coordinates */}
      {!query.isLoading &&
        !query.isError &&
        allListings.length > 0 &&
        geoListings.length === 0 && (
          <View style={styles.messageCard}>
            <Ionicons
              name="map-outline"
              size={30}
              color={colors.primary}
            />

            <Text style={styles.emptyTitle}>
              PG locations unavailable
            </Text>

            <Text style={styles.emptyText}>
              We found {allListings.length} PG listings, but they
              do not have valid map coordinates yet.
            </Text>
          </View>
        )}

      {/* PG preview */}
      {selected && !query.isLoading && !query.isError && (
        <View style={styles.preview}>
          <Pressable
            onPress={() => openListing(selected.listing)}
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
                {formatRent(selected.listing.rent)}
                <Text style={styles.month}> / month</Text>
              </Text>

              <Text style={styles.previewBeds}>
                {selected.listing.availableBeds} beds available
              </Text>

              <Text style={styles.viewDetails}>
                View PG details
              </Text>
            </View>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#E8EDF0',
  },

  topBar: {
    position: 'absolute',
    top: 14,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  roundButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
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
    elevation: 4,
  },

  locationText: {
    flex: 1,
    color: '#211A2A',
    fontWeight: '700',
  },

  countPill: {
    position: 'absolute',
    top: 70,
    left: 18,
    right: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    elevation: 4,
  },

  countText: {
    flex: 1,
    color: '#292333',
    fontSize: 13,
    fontWeight: '700',
  },

  // Red price markers
  marker: {
    minWidth: 54,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#DC2626',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 7,
  },

  markerSelected: {
    backgroundColor: '#991B1B',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 10,
  },

  markerText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12,
  },

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
    elevation: 5,
  },

  loadingText: {
    color: '#292333',
    fontWeight: '600',
  },

  messageCard: {
    position: 'absolute',
    left: 20,
    right: 20,
    top: '30%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    alignItems: 'center',
    gap: 10,
    elevation: 5,
  },

  emptyTitle: {
    color: '#211A2A',
    fontSize: 17,
    fontWeight: '800',
  },

  emptyText: {
    color: colors.muted,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 19,
  },

  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingVertical: 10,
    marginTop: 4,
  },

  retryText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  preview: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 10,
    elevation: 9,
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

  viewDetails: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
});
