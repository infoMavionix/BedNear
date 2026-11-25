
import React from "react";

import {
  NavigationContainer,
  NavigatorScreenParams,
} from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Home,
  Search,
  Heart,
  MessageSquareText,
  UserRound,
} from "lucide-react-native";

import { colors } from "../constants/theme";

// Screens
import HomeScreen from "../screens/home/HomeScreen";
import SearchScreen from "../screens/search/SearchScreen";
import FavouritesScreen from "../screens/favourites/FavouritesScreen";
import EnquiriesScreen from "../screens/enquiries/EnquiriesScreen";
import ProfileScreen from "../screens/auth/ProfileScreen";
import ListingDetailsScreen from "../screens/listing/ListingDetailsScreen";
import PhoneLoginScreen from "../screens/auth/PhoneLoginScreen";
import OtpVerificationScreen from "../screens/auth/OtpVerificationScreen";
import MapSearchScreen from "../screens/search/MapSearchScreen";

// --------------------------------------------------
// LISTING ACTION TYPE
// --------------------------------------------------

export type ListingAction =
  | "INTERESTED"
  | "CALL"
  | "WHATSAPP"
  | "VISIT";

export type ContactType = "phone" | "whatsapp";

// --------------------------------------------------
// BOTTOM TAB NAVIGATION
// --------------------------------------------------

export type MainTabParamList = {
  Home: undefined;
  Search: {
    query?: string;
  } | undefined;
  Saved: undefined;
  Enquiries: undefined;
  Profile: undefined;
};

// --------------------------------------------------
// ROOT STACK NAVIGATION
// --------------------------------------------------

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;

  ListingDetails: {
    listingId: string;
    pendingAction?: ListingAction;
    preferredVisitAt?: string;
    contactType?: ContactType;
  };

  MapSearch: {
    locality?: string;
    sharing?: string;
    maxRent?: number;
    gender?: string;
    accommodationType?: string;
  };

  PhoneLogin:
    | {
        listingId?: string;
        pendingAction?: ListingAction;
        preferredVisitAt?: string;
        contactType?: ContactType;
      }
    | undefined;

  OtpVerification: {
    phone: string;
    listingId?: string;
    pendingAction?: ListingAction;
    preferredVisitAt?: string;
    contactType?: ContactType;
  };
};

// --------------------------------------------------
// NAVIGATORS
// --------------------------------------------------

const Stack = createNativeStackNavigator<RootStackParamList>();

const Tab = createBottomTabNavigator<MainTabParamList>();

// --------------------------------------------------
// MAIN BOTTOM TABS
// --------------------------------------------------

function MainTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,

        tabBarStyle: {
          height: 62 + insets.bottom,
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 6),

          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,

          elevation: 8,
        },

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },

        tabBarIconStyle: {
          marginTop: 0,
        },

        tabBarItemStyle: {
          paddingVertical: 0,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size }) => (
            <Home color={color} size={size} />
          ),
        }}
      />

      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarLabel: "Search",
          tabBarIcon: ({ color, size }) => (
            <Search color={color} size={size} />
          ),
        }}
      />

      <Tab.Screen
        name="Saved"
        component={FavouritesScreen}
        options={{
          tabBarLabel: "Saved",
          tabBarIcon: ({ color, size }) => (
            <Heart color={color} size={size} />
          ),
        }}
      />

      <Tab.Screen
        name="Enquiries"
        component={EnquiriesScreen}
        options={{
          tabBarLabel: "Enquiries",
          tabBarIcon: ({ color, size }) => (
            <MessageSquareText color={color} size={size} />
          ),
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: ({ color, size }) => (
            <UserRound color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// --------------------------------------------------
// ROOT NAVIGATOR
// --------------------------------------------------

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="PhoneLogin"
        screenOptions={{
          headerTintColor: colors.primary,

          headerStyle: {
            backgroundColor: colors.background,
          },

          headerTitleStyle: {
            fontWeight: "800",
          },

          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        {/* PHONE LOGIN - FIRST SCREEN */}
        <Stack.Screen
          name="PhoneLogin"
          component={PhoneLoginScreen}
          options={{
            headerShown: false,
            animation: "fade",
            gestureEnabled: false,
          }}
        />

        {/* OTP VERIFICATION */}
        <Stack.Screen
          name="OtpVerification"
          component={OtpVerificationScreen}
          options={{
            title: "Verify mobile number",
            headerBackTitle: "Back",
          }}
        />

        {/* MAIN APPLICATION */}
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />

        {/* PG DETAILS */}
        <Stack.Screen
          name="ListingDetails"
          component={ListingDetailsScreen}
          options={{
            title: "PG Details",
          }}
        />

        {/* MAP SEARCH */}
        <Stack.Screen
          name="MapSearch"
          component={MapSearchScreen}
          options={{
            title: "PGs on Map",
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
