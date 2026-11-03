
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
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
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

const BENGALURU_REGION: Region = {
  latitude: 12.9716,
  longitude: 77.5946,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};

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
    raw.latitude ?? raw.lat ?? raw.location?.latitude ?? raw.location?.lat
  );
  const longitude = Number(
    raw.longitude ?? raw.lng ?? raw.location?.longitude ?? raw.location?.lng
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

type Props = {
  item: GeoListing;
  selected: boolean;
  onPress: () => void;
};

function PriceMarker({ item, selected, onPress }: Props) {
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
      <View style={[styles.marker, selected && styles.markerSelected]}>
        <Text style={[styles.markerText, selected && styles.markerTextSelected]}>
          ₹{item.listing.rent.toLocaleString('en-IN')}
        </Text>
      </View>
    </Marker>
  );
}

export default function MapSearchScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<MapRoute>();

  const {
    locality = '',
    sharing = 'Any',
    maxRent = 10000,
    gender = 'Any',
    accommodationType = 'Any',
  } = route.params ?? {};

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [region, setRegion] = React.useState<Region>(BENGALURU_REGION);

  const query = useQuery({
    queryKey: [
      'map-listings',
      locality,
      sharing,
      maxRent,
      gender,
      accommodationType,
    ],
    queryFn: () =>
      getListings({
        locality: locality.trim() || undefined,
        sharing,
        maxRent,
        gender,
        accommodationType,
      }),
    retry: 1,
  });

  const geoListings: GeoListing[] = (query.data ?? [])
    .map((listing) => {
      const coordinates = getCoordinates(listing);
      return coordinates ? { listing, ...coordinates } : null;
    })
    .filter((item): item is GeoListing => item !== null);

  const selected =
    geoListings.find((item) => item.listing.id === selectedId) ??
    geoListings[0] ??
    null;

  React.useEffect(() => {
    if (selected && !selectedId) {
      setSelectedId(selected.listing.id);
    }
  }, [selected, selectedId]);

  function showListing(item: Listing) {
    navigation.navigate('ListingDetails', { listingId: item.id });
  }

  return (
    <View style={styles.screen}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={BENGALURU_REGION}
        onRegionChangeComplete={setRegion}
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

      <View style={styles.topBar}>
        <Pressable
          accessibilityLabel="Go back"
          style={styles.roundButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color="#211A2A" />
        </Pressable>

        <View style={styles.locationPill}>
          <Ionicons name="location-outline" size={18} color={colors.primary} />
          <Text numberOfLines={1} style={styles.locationText}>
            {locality.trim() || 'Bengaluru'}
          </Text>
        </View>

        <Pressable
          accessibilityLabel="Search this area"
          style={styles.roundButton}
          onPress={() => query.refetch()}
        >
          <Ionicons name="refresh-outline" size={21} color="#211A2A" />
        </Pressable>
      </View>

      <View style={styles.countPill}>
        <Ionicons name="location" size={16} color={colors.primary} />
        <Text style={styles.countText}>
          {query.isLoading
            ? 'Finding PGs...'
            : `${geoListings.length} PGs on map`}
        </Text>
      </View>

      {query.isLoading && (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Loading nearby PGs...</Text>
        </View>
      )}

      {!query.isLoading && !query.isError && geoListings.length === 0 && (
        <View style={styles.emptyCard}>
          <Ionicons name="map-outline" size={28} color={colors.primary} />
          <Text style={styles.emptyTitle}>No mapped PGs yet</Text>
          <Text style={styles.emptyText}>
            Matching listings need valid latitude and longitude coordinates.
            Try the list view or update the listing location.
          </Text>
        </View>
      )}

      {query.isError && (
        <View style={styles.errorCard}>
          <Text style={styles.emptyTitle}>Could not load the map listings</Text>
          <Pressable onPress={() => query.refetch()}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      )}

      {selected && !query.isLoading && (
        <View style={styles.preview}>
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
                <Text style={styles.previewTitle} numberOfLines={1}>
                  {selected.listing.name}
                </Text>
                <Ionicons name="arrow-forward-circle" size={27} color={colors.primary} />
              </View>
              <Text style={styles.previewLocality} numberOfLines={1}>
                {selected.listing.locality}
              </Text>
              <Text style={styles.previewRent}>
                ₹{selected.listing.rent.toLocaleString('en-IN')}
                <Text style={styles.month}> / month</Text>
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#E8EDF0' },
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
  locationText: { flex: 1, color: '#211A2A', fontWeight: '700' },
  countPill: {
    position: 'absolute',
    top: 70,
    left: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    elevation: 3,
  },
  countText: { color: '#292333', fontSize: 12, fontWeight: '700' },
  marker: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.primary,
    elevation: 4,
  },
  markerSelected: { backgroundColor: colors.primary, borderColor: '#FFFFFF' },
  markerText: { color: colors.primary, fontWeight: '800', fontSize: 12 },
  markerTextSelected: { color: '#FFFFFF' },
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
  },
  loadingText: { color: '#292333', fontWeight: '600' },
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
  },
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
  },
  emptyTitle: { color: '#211A2A', fontSize: 17, fontWeight: '800' },
  emptyText: {
    color: colors.muted,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 19,
  },
  retryText: { color: colors.primary, fontWeight: '800', padding: 8 },
  preview: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 10,
    elevation: 8,
  },
  previewPressable: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  previewImage: { width: 112, height: 120, borderRadius: 15, backgroundColor: '#EEE' },
  previewContent: { flex: 1, gap: 5 },
  previewTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  previewTitle: { flex: 1, color: '#211A2A', fontSize: 16, fontWeight: '800' },
  previewLocality: { color: colors.muted, fontSize: 13 },
  previewRent: { color: colors.primary, fontSize: 18, fontWeight: '800' },
  month: { color: colors.muted, fontSize: 12, fontWeight: '400' },
  previewBeds: { color: '#16834A', fontSize: 12, fontWeight: '700' },
});
