import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { Heart, MapPin, ArrowUpRight, CarFront, Footprints } from 'lucide-react-native';

import { colors } from '../constants/theme';
import { Listing, TravelMode } from '../types/listing';
import { formatCurrency } from '../utils/formatters';
import { useFavouriteStore } from '../store/favourite.store';
import AvailabilityBadge from './AvailabilityBadge';
import { styles } from './ListingCard.styles';
import {
  formatRouteDistance,
  formatRouteDuration,
} from '../services/route.service';

type Props = {
  listing: Listing;
  onPress: () => void;
  travelMode?: TravelMode;
};

export default function ListingCard({
  listing,
  onPress,
  travelMode = 'DRIVE',
}: Props) {
  const saved = useFavouriteStore((state) => state.has(listing.id));
  const toggle = useFavouriteStore((state) => state.toggle);

  const route =
    travelMode === 'DRIVE'
      ? listing.drivingRoute
      : listing.walkingRoute;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { opacity: pressed ? 0.94 : 1 },
      ]}
    >
      <View style={styles.imageWrap}>
        <Image
          source={{ uri: listing.image }}
          style={styles.image}
          resizeMode="cover"
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={saved ? 'Remove from saved PGs' : 'Save PG'}
          hitSlop={8}
          onPress={() => toggle(listing.id)}
          style={styles.heart}
        >
          <Heart
            size={20}
            color={saved ? colors.accent : colors.primary}
            fill={saved ? colors.accent : 'transparent'}
          />
        </Pressable>

        <View style={styles.badgeWrap}>
          <AvailabilityBadge
            availableBeds={listing.availableBeds}
            confirmedAt={listing.availabilityConfirmedAt}
          />
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {listing.name}
        </Text>

        <View style={styles.locationRow}>
          <MapPin size={14} color={colors.muted} />
          <Text style={styles.location} numberOfLines={1}>
            {listing.locality}, Bengaluru
          </Text>
        </View>

        {route ? (
          <View style={styles.routeRow}>
            {travelMode === 'DRIVE' ? (
              <CarFront size={16} color={colors.primary} />
            ) : (
              <Footprints size={16} color={colors.primary} />
            )}
            <Text style={styles.routeText}>
              {formatRouteDistance(route.distanceMeters)} ·{' '}
              {formatRouteDuration(route.durationSeconds)}
              {travelMode === 'DRIVE' ? ' by car' : ' walk'}
            </Text>
          </View>
        ) : (
          <Text style={styles.routeUnavailable}>
            {listing.latitude != null && listing.longitude != null
              ? 'Route details unavailable'
              : 'Route location not added yet'}
          </Text>
        )}

        <View style={styles.tags}>
          <Text style={styles.tag}>{listing.sharing}</Text>
          <Text style={styles.tag}>
            {listing.gender === 'Any' ? 'All genders' : listing.gender}
          </Text>
        </View>

        <View style={styles.footer}>
          <View>
            <Text style={styles.rent}>
              {formatCurrency(listing.rent)}
              <Text style={styles.month}> / month</Text>
            </Text>
            <Text style={styles.deposit}>
              Deposit {formatCurrency(listing.deposit)}
            </Text>
          </View>

          <View style={styles.arrow}>
            <ArrowUpRight size={20} color={colors.accent} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}