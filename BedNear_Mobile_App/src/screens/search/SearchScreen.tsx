
import React from 'react';
import {
  ScrollView,
  Text,
  TextInput,
  View,
  Switch,
  Pressable,
} from 'react-native';

import { useQuery } from '@tanstack/react-query';

import {
  useNavigation,
  useRoute,
  RouteProp,
} from '@react-navigation/native';

import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  Map,
  List as ListIcon,
  RotateCcw,
  SlidersHorizontal,
  MapPin,
  Wallet,
  Utensils,
  Snowflake,
  Wifi,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react-native';

import { getListings } from '../../services/listing.service';

import SearchBar from '../../components/SearchBar';
import ListingCard from '../../components/ListingCard';
import FilterChip from '../../components/FilterChip';
import LoadingView from '../../components/LoadingView';
import EmptyState from '../../components/EmptyState';
import SharingCategoryChips from '../../components/SharingCategoryChips';
import { useListingRoutes } from '../../hooks/useListingRoutes';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  SharingOption,
  GenderPreference,
  AccommodationType,
  ListingFilters,
} from '../../types/listing';

import { styles } from './SearchScreen.styles';

import {
  RootStackParamList,
  MainTabParamList,
} from '../../navigation/AppNavigator';

// --------------------------------------------------
// TYPES
// --------------------------------------------------

type SearchRoute = RouteProp<MainTabParamList, 'Search'>;

type ViewMode = 'list' | 'map';

type FoodPreference = 'Any' | 'Veg' | 'Non-veg' | 'No food';

// --------------------------------------------------
// FILTER OPTIONS
// --------------------------------------------------

const genderOptions: GenderPreference[] = [
  'Any',
  'Men',
  'Women',
];

const accommodationOptions: AccommodationType[] = [
  'Any',
  'PG',
  'Co-living',
];

const foodOptions: FoodPreference[] = [
  'Any',
  'Veg',
  'Non-veg',
  'No food',
];

// --------------------------------------------------
// SEARCH SCREEN
// --------------------------------------------------

export default function SearchScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const route = useRoute<SearchRoute>();

  const insets = useSafeAreaInsets();

  // Get search text passed from HomeScreen
  const initialQuery = route.params?.query ?? '';

  // --------------------------------------------------
  // STATES
  // --------------------------------------------------

  const [locality, setLocality] = React.useState(initialQuery);

  const [rent, setRent] = React.useState('10000');

  const [sharing, setSharing] =
    React.useState<SharingOption>('Any');

  const [gender, setGender] =
    React.useState<GenderPreference>('Any');

  const [accommodationType, setAccommodationType] =
    React.useState<AccommodationType>('Any');

  const [food, setFood] =
    React.useState<FoodPreference>('Any');

  const [ac, setAc] = React.useState(false);

  const [wifi, setWifi] = React.useState(false);

  const [viewMode, setViewMode] =
    React.useState<ViewMode>('list');

  const [showFilters, setShowFilters] = React.useState(true);

  

  // --------------------------------------------------
  // SYNC HOME SEARCH QUERY
  // --------------------------------------------------

  React.useEffect(() => {
    if (route.params?.query !== undefined) {
      setLocality(route.params.query);
    }
  }, [route.params?.query]);

  // --------------------------------------------------
  // SEARCH FILTERS
  // --------------------------------------------------

  const filters: ListingFilters = {
    locality: locality.trim() || undefined,

    maxRent:
      rent.trim() !== '' && Number(rent) > 0
        ? Number(rent)
        : undefined,

    sharing,
    gender,
    accommodationType,
    food,
    ac,
    wifi,
  };

  // --------------------------------------------------
  // FETCH LISTINGS
  // --------------------------------------------------

  const query = useQuery({
    queryKey: [
      'search-listings',
      locality.trim(),
      rent,
      sharing,
      gender,
      accommodationType,
      food,
      ac,
      wifi,
    ],

    queryFn: () => getListings(filters),

    retry: 1,
  });
  const { listingsWithRoutes } = useListingRoutes(query.data ?? []);
  // --------------------------------------------------
  // RESET FILTERS
  // --------------------------------------------------

  function clearFilters() {
    setLocality('');
    setRent('10000');

    setSharing('Any');
    setGender('Any');
    setAccommodationType('Any');
    setFood('Any');

    setAc(false);
    setWifi(false);

    setViewMode('list');
    setShowFilters(true);
  }

  // --------------------------------------------------
  // MAP NAVIGATION
  // --------------------------------------------------

  function openMap() {
    navigation.navigate('MapSearch', {
      locality: locality.trim() || undefined,

      sharing,

      maxRent:
        rent.trim() !== '' && Number(rent) > 0
          ? Number(rent)
          : undefined,

      gender,
      accommodationType,
    });
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: Math.max(insets.top, 12) },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >

      {/* PAGE HEADER */}

      <View style={styles.header}>
        <View style={styles.headerTop}>

          <View style={styles.headingContent}>
            <View style={styles.eyebrow}>
              <Sparkles size={13} color="#F28A3B" />

              <Text style={styles.eyebrowText}>
                FIND YOUR NEXT HOME
              </Text>
            </View>

            <Text style={styles.title}>
              Find your{' '}
              <Text style={styles.titleAccent}>PG.</Text>
            </Text>

            <Text style={styles.subtitle}>
              Discover comfortable stays near your college,
              office or preferred locality.
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <MapPin size={25} color="#6330AB" />
          </View>

        </View>
      </View>

      {/* SEARCH */}

      <View style={styles.searchSection}>
        <Text style={styles.searchLabel}>
          WHERE DO YOU WANT TO STAY?
        </Text>

        <SearchBar
          value={locality}
          onChangeText={setLocality}
          placeholder="Search locality, college or office"
        />
      </View>

      {/* LIST / MAP */}

      <View style={styles.viewToggle}>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{
            selected: viewMode === 'list',
          }}
          style={[
            styles.viewButton,
            viewMode === 'list' && styles.viewButtonActive,
          ]}
          onPress={() => setViewMode('list')}
        >
          <ListIcon
            size={18}
            color={
              viewMode === 'list'
                ? '#FFFFFF'
                : '#6330AB'
            }
          />

          <Text
            style={[
              styles.viewButtonText,
              viewMode === 'list' &&
                styles.viewButtonTextActive,
            ]}
          >
            List view
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={openMap}
          style={[
            styles.viewButton,
            styles.mapButton,
          ]}
        >
          <Map size={18} color="#FFFFFF" />

          <Text style={styles.viewButtonTextActive}>
            View map
          </Text>
        </Pressable>

      </View>

      {/* FILTER HEADER */}

      <View style={styles.filterHeader}>

        <View style={styles.filterHeading}>
          <View style={styles.filterHeadingIcon}>
            <SlidersHorizontal
              size={18}
              color="#6330AB"
            />
          </View>

          <View>
            <Text style={styles.sectionTitle}>
              Refine your search
            </Text>

            <Text style={styles.sectionSubtitle}>
              Choose what matters to you
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() =>
            setShowFilters(value => !value)
          }
          accessibilityRole="button"
          style={styles.filterToggle}
        >
          <Text style={styles.filterToggleText}>
            {showFilters ? 'Hide' : 'Show'}
          </Text>

          {showFilters ? (
            <ChevronUp
              size={15}
              color="#6330AB"
            />
          ) : (
            <ChevronDown
              size={15}
              color="#6330AB"
            />
          )}
        </Pressable>

      </View>

      {/* FILTER PANEL */}

      {showFilters && (
        <View style={styles.panel}>

          {/* RENT */}

          <View style={styles.filterGroup}>

            <View style={styles.labelRow}>
              <View style={styles.labelIcon}>
                <Wallet
                  size={16}
                  color="#E87832"
                />
              </View>

              <Text style={styles.label}>
                Maximum monthly rent
              </Text>
            </View>

            <View style={styles.rentInputWrapper}>
              <Text style={styles.currencySymbol}>
                ₹
              </Text>

              <TextInput
                value={rent}
                onChangeText={value =>
                  setRent(value.replace(/[^0-9]/g, ''))
                }
                keyboardType="number-pad"
                placeholder="Enter your budget"
                placeholderTextColor="#A69BAE"
                style={styles.input}
                accessibilityLabel="Maximum monthly rent"
              />

              <Text style={styles.perMonth}>
                / month
              </Text>
            </View>

          </View>

          <View style={styles.separator} />

          {/* SHARING */}

          <View style={styles.filterGroup}>
            <Text style={styles.label}>
              Sharing preference
            </Text>

            <Text style={styles.helperText}>
              How many people would you like to share with?
            </Text>

            <SharingCategoryChips
              selected={sharing}
              onSelect={setSharing}
            />
          </View>

          <View style={styles.separator} />

          {/* ACCOMMODATION */}

          <View style={styles.filterGroup}>
            <Text style={styles.label}>
              Accommodation type
            </Text>

            <View style={styles.chips}>
              {accommodationOptions.map(option => (
                <FilterChip
                  key={option}
                  label={
                    option === 'Any'
                      ? 'Any type'
                      : option
                  }
                  selected={accommodationType === option}
                  onPress={() =>
                    setAccommodationType(option)
                  }
                />
              ))}
            </View>
          </View>

          <View style={styles.separator} />

          {/* GENDER */}

          <View style={styles.filterGroup}>
            <Text style={styles.label}>
              PG preference
            </Text>

            <View style={styles.chips}>
              {genderOptions.map(option => (
                <FilterChip
                  key={option}
                  label={
                    option === 'Any'
                      ? 'Any preference'
                      : option
                  }
                  selected={gender === option}
                  onPress={() => setGender(option)}
                />
              ))}
            </View>
          </View>

          <View style={styles.separator} />

          {/* FOOD */}

          <View style={styles.filterGroup}>

            <View style={styles.labelRow}>
              <View style={styles.labelIcon}>
                <Utensils
                  size={16}
                  color="#E87832"
                />
              </View>

              <Text style={styles.label}>
                Food preference
              </Text>
            </View>

            <View style={styles.chips}>
              {foodOptions.map(option => (
                <FilterChip
                  key={option}
                  label={option}
                  selected={food === option}
                  onPress={() => setFood(option)}
                />
              ))}
            </View>

          </View>

          <View style={styles.separator} />

          {/* AC */}

          <View style={styles.switchRow}>

            <View style={styles.switchIcon}>
              <Snowflake
                size={19}
                color="#6330AB"
              />
            </View>

            <View style={styles.switchText}>
              <Text style={styles.switchTitle}>
                Air conditioning
              </Text>

              <Text style={styles.switchSubtitle}>
                Only show PGs with AC
              </Text>
            </View>

            <Switch
              value={ac}
              onValueChange={setAc}
              trackColor={{
                false: '#DDD6E5',
                true: '#E8B17D',
              }}
              thumbColor={
                ac ? '#6330AB' : '#FFFFFF'
              }
            />

          </View>

          <View style={styles.separator} />

          {/* WIFI */}

          <View style={styles.switchRow}>

            <View style={styles.switchIcon}>
              <Wifi
                size={19}
                color="#6330AB"
              />
            </View>

            <View style={styles.switchText}>
              <Text style={styles.switchTitle}>
                Wi-Fi
              </Text>

              <Text style={styles.switchSubtitle}>
                Only show PGs with Wi-Fi
              </Text>
            </View>

            <Switch
              value={wifi}
              onValueChange={setWifi}
              trackColor={{
                false: '#DDD6E5',
                true: '#E8B17D',
              }}
              thumbColor={
                wifi ? '#6330AB' : '#FFFFFF'
              }
            />

          </View>

          {/* RESET */}

          <Pressable
            style={styles.resetButton}
            onPress={clearFilters}
            accessibilityRole="button"
          >
            <RotateCcw
              size={16}
              color="#6330AB"
            />

            <Text style={styles.resetButtonText}>
              Reset all filters
            </Text>
          </Pressable>

        </View>
      )}

      {/* RESULTS */}

      <View style={styles.resultsHeader}>

        <View style={styles.resultsHeadingContent}>
          <Text style={styles.resultsTitle}>
            Available PGs
          </Text>

          <Text style={styles.result}>
            {query.isLoading
              ? 'Finding places to stay...'
              : `${query.data?.length ?? 0} matching PGs`}
          </Text>
        </View>

        <Pressable
          onPress={clearFilters}
          style={styles.resetTextButton}
          accessibilityRole="button"
        >
          <RotateCcw
            size={13}
            color="#E87832"
          />

          <Text style={styles.clear}>
            Reset
          </Text>
        </Pressable>

      </View>

      {/* LOADING / ERROR / RESULTS */}

      {query.isLoading ? (
        <LoadingView message="Searching PGs..." />

      ) : query.isError ? (
        <EmptyState
          title="Search failed"
          message="Please check your connection and try again."
          actionLabel="Try again"
          onAction={() => query.refetch()}
        />

      ) : query.data && query.data.length > 0 ? (
        <View style={styles.listings}>
          {listingsWithRoutes.map(item => (
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
          ))}
        </View>

      ) : (
        <EmptyState
          title="No matching PGs"
          message="Try increasing your budget, removing a filter, or searching another locality."
          actionLabel="Clear filters"
          onAction={clearFilters}
        />
      )}

      {/* FOOTER */}

      <View style={styles.footer}>
        <View style={styles.footerLine} />

        <Text style={styles.footerLogo}>
          bed
          <Text style={styles.footerLogoAccent}>
            near
          </Text>
        </Text>

        <View style={styles.footerLine} />
      </View>

      <Text style={styles.footerTagline}>
        Find your bed. Find your place.
      </Text>

    </ScrollView>
  );
}
