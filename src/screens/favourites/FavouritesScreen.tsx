
import React from 'react';
import {
  ScrollView,
  Text,
  View,
  Pressable,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';

import {
  Heart,
  Search,
  Sparkles,
} from 'lucide-react-native';

import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { RootStackParamList } from '../../navigation/AppNavigator';
import { getListings } from '../../services/listing.service';
import { useFavouriteStore } from '../../store/favourite.store';

import ListingCard from '../../components/ListingCard';
import EmptyState from '../../components/EmptyState';
import LoadingView from '../../components/LoadingView';

import { styles } from './FavouritesScreen.styles';

export default function FavouritesScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const insets = useSafeAreaInsets();

  const ids = useFavouriteStore((state) => state.ids);

  const query = useQuery({
    queryKey: ['favourite-listings'],
    queryFn: () => getListings(),
    retry: 1,
  });

  const saved = React.useMemo(
    () =>
      (query.data ?? []).filter((item) =>
        ids.includes(item.id)
      ),
    [query.data, ids]
  );

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
              YOUR COLLECTION
            </Text>

            <Text style={styles.title}>
              Saved <Text style={styles.titleAccent}>PGs.</Text>
            </Text>

            <Text style={styles.subtitle}>
              Your favourite places, all in one spot.
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Heart
              size={25}
              color="#FFFFFF"
              fill="rgba(255,255,255,0.15)"
            />
          </View>
        </View>

        {/* SAVED COUNT */}
        {!query.isLoading && !query.isError && saved.length > 0 && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <Sparkles size={19} color="#E87832" />
            </View>

            <View style={styles.summaryText}>
              <Text style={styles.summaryTitle}>
                Your shortlisted stays
              </Text>
              <Text style={styles.summarySubtitle}>
                Keep your favourite accommodations close.
              </Text>
            </View>

            <View style={styles.countBadge}>
              <Text style={styles.countNumber}>
                {saved.length}
              </Text>
            </View>
          </View>
        )}

        {/* LISTINGS */}
        {query.isLoading ? (
          <View style={styles.stateContainer}>
            <LoadingView message="Loading your saved PGs..." />
          </View>
        ) : query.isError ? (
          <View style={styles.stateContainer}>
            <EmptyState
              title="Couldn't load saved PGs"
              message="Please check your connection and try again."
              actionLabel="Retry"
              onAction={() => query.refetch()}
            />
          </View>
        ) : saved.length > 0 ? (
          <View style={styles.listSection}>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>
                Your favourites
              </Text>

              <Pressable
                onPress={goToSearch}
                style={({ pressed }) => [
                  styles.browseButton,
                  pressed && styles.pressed,
                ]}
              >
                <Search size={14} color="#6030A6" />
                <Text style={styles.browseText}>
                  Explore more
                </Text>
              </Pressable>
            </View>

            {saved.map((item) => (
              <ListingCard
                key={item.id}
                listing={item}
                onPress={() =>
                  navigation.navigate('ListingDetails', {
                    listingId: item.id,
                  })
                }
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIllustration}>
              <View style={styles.emptyCircle}>
                <Heart
                  size={43}
                  color="#7135BD"
                  strokeWidth={1.8}
                />
              </View>

              <View style={styles.emptyAccent}>
                <Sparkles size={17} color="#E87832" />
              </View>
            </View>

            <Text style={styles.emptyTitle}>
              Your favourites live here!
            </Text>

            <Text style={styles.emptyDescription}>
              You haven't saved any PGs yet. Explore comfortable
              stays and tap the heart icon to shortlist the ones
              you love.
            </Text>

            <Pressable
              accessibilityRole="button"
              onPress={goToSearch}
              style={({ pressed }) => [
                styles.exploreButton,
                pressed && styles.pressed,
              ]}
            >
              <Search size={18} color="#FFFFFF" />

              <Text style={styles.exploreButtonText}>
                Explore PGs
              </Text>
            </Pressable>

            <Text style={styles.emptyHint}>
              Find your bed. Find your place.
            </Text>
          </View>
        )}

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
