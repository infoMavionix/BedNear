import React from 'react';
import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';

import { Listing } from '../types/listing';
import {
  getRouteMatrix,
  type Coordinates,
  type RouteResult,
} from '../services/route.service';

type CardRoute = {
  distanceMeters: number;
  durationSeconds: number;
};

export function useListingRoutes(listings: Listing[]) {
  // Home and Search share this cached GPS location query.
  const locationQuery = useQuery<Coordinates | null>({
    queryKey: ['bednear-current-location'],
    queryFn: async () => {
      try {
        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (!servicesEnabled) return null;

        const permission =
          await Location.requestForegroundPermissionsAsync();
        if (permission.status !== 'granted') return null;

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        return {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
      } catch (error) {
        console.warn('[BedNear] Could not fetch current location:', error);
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: false,
  });

  const origin = locationQuery.data ?? null;

  const destinations = React.useMemo(
    () =>
      listings
        .filter(
          item =>
            item.latitude != null &&
            item.longitude != null &&
            Number.isFinite(item.latitude) &&
            Number.isFinite(item.longitude)
        )
        .map(item => ({
          id: item.id,
          latitude: item.latitude!,
          longitude: item.longitude!,
        })),
    [listings]
  );

  const routesQuery = useQuery<RouteResult[]>({
    queryKey: [
      'bednear-driving-routes',
      origin?.latitude ?? null,
      origin?.longitude ?? null,
      destinations,
      'DRIVE',
    ],
    enabled: Boolean(origin && destinations.length > 0),
    queryFn: async () => {
      try {
        return await getRouteMatrix(origin!, destinations, 'DRIVE');
      } catch (error) {
        console.error(
          '[BedNear] Driving route calculation failed:',
          error
        );
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });

  const routeMap = React.useMemo(() => {
    const result: Record<string, CardRoute> = {};

    (routesQuery.data ?? []).forEach(route => {
      if (
        route.available &&
        typeof route.distanceMeters === 'number' &&
        Number.isFinite(route.distanceMeters) &&
        typeof route.durationSeconds === 'number' &&
        Number.isFinite(route.durationSeconds)
      ) {
        result[route.id] = {
          distanceMeters: route.distanceMeters,
          durationSeconds: route.durationSeconds,
        };
      }
    });

    return result;
  }, [routesQuery.data]);

  const listingsWithRoutes = React.useMemo(
    () =>
      listings.map(item => ({
        ...item,
        drivingRoute: routeMap[item.id],
      })),
    [listings, routeMap]
  );

  return {
    origin,
    listingsWithRoutes,
    isLocationLoading: locationQuery.isLoading,
    isRoutesLoading: routesQuery.isFetching,
    refreshLocation: locationQuery.refetch,
  };
}
