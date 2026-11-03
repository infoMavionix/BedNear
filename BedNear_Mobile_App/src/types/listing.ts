export interface RouteInfo {
  distanceMeters: number;
  durationSeconds: number;
}

export type TravelMode = 'DRIVE' | 'WALK';

export interface ListingBed {
  id: string;
  bedNumber: string;
  status: string;
  monthlyRent?: number | null;
}

export interface ListingRoom {
  id: string;
  name: string;
  roomType: string;
  capacity: number;
  monthlyRent: number;
  beds: ListingBed[];
}

export interface Listing {
  id: string;
  name: string;
  locality: string;
  address: string;
  latitude?: number;
  longitude?: number;
  rent: number;
  deposit: number;
  sharing: string;
  gender: string;
  accommodationType?: string;
  availableBeds: number;
  totalBeds: number;
  availabilityConfirmedAt?: string | null;
  amenities: string[];
  description: string;
  image: string;
  photos?: string[];
  rooms?: ListingRoom[];
  rating?: number;
  phone?: string;
  whatsapp?: string;
  published?: boolean;
  drivingRoute?: RouteInfo;
  walkingRoute?: RouteInfo;
}

export type SharingOption =
  | 'Any'
  | 'Single'
  | '2 Sharing'
  | '3 Sharing'
  | '4 Sharing'
  | '5 Sharing'
  | '6 Sharing';

export type GenderPreference = 'Any' | 'Men' | 'Women';
export type AccommodationType = 'Any' | 'PG' | 'Co-living';
export type FoodPreference = 'Any' | 'Veg' | 'Non-veg' | 'No food';

export interface ListingFilters {
  locality?: string;
  maxRent?: number;
  sharing?: SharingOption | string;
  gender?: GenderPreference | string;
  accommodationType?: AccommodationType | string;
  food?: FoodPreference;
  ac?: boolean;
  wifi?: boolean;
}
