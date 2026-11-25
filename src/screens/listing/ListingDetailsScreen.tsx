import React from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  StyleSheet,
  Keyboard,
} from 'react-native';

import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import {
  Heart,
  MapPin,
  ShieldCheck,
  Share2,
  CalendarDays,
  X,
} from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';

import { api } from '../../services/api';
import { getListing } from '../../services/listing.service';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { colors } from '../../constants/theme';
import { formatCurrency, formatDate } from '../../utils/formatters';
import AvailabilityBadge from '../../components/AvailabilityBadge';
import AppButton from '../../components/AppButton';
import LoadingView from '../../components/LoadingView';
import EmptyState from '../../components/EmptyState';
import { styles } from './ListingDetailsScreen.styles';
import { useQueryClient } from '@tanstack/react-query';

type ListingRoute = RouteProp<RootStackParamList, 'ListingDetails'>;
type Navigation = NativeStackNavigationProp<RootStackParamList>;

type ContactType = 'phone' | 'whatsapp';

type ListingAction = 'INTERESTED' | 'CALL' | 'WHATSAPP' | 'VISIT';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function ListingDetailsScreen() {
  const route = useRoute<ListingRoute>();
  const navigation = useNavigation<Navigation>();

  const [saved, setSaved] = React.useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = React.useState(0);

  const [visitModalVisible, setVisitModalVisible] = React.useState(false);
  const [visitDate, setVisitDate] = React.useState('');
  const [visitTime, setVisitTime] = React.useState('');
  const [actionLoading, setActionLoading] = React.useState(false);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['listing', route.params.listingId],
    queryFn: () => getListing(route.params.listingId),
    retry: 1,
  });

  const item = query.data;

  const photos = React.useMemo(() => {
    const valid = (item?.photos ?? []).filter(
      photo => typeof photo === 'string' && photo.trim().length > 0,
    );

    if (valid.length) return valid;

    return item?.image ? [item.image] : [];
  }, [item?.photos, item?.image]);

  React.useEffect(() => {
    setActivePhotoIndex(0);
  }, [route.params.listingId]);

  /**
   * Opens the owner's phone dialler or WhatsApp.
   * Contact details are fetched only after candidate login.
   */
  const openOwnerContact = async (contactType: ContactType) => {
    try {
      const response = await api.get(
        `/public/listings/${encodeURIComponent(route.params.listingId)}/contact`,
      );

      const phone = response.data?.contact?.phone;

      if (typeof phone !== 'string' || !phone.trim()) {
        Alert.alert(
          'Contact unavailable',
          'The PG owner has not provided a valid phone number.',
        );
        return;
      }

      let url = '';

      if (contactType === 'phone') {
        url = `tel:${phone.trim()}`;
      } else {
        let whatsappNumber = phone.replace(/\D/g, '');

        if (whatsappNumber.length === 10) {
          whatsappNumber = `91${whatsappNumber}`;
        }

        if (
          whatsappNumber.length < 11 ||
          whatsappNumber.length > 15
        ) {
          Alert.alert(
            'Invalid phone number',
            'The owner phone number is not in a valid international format.',
          );
          return;
        }

        url = `https://wa.me/${whatsappNumber}`;
      }

      const supported = await Linking.canOpenURL(url);

      if (!supported) {
        Alert.alert(
          'Unable to open contact',
          'No suitable application is available on this device.',
        );
        return;
      }

      await Linking.openURL(url);
    } catch (error: any) {
      Alert.alert(
        'Unable to contact owner',
        error?.response?.data?.message ??
          'Unable to retrieve the owner contact details. Please try again.',
      );
    }
  };

  /**
   * Sends the selected action to the backend.
   * If the candidate is not logged in, continue after OTP verification.
   */
  const submitListingAction = async (
    action: ListingAction,
    preferredVisitAt?: string,
  ) => {
    if (!item) return;

    try {
      const token = await SecureStore.getItemAsync(
        'bednear_access_token',
      );

      if (!token) {
        navigation.navigate('PhoneLogin', {
          listingId: item.id,
          pendingAction: action,
          preferredVisitAt,
        });

        return;
      }

      setActionLoading(true);

      await api.post('/enquiries/action', {
        listingId: item.id,
        action,
        ...(preferredVisitAt ? { preferredVisitAt } : {}),
      });
await queryClient.invalidateQueries({
  queryKey: ['my-enquiries'],
});
      if (action === 'INTERESTED') {
        Alert.alert(
          'Interest submitted',
          'Your interest has been shared with the PG owner.',
        );
      }

      if (action === 'VISIT') {
        setVisitModalVisible(false);
        setVisitDate('');
        setVisitTime('');

        Alert.alert(
          'Visit request submitted',
          'Your preferred visit date and time have been shared with the PG owner.',
        );
      }

      if (action === 'CALL') {
        await openOwnerContact('phone');
      }

      if (action === 'WHATSAPP') {
        await openOwnerContact('whatsapp');
      }
    } catch (error: any) {
      Alert.alert(
        'Unable to continue',
        error?.response?.data?.message ??
          'Something went wrong. Please try again.',
      );
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Continue an action after OTP login.
   * PhoneLogin and OtpVerification must forward these route parameters.
   */
  React.useEffect(() => {
    const pendingAction = route.params.pendingAction;
    const preferredVisitAt = route.params.preferredVisitAt;
    const contactType = route.params.contactType;

    if (!pendingAction && !contactType) return;

    navigation.setParams({
      pendingAction: undefined,
      preferredVisitAt: undefined,
      contactType: undefined,
    });

    if (pendingAction) {
      void submitListingAction(
        pendingAction,
        preferredVisitAt,
      );
      return;
    }

    // Backward compatibility with the previous contactType flow.
    if (contactType) {
      const action: ListingAction =
        contactType === 'phone' ? 'CALL' : 'WHATSAPP';

      void submitListingAction(action);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    route.params.pendingAction,
    route.params.preferredVisitAt,
    route.params.contactType,
    route.params.listingId,
  ]);

  const openDirections = async (
    mode: 'driving' | 'walking',
  ) => {
    if (item?.latitude == null || item.longitude == null) {
      Alert.alert(
        'Location unavailable',
        'The owner has not added the PG coordinates yet.',
      );
      return;
    }

    const destination = `${item.latitude},${item.longitude}`;

    const url =
      'https://www.google.com/maps/dir/?api=1' +
      `&destination=${encodeURIComponent(destination)}` +
      `&travelmode=${mode}`;

    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        'Unable to open directions',
        'Please try again.',
      );
    }
  };

  const openContact = async (kind: ContactType) => {
    const action: ListingAction =
      kind === 'phone' ? 'CALL' : 'WHATSAPP';

    await submitListingAction(action);
  };

  const handleBookVisit = () => {
    Keyboard.dismiss();

    if (!visitDate.trim() || !visitTime.trim()) {
      Alert.alert(
        'Missing details',
        'Please enter your preferred visit date and time.',
      );
      return;
    }

    // Expected input formats:
    // Date: YYYY-MM-DD
    // Time: HH:mm (24-hour format)
    const dateTime = new Date(`${visitDate}T${visitTime}:00`);

    if (Number.isNaN(dateTime.getTime())) {
      Alert.alert(
        'Invalid date or time',
        'Please enter a valid date and time.',
      );
      return;
    }

    if (dateTime.getTime() <= Date.now()) {
      Alert.alert(
        'Invalid visit time',
        'Please select a future date and time.',
      );
      return;
    }

    void submitListingAction(
      'VISIT',
      dateTime.toISOString(),
    );
  };

  const shareListing = () => {
    Alert.alert(
      'Share PG',
      'A public listing link and native share action can be connected in a future update.',
      [{ text: 'OK' }],
    );
  };

  if (query.isLoading) {
    return <LoadingView message="Loading PG details..." />;
  }

  if (query.isError || !item) {
    return (
      <EmptyState
        title="Listing unavailable"
        message="This PG may have been removed or is temporarily unavailable."
        actionLabel="Retry"
        onAction={() => query.refetch()}
      />
    );
  }

  const accommodationType = item.accommodationType ?? 'PG';
  const amenities = item.amenities ?? [];

  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[
          styles.content,
          extra.scrollContent,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* PROPERTY PHOTO GALLERY */}
        <View style={extra.heroContainer}>
          {photos.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              nestedScrollEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={event => {
                const index = Math.round(
                  event.nativeEvent.contentOffset.x /
                    SCREEN_WIDTH,
                );

                setActivePhotoIndex(index);
              }}
            >
              {photos.map((photo, index) => (
                <Image
                  key={`${photo}-${index}`}
                  source={{ uri: photo }}
                  style={[
                    styles.heroImage,
                    { width: SCREEN_WIDTH },
                  ]}
                  resizeMode="cover"
                  accessibilityLabel={`${item.name} photo ${
                    index + 1
                  }`}
                />
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.heroImage, extra.emptyHero]}>
              <Text style={extra.emptyHeroText}>
                No property photos available
              </Text>
            </View>
          )}

          {photos.length > 1 && (
            <View style={extra.photoCounter}>
              <Text style={extra.photoCounterText}>
                {activePhotoIndex + 1} / {photos.length}
              </Text>
            </View>
          )}

          {/* SAVE AND SHARE */}
          <View style={extra.topActions}>
            <Pressable
              onPress={() => setSaved(current => !current)}
              accessibilityRole="button"
              accessibilityLabel={
                saved ? 'Unsave PG' : 'Save PG'
              }
              style={extra.roundAction}
            >
              <Heart
                size={22}
                color={saved ? '#F97316' : colors.primary}
                fill={saved ? '#F97316' : 'transparent'}
              />
            </Pressable>

            <Pressable
              onPress={shareListing}
              accessibilityRole="button"
              accessibilityLabel="Share listing"
              style={extra.roundAction}
            >
              <Share2
                size={21}
                color={colors.primary}
              />
            </Pressable>
          </View>
        </View>

        <View style={styles.body}>
          {/* PROPERTY NAME AND TYPE */}
          <View style={extra.titleRow}>
            <Text style={styles.name}>{item.name}</Text>

            <View style={extra.typeBadge}>
              <Text style={extra.typeText}>
                {accommodationType}
              </Text>
            </View>
          </View>

          {/* LOCATION */}
          <View style={extra.locationRow}>
            <MapPin size={17} color={colors.primary} />

            <Text style={styles.location}>
              {item.address ||
                `${item.locality}, Bengaluru`}
            </Text>
          </View>

          {/* DIRECTIONS */}
          <View style={extra.directionsRow}>
            <View style={extra.directionButton}>
              <AppButton
                title="Drive"
                variant="outline"
                onPress={() =>
                  void openDirections('driving')
                }
              />
            </View>

            <View style={extra.directionButton}>
              <AppButton
                title="Walk"
                onPress={() =>
                  void openDirections('walking')
                }
              />
            </View>
          </View>

          {/* AVAILABILITY */}
          <View style={extra.availabilitySection}>
            <AvailabilityBadge
              availableBeds={item.availableBeds}
              confirmedAt={item.availabilityConfirmedAt}
            />

            <Text style={extra.confirmationText}>
              Last confirmed:{' '}
              {formatDate(item.availabilityConfirmedAt)}
            </Text>
          </View>

          {/* RENT AND DEPOSIT */}
          <View style={styles.priceBox}>
            <View style={extra.priceColumn}>
              <Text style={extra.priceLabel}>
                MONTHLY RENT
              </Text>

              <Text style={styles.price}>
                {formatCurrency(item.rent)}
              </Text>

              <Text style={styles.caption}>
                Per month
              </Text>
            </View>

            <View style={extra.priceDivider} />

            <View style={extra.priceColumn}>
              <Text style={extra.priceLabel}>
                SECURITY DEPOSIT
              </Text>

              <Text
                style={[styles.price, extra.depositPrice]}
              >
                {formatCurrency(item.deposit)}
              </Text>

              <Text style={styles.caption}>
                One-time payment
              </Text>
            </View>
          </View>

          {/* ABOUT THIS PG */}
          <View style={extra.aboutCard}>
            <Text style={styles.sectionTitle}>
              About this PG
            </Text>

            <Text style={styles.description}>
              {item.description ||
                'Contact the owner to learn more about this accommodation.'}
            </Text>
          </View>

          {/* AMENITIES */}
          <View style={extra.sectionHeadingRow}>
            <Text style={styles.sectionTitle}>
              Amenities
            </Text>

            {amenities.length > 0 && (
              <View style={extra.includedBadge}>
                <Text style={extra.includedBadgeText}>
                  {amenities.length} included
                </Text>
              </View>
            )}
          </View>

          {amenities.length > 0 ? (
            <View style={extra.amenitiesGrid}>
              {amenities.map((amenity, index) => (
                <View
                  key={`${amenity}-${index}`}
                  style={extra.amenityCard}
                >
                  <View style={extra.amenityCheck}>
                    <Text style={extra.amenityCheckText}>
                      ✓
                    </Text>
                  </View>

                  <Text style={extra.amenityText}>
                    {amenity}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={extra.emptyInfoCard}>
              <Text style={extra.emptyInfoText}>
                Ask the owner to confirm available amenities.
              </Text>
            </View>
          )}

          {/* ROOMS AND AVAILABILITY */}
          <Text style={styles.sectionTitle}>
            Rooms and availability
          </Text>

          {item.rooms && item.rooms.length > 0 ? (
            <View style={extra.roomsCard}>
              {item.rooms.map((room, index) => {
                const available = room.beds.filter(
                  bed =>
                    bed.status.toUpperCase() === 'AVAILABLE',
                ).length;

                return (
                  <View
                    key={room.id}
                    style={extra.roomSection}
                  >
                    <View style={extra.roomHeader}>
                      <View style={extra.roomTitleBlock}>
                        <Text style={extra.roomName}>
                          {room.name || `Room ${index + 1}`}
                        </Text>

                        <Text style={extra.roomDescription}>
                          {room.roomType.replaceAll('_', ' ')}
                        </Text>
                      </View>

                      <View
                        style={extra.roomAvailabilityBadge}
                      >
                        <Text style={extra.roomAvailability}>
                          {available}/{room.capacity} available
                        </Text>
                      </View>
                    </View>

                    {/* INDIVIDUAL BEDS */}
                    {room.beds.length > 0 ? (
                      <View style={extra.bedChips}>
                        {room.beds.map(bed => {
                          const isAvailable =
                            bed.status.toUpperCase() ===
                            'AVAILABLE';

                          return (
                            <View
                              key={bed.id}
                              style={[
                                extra.bedChip,
                                isAvailable
                                  ? extra.availableBed
                                  : extra.unavailableBed,
                              ]}
                            >
                              <View
                                style={[
                                  extra.bedStatusDot,
                                  isAvailable
                                    ? extra.availableDot
                                    : extra.unavailableDot,
                                ]}
                              />

                              <Text style={extra.bedChipText}>
                                {bed.bedNumber} ·{' '}
                                {isAvailable
                                  ? 'Available'
                                  : 'Unavailable'}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    ) : (
                      <Text style={extra.roomDescription}>
                        Individual bed details are not available.
                      </Text>
                    )}

                    <View style={extra.roomRentContainer}>
                      <Text style={extra.roomRent}>
                        {formatCurrency(
                          room.monthlyRent || item.rent,
                        )}
                      </Text>

                      <Text style={extra.roomRentCaption}>
                        / month
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={extra.emptyInfoCard}>
              <Text style={extra.emptyInfoText}>
                Room-level information is not available yet.
              </Text>
            </View>
          )}

          {/* STAY DETAILS */}
          <Text style={styles.sectionTitle}>
            Stay details
          </Text>

          <View style={extra.detailsCard}>
            <DetailRow
              label="Sharing"
              value={item.sharing}
            />

            <DetailRow
              label="Accommodation"
              value={accommodationType}
            />

            <DetailRow
              label="Preference"
              value={
                item.gender === 'Any'
                  ? 'Any gender'
                  : item.gender
              }
            />

            <DetailRow
              label="Available beds"
              value={String(item.availableBeds)}
            />

            <DetailRow
              label="Total beds"
              value={String(item.totalBeds)}
              last
            />
          </View>

          {/* SAFETY INFORMATION */}
          <View style={extra.safetyCard}>
            <View style={extra.safetyIcon}>
              <ShieldCheck
                size={23}
                color="#6330AB"
              />
            </View>

            <View style={extra.safetyText}>
              <Text style={extra.safetyTitle}>
                Stay safe with BedNear
              </Text>

              <Text style={extra.safetyDescription}>
                Verify the address, rent, deposit and
                availability before paying. Visit the property
                before making a decision.
              </Text>
            </View>
          </View>

          {/* ENQUIRY ACTIONS */}
          <View style={extra.contactSection}>
            <Text style={extra.contactTitle}>
              Interested in this PG?
            </Text>

            <Text style={extra.contactDescription}>
              Connect with the owner, express your interest or
              request a visit.
            </Text>

            <View style={extra.actionButton}>
              <AppButton
                title="I'm Interested"
                onPress={() =>
                  void submitListingAction('INTERESTED')
                }
              />
            </View>

            <View style={extra.actionButton}>
              <AppButton
                title="Book a Visit"
                variant="outline"
                onPress={() => setVisitModalVisible(true)}
              />
            </View>

            <View style={styles.actions}>
              <View style={styles.flexButton}>
                <AppButton
                  title="Call owner"
                  variant="outline"
                  onPress={() => void openContact('phone')}
                />
              </View>

              <View style={styles.flexButton}>
                <AppButton
                  title="WhatsApp"
                  onPress={() =>
                    void openContact('whatsapp')
                  }
                />
              </View>
            </View>

            <Text style={extra.loginNote}>
              Secure login is required to submit an enquiry
              and view owner contact details.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* BOOK A VISIT MODAL */}
      <Modal
        visible={visitModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setVisitModalVisible(false)
        }
      >
        <View style={extra.modalOverlay}>
          <View style={extra.modalCard}>
            <View style={extra.modalHeader}>
              <View style={extra.modalTitleRow}>
                <CalendarDays
                  size={22}
                  color={colors.primary}
                />

                <Text style={extra.modalTitle}>
                  Book a PG Visit
                </Text>
              </View>

              <Pressable
                onPress={() =>
                  setVisitModalVisible(false)
                }
                style={extra.modalClose}
                accessibilityRole="button"
                accessibilityLabel="Close visit form"
              >
                <X size={21} color="#51465D" />
              </Pressable>
            </View>

            <Text style={extra.modalDescription}>
              Select your preferred date and time. The owner
              will receive your visit request.
            </Text>

            <Text style={extra.inputLabel}>
              Preferred date
            </Text>

            <TextInput
              value={visitDate}
              onChangeText={setVisitDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#A49BAA"
              keyboardType="numbers-and-punctuation"
              style={extra.visitInput}
              maxLength={10}
            />

            <Text style={extra.inputHint}>
              Example: 2026-11-10
            </Text>

            <Text style={extra.inputLabel}>
              Preferred time
            </Text>

            <TextInput
              value={visitTime}
              onChangeText={setVisitTime}
              placeholder="HH:mm (24-hour format)"
              placeholderTextColor="#A49BAA"
              keyboardType="numbers-and-punctuation"
              style={extra.visitInput}
              maxLength={5}
            />

            <Text style={extra.inputHint}>
              Example: 10:30 or 16:00
            </Text>

            <View style={extra.modalButtons}>
              <View style={extra.modalButton}>
                <AppButton
                  title="Cancel"
                  variant="outline"
                  onPress={() =>
                    setVisitModalVisible(false)
                  }
                />
              </View>

              <View style={extra.modalButton}>
                <AppButton
                  title="Submit Request"
                  onPress={handleBookVisit}
                  disabled={actionLoading}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

// STAY DETAIL ROW
function DetailRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View
      style={[
        extra.detailRow,
        last && extra.lastDetailRow,
      ]}
    >
      <Text style={extra.detailLabel}>{label}</Text>
      <Text style={extra.detailValue}>{value}</Text>
    </View>
  );
}

// SCREEN DESIGN STYLES
const extra = StyleSheet.create({
  scrollContent: {
    paddingBottom: 30,
  },

  heroContainer: {
    position: 'relative',
    backgroundColor: '#EEE5F8',
  },

  emptyHero: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyHeroText: {
    color: colors.muted,
    fontSize: 13,
  },

  topActions: {
    position: 'absolute',
    right: 16,
    top: 16,
    flexDirection: 'row',
    gap: 10,
  },

  roundAction: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },

  photoCounter: {
    position: 'absolute',
    right: 16,
    bottom: 15,
    backgroundColor: 'rgba(35, 25, 45, 0.78)',
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },

  photoCounterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 9,
  },

  typeBadge: {
    backgroundColor: '#EEE6FA',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },

  typeText: {
    color: '#6330AB',
    fontSize: 11,
    fontWeight: '800',
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 9,
  },

  directionsRow: {
    flexDirection: 'row',
    gap: 11,
    marginTop: 17,
  },

  directionButton: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },

  availabilitySection: {
    marginTop: 17,
  },

  confirmationText: {
    color: '#89818F',
    fontSize: 12,
    marginTop: 8,
  },

  priceColumn: {
    flex: 1,
  },

  priceLabel: {
    color: '#928A99',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
    marginBottom: 8,
  },

  depositPrice: {
    color: '#302638',
  },

  priceDivider: {
    width: 1,
    backgroundColor: '#EEE7F1',
    marginVertical: 4,
  },

  aboutCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    paddingHorizontal: 15,
    paddingBottom: 17,
    borderWidth: 1,
    borderColor: '#EAE2F1',
    marginTop: 25,
  },

  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 3,
  },

  includedBadge: {
    backgroundColor: '#EEE7FA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 22,
    marginBottom: 13,
  },

  includedBadgeText: {
    color: '#6330AB',
    fontSize: 11,
    fontWeight: '800',
  },

  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  amenityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAE2F1',
    borderRadius: 13,
    paddingHorizontal: 11,
    paddingVertical: 11,
  },

  amenityCheck: {
    width: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: '#EEE7FA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  amenityCheckText: {
    color: '#6330AB',
    fontSize: 12,
    fontWeight: '900',
  },

  amenityText: {
    color: '#34283E',
    fontSize: 12,
    fontWeight: '700',
  },

  emptyInfoCard: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#EAE2F1',
    marginTop: 5,
  },

  emptyInfoText: {
    color: '#77717E',
    fontSize: 13,
    lineHeight: 20,
  },

  roomsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EAE2F1',
    paddingHorizontal: 15,
    marginTop: 5,
    elevation: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 2 },
  },

  roomSection: {
    paddingVertical: 17,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EAE2F1',
  },

  roomHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },

  roomTitleBlock: {
    flex: 1,
  },

  roomName: {
    color: '#292230',
    fontSize: 16,
    fontWeight: '800',
  },

  roomDescription: {
    color: '#89818F',
    fontSize: 12,
    marginTop: 6,
    textTransform: 'capitalize',
  },

  roomAvailabilityBadge: {
    backgroundColor: '#E5F7EB',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 9,
  },

  roomAvailability: {
    color: '#16834A',
    fontSize: 11,
    fontWeight: '800',
  },

  bedChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },

  bedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },

  availableBed: {
    backgroundColor: '#E1F7E9',
  },

  unavailableBed: {
    backgroundColor: '#F0EDF2',
  },

  bedStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },

  availableDot: {
    backgroundColor: '#16A34A',
  },

  unavailableDot: {
    backgroundColor: '#9A929F',
  },

  bedChipText: {
    color: '#342B3B',
    fontSize: 11,
    fontWeight: '700',
  },

  roomRentContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 14,
  },

  roomRent: {
    color: '#6330AB',
    fontSize: 14,
    fontWeight: '900',
  },

  roomRentCaption: {
    color: '#89818F',
    fontSize: 11,
    marginLeft: 4,
  },

  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EAE2F1',
    paddingHorizontal: 15,
    marginTop: 5,
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EAE2F1',
  },

  lastDetailRow: {
    borderBottomWidth: 0,
  },

  detailLabel: {
    color: '#89818F',
    fontSize: 13,
  },

  detailValue: {
    color: '#302638',
    fontSize: 13,
    fontWeight: '800',
    flexShrink: 1,
    textAlign: 'right',
  },

  safetyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 13,
    backgroundColor: '#EEE8FA',
    borderRadius: 17,
    padding: 16,
    marginTop: 23,
  },

  safetyIcon: {
    width: 42,
    height: 42,
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  safetyText: {
    flex: 1,
  },

  safetyTitle: {
    color: '#5F2BA7',
    fontSize: 15,
    fontWeight: '800',
  },

  safetyDescription: {
    color: '#5F5669',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 6,
  },

  contactSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EAE2F1',
    padding: 16,
    marginTop: 23,
  },

  contactTitle: {
    color: '#292230',
    fontSize: 17,
    fontWeight: '800',
  },

  contactDescription: {
    color: '#89818F',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 6,
  },

  actionButton: {
    marginTop: 12,
  },

  loginNote: {
    color: '#89818F',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 13,
    marginBottom: 3,
    lineHeight: 17,
  },

  // Visit modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(25, 18, 32, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },

  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  modalTitle: {
    color: '#292230',
    fontSize: 18,
    fontWeight: '800',
  },

  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3EFF6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalDescription: {
    color: '#77717E',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 12,
    marginBottom: 18,
  },

  inputLabel: {
    color: '#34283E',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 10,
  },

  visitInput: {
    borderWidth: 1,
    borderColor: '#DED5E7',
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 13,
    color: '#292230',
    fontSize: 14,
    backgroundColor: '#FFFFFF',
  },

  inputHint: {
    color: '#89818F',
    fontSize: 11,
    marginTop: 5,
  },

  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
  },

  modalButton: {
    flex: 1,
  },
});