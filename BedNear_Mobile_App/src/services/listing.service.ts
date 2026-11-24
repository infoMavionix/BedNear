import { api } from './api';
import { USE_DEMO_DATA } from '../constants/config';
import { demoListings } from './demo-data';
import {
  Listing,
  ListingFilters,
  ListingRoom,
  ListingBed,
} from '../types/listing';

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1000&q=80';

type RawListing = {
  [key: string]: any;
  id?: string | number;
  _id?: string | number;
  latitude?: string | number | null;
  longitude?: string | number | null;
  lat?: string | number;
  lng?: string | number;
  location?: {
    latitude?: string | number;
    longitude?: string | number;
    lat?: string | number;
    lng?: string | number;
  };
  photos?: Array<string | { id?: string; url?: string; uri?: string; isCover?: boolean; sortOrder?: number }>;
  images?: Array<{ id?: string; url?: string; isCover?: boolean; sortOrder?: number }>;
  rooms?: any[];
  amenities?: Array<string | { name?: string; amenity?: { name?: string } }>;
  status?: string;
  genderPolicy?: string;
  monthlyRent?: number | string | null;
  deposit?: number | string | null;
};

function parseCoordinate(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function normalizePhotos(item: RawListing): string[] {
  const rawPhotos = Array.isArray(item.photos)
    ? item.photos
    : Array.isArray(item.images)
      ? item.images
      : [];

  const sortedPhotos = [...rawPhotos].sort((a: any, b: any) => {
    if (Boolean(a?.isCover) !== Boolean(b?.isCover)) {
      return a?.isCover ? -1 : 1;
    }
    return Number(a?.sortOrder ?? 0) - Number(b?.sortOrder ?? 0);
  });

  const photos = sortedPhotos
    .map((photo: any) =>
      typeof photo === 'string' ? photo : photo?.url ?? photo?.uri
    )
    .filter(
      (url: unknown): url is string =>
        typeof url === 'string' && url.trim().length > 0
    );

  const cover = item.image ?? item.coverImage;
  if (typeof cover === 'string' && cover.trim()) {
    return [cover, ...photos.filter(url => url !== cover)];
  }

  return photos.length > 0 ? photos : [DEFAULT_IMAGE];
}

function normalizeAmenities(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((amenity: any) => {
      if (typeof amenity === 'string') return amenity;
      return amenity?.name ?? amenity?.amenity?.name ?? '';
    })
    .filter(
      (name: unknown): name is string =>
        typeof name === 'string' && name.trim().length > 0
    );
}

function normalizeRoom(room: any, index: number): ListingRoom {
  const beds: ListingBed[] = Array.isArray(room?.beds)
    ? room.beds.map((bed: any, bedIndex: number) => ({
        id: String(bed?.id ?? `${room?.id ?? index}-bed-${bedIndex}`),
        bedNumber: String(bed?.bedNumber ?? `Bed ${bedIndex + 1}`),
        status: String(bed?.status ?? 'AVAILABLE').toUpperCase(),
        monthlyRent:
          bed?.monthlyRent == null ? null : Number(bed.monthlyRent),
      }))
    : [];

  return {
    id: String(room?.id ?? `room-${index + 1}`),
    name: String(room?.name ?? `Room ${index + 1}`),
    roomType: String(room?.roomType ?? 'SHARED'),
    capacity: Number(room?.capacity ?? beds.length),
    monthlyRent: Number(room?.monthlyRent ?? 0),
    beds,
  };
}

function normalizeSharing(value: unknown): string {
  const raw = String(value ?? 'Shared').trim();
  const normalized = raw.toLowerCase().replace(/[_-]/g, ' ');

  if (normalized === 'single' || normalized === 'private') return 'Single';

  const numeric = normalized.match(/^([2-6])(?:\s*sharing|\s*share)?$/);
  if (numeric) return `${numeric[1]} Sharing`;

  const wordNumeric = normalized.match(/^([2-6])\s*(?:person|bed|occupancy)/);
  if (wordNumeric) return `${wordNumeric[1]} Sharing`;

  return raw;
}

function normalizeAccommodation(value: unknown): string {
  const raw = String(value ?? 'PG').trim();
  const normalized = raw.toLowerCase().replace(/[_-]/g, ' ');

  if (normalized.includes('co living') || normalized === 'coliving') {
    return 'Co-living';
  }
  if (normalized === 'pg' || normalized.includes('paying guest')) return 'PG';
  return raw;
}

function normalizeListing(item: RawListing): Listing {
  const photos = normalizePhotos(item);
  const rooms = Array.isArray(item.rooms)
    ? item.rooms.map(normalizeRoom)
    : [];

  const latitude = parseCoordinate(
    item.latitude ?? item.lat ?? item.location?.latitude ?? item.location?.lat
  );
  const longitude = parseCoordinate(
    item.longitude ?? item.lng ?? item.location?.longitude ?? item.location?.lng
  );

  const availableBeds = rooms.length
    ? rooms.reduce(
        (total, room) =>
          total +
          room.beds.filter(bed => bed.status === 'AVAILABLE').length,
        0
      )
    : Number(item.availableBeds ?? item.vacantBeds ?? item.availableBedCount ?? 0);

  const totalBeds = rooms.length
    ? rooms.reduce((total, room) => total + room.capacity, 0)
    : Number(item.totalBeds ?? item.bedCount ?? 0);

  const result: Listing = {
    id: String(item.id ?? item._id ?? ''),
    name: item.name ?? item.title ?? 'PG accommodation',
    locality: item.locality ?? item.area ?? item.city ?? 'Bengaluru',
    address: item.address ?? item.fullAddress ?? '',
    rent: Number(item.rent ?? item.monthlyRent ?? 0),
    deposit: Number(item.deposit ?? item.securityDeposit ?? 0),
    sharing: normalizeSharing(item.sharing ?? item.sharingType ?? 'Shared'),
    gender:
      item.gender ??
      item.genderPreference ??
      item.genderPolicy ??
      'Any',
    accommodationType: normalizeAccommodation(
      item.accommodationType ?? item.propertyType ?? 'PG'
    ),
    availableBeds,
    totalBeds,
    availabilityConfirmedAt:
      item.availabilityConfirmedAt ?? item.lastAvailabilityConfirmedAt ?? null,
    amenities: normalizeAmenities(item.amenities),
    description: item.description ?? '',
    image: photos[0],
    photos,
    rooms,
    rating: item.rating != null ? Number(item.rating) : undefined,
    phone: item.phone ?? item.owner?.phone,
    whatsapp: item.whatsapp ?? item.owner?.whatsapp,
    published: item.published ?? item.status === 'PUBLISHED',
  };

  if (latitude !== undefined && latitude >= -90 && latitude <= 90) {
    result.latitude = latitude;
  }
  if (longitude !== undefined && longitude >= -180 && longitude <= 180) {
    result.longitude = longitude;
  }

  return result;
}

export async function getListings(filters: ListingFilters = {}): Promise<Listing[]> {
  if (USE_DEMO_DATA) {
    return filterListings(
      demoListings.map(item => normalizeListing(item as RawListing)),
      filters
    );
  }

  const { data } = await api.get('/public/listings', {
    params: {
      city: 'Bengaluru',
      locality: filters.locality?.trim() || undefined,
    },
  });

  const rows: RawListing[] = Array.isArray(data)
    ? data
    : data?.listings ??
      data?.items ??
      data?.data?.listings ??
      data?.data ??
      data?.properties ??
      [];

  if (!Array.isArray(rows)) {
    throw new Error('The listings API returned an unexpected response.');
  }

  return filterListings(rows.map(normalizeListing), filters);
}

export async function getListing(id: string): Promise<Listing> {
  if (USE_DEMO_DATA) {
    const listing = demoListings.find(item => String(item.id) === String(id));
    if (!listing) throw new Error('This PG listing could not be found.');
    return normalizeListing(listing as RawListing);
  }

  const { data } = await api.get(
    `/public/listings/${encodeURIComponent(id)}`
  );

  const rawListing =
    data?.listing ??
    data?.data?.listing ??
    data?.item ??
    data?.data ??
    data?.property ??
    data;

  if (!rawListing?.id) {
    throw new Error('The API did not return the requested PG listing.');
  }

  return normalizeListing(rawListing);
}

function filterListings(listings: Listing[], filters: ListingFilters): Listing[] {
  return listings.filter(item => {
    if (item.published === false) return false;
    if (item.availableBeds <= 0) return false;

    if (
      filters.locality?.trim() &&
      !`${item.locality} ${item.name} ${item.address}`
        .toLowerCase()
        .includes(filters.locality.trim().toLowerCase())
    ) return false;

    if (filters.maxRent && filters.maxRent > 0 && item.rent > filters.maxRent) {
      return false;
    }

    if (
      filters.sharing &&
      filters.sharing !== 'Any' &&
      !matchesSharing(item.sharing, filters.sharing)
    ) return false;

    if (
      filters.gender &&
      filters.gender !== 'Any' &&
      item.gender !== 'Any' &&
      item.gender.toLowerCase() !== filters.gender.toLowerCase()
    ) return false;

    if (
      filters.accommodationType &&
      filters.accommodationType !== 'Any' &&
      (item.accommodationType ?? 'PG').toLowerCase() !==
        filters.accommodationType.toLowerCase()
    ) return false;

    const amenities = item.amenities.map(a => a.toLowerCase()).join(' ');

    if (filters.food === 'Veg' && !/\bveg(?:etarian)?\b/.test(amenities)) {
      return false;
    }
    if (
      filters.food === 'Non-veg' &&
      !/(non[\s-]?veg|nonvegetarian)/.test(amenities)
    ) return false;
    if (
      filters.food === 'No food' &&
      /(food included|meals included|food provided|meals provided)/.test(amenities)
    ) return false;
    if (filters.ac && !amenities.includes('ac')) return false;
    if (filters.wifi && !/wi[\s-]?fi/.test(amenities)) return false;

    return true;
  });
}

function matchesSharing(actual: string, requested: string): boolean {
  const actualNormalized = actual.toLowerCase().trim();
  const requestedNormalized = requested.toLowerCase().trim();

  if (requestedNormalized === 'single') {
    return actualNormalized === 'single' || actualNormalized === 'private';
  }
  if (requestedNormalized === 'co-living') return false;

  const requestedMatch = requestedNormalized.match(/^([2-6])\s*sharing$/);
  if (requestedMatch) {
    return actualNormalized === `${requestedMatch[1]} sharing`;
  }

  return actualNormalized.includes(requestedNormalized);
}
