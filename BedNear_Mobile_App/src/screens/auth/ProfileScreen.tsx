import React, { useCallback, useState } from "react";

import {

  ActivityIndicator,

  Alert,

  Modal,

  Pressable,

  ScrollView,

  Text,

  TextInput,

  View,

} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import * as SecureStore from "expo-secure-store";

import {

  UserRound,

  ShieldCheck,

  HelpCircle,

  FileText,

  Heart,

  MessageSquareText,

  Settings2,

  Clock3,

  ChevronRight,

  Bell,

  Info,

  LogOut,

  Pencil,

  Phone,

  Mail,

  CalendarDays,

  Save,

  X,

  LockKeyhole,

} from "lucide-react-native";

import { useFocusEffect, useNavigation } from "@react-navigation/native";

import { NativeStackNavigationProp } from "@react-navigation/native-stack";



import { RootStackParamList } from "../../navigation/AppNavigator";

import { api } from "../../services/api";

import { styles } from "./ProfileScreen.styles";



type NavigationProp = NativeStackNavigationProp<RootStackParamList>;



type ProfileUser = {

  id: string;

  name: string;

  email: string;

  phone: string | null;

  businessName: string | null;

  role: string;

  createdAt: string;

};



type MenuRowProps = {

  icon: React.ReactNode;

  title: string;

  subtitle: string;

  onPress: () => void;

  last?: boolean;

};



const MenuRow = ({

  icon,

  title,

  subtitle,

  onPress,

  last = false,

}: MenuRowProps) => (

  <Pressable

    style={({ pressed }) => [

      styles.menuRow,

      last && styles.lastMenuRow,

      pressed && styles.pressed,

    ]}

    onPress={onPress}

  >

    <View style={styles.menuIcon}>{icon}</View>



    <View style={styles.menuText}>

      <Text style={styles.menuTitle}>{title}</Text>

      <Text style={styles.menuSubtitle}>{subtitle}</Text>

    </View>



    <View style={styles.chevron}>

      <ChevronRight size={16} color="#8D7D99" />

    </View>

  </Pressable>

);



const ProfileScreen = () => {

  const navigation = useNavigation<NavigationProp>();



  const [user, setUser] = useState<ProfileUser | null>(null);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [isEditing, setIsEditing] = useState(false);



  const [name, setName] = useState("");

  const [phone, setPhone] = useState("");



  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [signInPrompt, setSignInPrompt] = useState<{
    title: string;
    description: string;
  } | null>(null);

  const showSignInPrompt = (title: string, description: string) => {
    setSignInPrompt({ title, description });
  };

  const closeSignInPrompt = () => {
    setSignInPrompt(null);
  };

  const continueToSignIn = () => {
    setSignInPrompt(null);
    handleSignIn();
  };




  const loadProfile = useCallback(async () => {

    setLoading(true);



    try {

      const token = await SecureStore.getItemAsync("bednear_access_token");



      if (!token) {

        setUser(null);

        setIsLoggedIn(false);

        setIsEditing(false);

        return;

      }



      const response = await api.get("/profile");



      const profile: ProfileUser = response.data.user;



      setUser(profile);

      setName(profile.name || "");

      setPhone(profile.phone || "");

      setIsLoggedIn(true);

    } catch (error: any) {

      console.error(

        "[BedNear] Profile loading failed:",

        error?.response?.data || error?.message,

      );



      if (error?.response?.status === 401) {

        await SecureStore.deleteItemAsync("bednear_access_token");

        setUser(null);

        setIsLoggedIn(false);

        setIsEditing(false);

      } else {

        Alert.alert(

          "Unable to load profile",

          error?.response?.data?.message ||

            "Please check your internet connection and try again.",

        );

      }

    } finally {

      setLoading(false);

    }

  }, []);



  useFocusEffect(

    useCallback(() => {

      loadProfile();

    }, [loadProfile]),

  );



  const handleSignIn = () => {

    navigation.navigate("PhoneLogin", undefined);

  };



  const handleEdit = () => {

    if (!user) return;



    setName(user.name || "");

    setPhone(user.phone || "");

    setIsEditing(true);

  };



  const handleCancelEdit = () => {

    setName(user?.name || "");

    setPhone(user?.phone || "");

    setIsEditing(false);

  };



  const handleSaveProfile = async () => {

    const trimmedName = name.trim();

    const trimmedPhone = phone.trim();



    if (trimmedName.length < 2) {

      Alert.alert("Invalid name", "Please enter at least 2 characters.");

      return;

    }



    if (trimmedPhone && !/^[0-9+\-\s()]{7,20}$/.test(trimmedPhone)) {

      Alert.alert(

        "Invalid mobile number",

        "Please enter a valid mobile number.",

      );

      return;

    }



    setSaving(true);



    try {

      const response = await api.patch("/profile", {

        name: trimmedName,

        phone: trimmedPhone || null,

      });



      const updatedUser: ProfileUser = response.data.user;



      setUser(updatedUser);

      setName(updatedUser.name || "");

      setPhone(updatedUser.phone || "");

      setIsEditing(false);



      Alert.alert(

        "Profile updated",

        "Your profile information has been saved successfully.",

      );

    } catch (error: any) {

      console.error(

        "[BedNear] Profile update failed:",

        error?.response?.data || error?.message,

      );



      Alert.alert(

        "Update failed",

        error?.response?.data?.message ||

          "Unable to update your profile. Please try again.",

      );

    } finally {

      setSaving(false);

    }

  };



  const handleLogout = () => {

    Alert.alert("Logout", "Are you sure you want to log out of BedNear?", [

      {

        text: "Cancel",

        style: "cancel",

      },

      {

        text: "Logout",

        style: "destructive",

        onPress: async () => {

          try {

            await SecureStore.deleteItemAsync("bednear_access_token");



            setUser(null);

            setIsLoggedIn(false);

            setIsEditing(false);



            navigation.reset({

              index: 0,

              routes: [

                {

                  name: "PhoneLogin",

                  params: undefined,

                },

              ],

            });

          } catch (error) {

            console.error("[BedNear] Logout failed:", error);

            Alert.alert("Error", "Unable to log out. Please try again.");

          }

        },

      },

    ]);

  };



  const getInitial = () => {

    return user?.name?.trim()?.charAt(0)?.toUpperCase() || "U";

  };



  const formatDate = (date?: string) => {

    if (!date) return "Not available";



    const parsedDate = new Date(date);



    if (Number.isNaN(parsedDate.getTime())) {

      return "Not available";

    }



    return parsedDate.toLocaleDateString("en-IN", {

      day: "numeric",

      month: "long",

      year: "numeric",

    });

  };



  const displayRole = (role?: string) => {

    if (!role) return "Member";



    return role.charAt(0) + role.slice(1).toLowerCase();

  };



  const showInfo = (title: string, message: string) => {

    Alert.alert(title, message);

  };



  if (loading) {

    return (

      <SafeAreaView style={styles.safeArea}>

        <View style={styles.loadingContainer}>

          <ActivityIndicator size="large" color="#6330AB" />

          <Text style={styles.loadingText}>Loading your profile...</Text>

        </View>

      </SafeAreaView>

    );

  }



  return (

    <SafeAreaView style={styles.safeArea}>

      <ScrollView

        style={styles.screen}

        contentContainerStyle={styles.content}

        showsVerticalScrollIndicator={false}

      >

        {/* HEADER */}

        <View style={styles.header}>

          <View style={styles.headerText}>

            <Text style={styles.headerEyebrow}>YOUR ACCOUNT</Text>

            <Text style={styles.title}>

              My <Text style={styles.titleAccent}>Profile</Text>

            </Text>

            <Text style={styles.subtitle}>

              Manage your personal information

            </Text>

          </View>



          <View style={styles.headerIcon}>

            <UserRound size={23} color="#FFFFFF" />

          </View>

        </View>



        {/* GUEST PROFILE */}

        {!isLoggedIn || !user ? (

          <>

            <View style={styles.profileCard}>

              <View style={styles.avatar}>

                <UserRound size={37} color="#6330AB" />

              </View>



              <Text style={styles.name}>Welcome to BedNear!</Text>



              <Text style={styles.description}>

                Sign in to manage your profile, save PGs and track your

                enquiries.

              </Text>



              <Pressable

                style={({ pressed }) => [

                  styles.signInButton,

                  pressed && styles.pressed,

                ]}

                onPress={handleSignIn}

              >

                <Text style={styles.signInText}>

                  Sign in with mobile number

                </Text>



                <View style={styles.signInArrow}>

                  <ChevronRight size={17} color="#FFFFFF" />

                </View>

              </Pressable>



              <View style={styles.guestFooter}>

                <ShieldCheck size={15} color="#4B9B6B" />

                <Text style={styles.guestLabel}>

                  Your information stays secure

                </Text>

              </View>

            </View>

          </>

        ) : (

          <>

            {/* LOGGED-IN PROFILE CARD */}

            <View style={styles.profileCard}>

              <View style={styles.avatar}>

                <Text style={styles.avatarInitial}>{getInitial()}</Text>

              </View>



              <Text style={styles.name}>{user.name || "BedNear User"}</Text>



              <View style={styles.roleBadge}>

                <ShieldCheck size={13} color="#6330AB" />

                <Text style={styles.roleBadgeText}>

                  {displayRole(user.role)} Account

                </Text>

              </View>



              <Text style={styles.description}>

                Your BedNear account information

              </Text>



              {!isEditing ? (

                <Pressable

                  style={({ pressed }) => [

                    styles.editButton,

                    pressed && styles.pressed,

                  ]}

                  onPress={handleEdit}

                >

                  <Pencil size={16} color="#FFFFFF" />

                  <Text style={styles.editButtonText}>Edit Profile</Text>

                </Pressable>

              ) : (

                <View style={styles.editActions}>

                  <Pressable

                    style={styles.cancelButton}

                    onPress={handleCancelEdit}

                    disabled={saving}

                  >

                    <X size={16} color="#6330AB" />

                    <Text style={styles.cancelButtonText}>Cancel</Text>

                  </Pressable>



                  <Pressable

                    style={styles.saveButton}

                    onPress={handleSaveProfile}

                    disabled={saving}

                  >

                    {saving ? (

                      <ActivityIndicator color="#FFFFFF" size="small" />

                    ) : (

                      <>

                        <Save size={16} color="#FFFFFF" />

                        <Text style={styles.saveButtonText}>Save Changes</Text>

                      </>

                    )}

                  </Pressable>

                </View>

              )}

            </View>



            {/* PERSONAL INFORMATION */}

            <View style={styles.sectionHeader}>

              <View>

                <Text style={styles.sectionTitle}>Personal Information</Text>

                <Text style={styles.sectionSubtitle}>

                  Your registered account details

                </Text>

              </View>



              <View style={styles.sectionIcon}>

                <UserRound size={19} color="#E87832" />

              </View>

            </View>



            <View style={styles.infoCard}>

              <View style={styles.infoRow}>

                <View style={styles.infoIcon}>

                  <UserRound size={18} color="#6330AB" />

                </View>



                <View style={styles.infoText}>

                  <Text style={styles.infoLabel}>Full Name</Text>

                  {isEditing ? (

                    <TextInput

                      value={name}

                      onChangeText={setName}

                      placeholder="Enter your full name"

                      placeholderTextColor="#A69BAA"

                      style={styles.infoInput}

                      maxLength={100}

                    />

                  ) : (

                    <Text style={styles.infoValue}>

                      {user.name || "Not provided"}

                    </Text>

                  )}

                </View>

              </View>



              <View style={styles.infoDivider} />



              <View style={styles.infoRow}>

                <View style={styles.infoIcon}>

                  <Mail size={18} color="#6330AB" />

                </View>



                <View style={styles.infoText}>

                  <Text style={styles.infoLabel}>Email Address</Text>

                  <Text style={styles.infoValue}>

                    {user.email || "Not provided"}

                  </Text>

                  <Text style={styles.readOnlyLabel}>Registered email</Text>

                </View>

              </View>



              <View style={styles.infoDivider} />



              <View style={styles.infoRow}>

                <View style={styles.infoIcon}>

                  <Phone size={18} color="#E87832" />

                </View>



                <View style={styles.infoText}>

                  <Text style={styles.infoLabel}>Mobile Number</Text>

                  {isEditing ? (

                    <TextInput

                      value={phone}

                      onChangeText={setPhone}

                      placeholder="Enter mobile number"

                      placeholderTextColor="#A69BAA"

                      style={styles.infoInput}

                      keyboardType="phone-pad"

                      maxLength={20}

                    />

                  ) : (

                    <Text style={styles.infoValue}>

                      {user.phone || "Not provided"}

                    </Text>

                  )}

                </View>

              </View>



              <View style={styles.infoDivider} />



              <View style={styles.infoRow}>

                <View style={styles.infoIcon}>

                  <LockKeyhole size={18} color="#6330AB" />

                </View>



                <View style={styles.infoText}>

                  <Text style={styles.infoLabel}>Account Type</Text>

                  <Text style={styles.infoValue}>{displayRole(user.role)}</Text>

                </View>

              </View>



              <View style={styles.infoDivider} />



              <View style={styles.infoRow}>

                <View style={styles.infoIcon}>

                  <CalendarDays size={18} color="#E87832" />

                </View>



                <View style={styles.infoText}>

                  <Text style={styles.infoLabel}>Member Since</Text>

                  <Text style={styles.infoValue}>

                    {formatDate(user.createdAt)}

                  </Text>

                </View>

              </View>

            </View>



            {/* ACCOUNT ACTIONS */}

            {!isEditing && (

              <>

                <View style={styles.sectionHeader}>

                  <View>

                    <Text style={styles.sectionTitle}>Account Settings</Text>

                    <Text style={styles.sectionSubtitle}>

                      Manage your account

                    </Text>

                  </View>



                  <View style={styles.sectionIcon}>

                    <Settings2 size={19} color="#E87832" />

                  </View>

                </View>



                <View style={styles.menuCard}>

                  <MenuRow

                    icon={<ShieldCheck size={20} color="#6330AB" />}

                    title="Privacy & Safety"

                    subtitle="Your privacy and account security"

                    onPress={() =>

                      showInfo(

                        "Privacy & Safety",

                        "Your account information is managed securely by BedNear.",

                      )

                    }

                  />



                  <MenuRow

                    icon={<Bell size={20} color="#E87832" />}

                    title="Notifications"

                    subtitle="Manage your notification preferences"

                    onPress={() => navigation.navigate("NotificationSettings")}

                    last

                  />

                </View>



                <View style={styles.sectionHeader}>

                  <View>

                    <Text style={styles.sectionTitle}>Help & Support</Text>

                    <Text style={styles.sectionSubtitle}>

                      We're here to help you

                    </Text>

                  </View>



                  <View style={styles.sectionIcon}>

                    <HelpCircle size={19} color="#E87832" />

                  </View>

                </View>



                <View style={styles.menuCard}>

                  <MenuRow

                    icon={<HelpCircle size={20} color="#6330AB" />}

                    title="Help & Support"

                    subtitle="Get assistance with BedNear"

                    onPress={() =>

                      showInfo(

                        "Help & Support",

                        "Please contact the BedNear support team for assistance.",

                      )

                    }

                  />



                  <MenuRow

                    icon={<FileText size={20} color="#E87832" />}

                    title="Terms & Conditions"

                    subtitle="Read our terms and policies"

                    onPress={() =>

                      showInfo(

                        "Terms & Conditions",

                        "Terms and conditions will be available soon.",

                      )

                    }

                  />



                  <MenuRow

                    icon={<Info size={20} color="#6330AB" />}

                    title="About BedNear"

                    subtitle="Find your bed. Find your place."

                    onPress={() =>

                      showInfo(

                        "About BedNear",

                        "BedNear helps you discover PG accommodations and find your place.",

                      )

                    }

                    last

                  />

                </View>



                {/* LOGOUT */}

                <Pressable

                  style={({ pressed }) => [

                    styles.logoutButton,

                    pressed && styles.pressed,

                  ]}

                  onPress={handleLogout}

                >

                  <LogOut size={18} color="#D94A4A" />

                  <Text style={styles.logoutText}>Logout</Text>

                </Pressable>

              </>

            )}

          </>

        )}



        {/* GUEST ACTIVITY MENU */}
        {!isLoggedIn && (
          <>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Your Activity</Text>
                <Text style={styles.sectionSubtitle}>
                  Everything in one place
                </Text>
              </View>

              <View style={styles.sectionIcon}>
                <Heart size={19} color="#E87832" />
              </View>
            </View>

            <View style={styles.menuCard}>
              <MenuRow
                icon={<Heart size={20} color="#6330AB" />}
                title="Saved PGs"
                subtitle="View your favourite accommodations"
                onPress={() =>
                  showSignInPrompt(
                    "Your favourite PGs, all in one place",
                    "Sign in to save your favourite PGs and access them anytime, anywhere."
                  )
                }
              />

              <MenuRow
                icon={<MessageSquareText size={20} color="#E87832" />}
                title="My Enquiries"
                subtitle="Track your PG enquiries"
                onPress={() =>
                  showSignInPrompt(
                    "Stay updated on your enquiries",
                    "Sign in to track your PG enquiries and stay connected with accommodation providers."
                  )
                }
              />

              <MenuRow
                icon={<Clock3 size={20} color="#6330AB" />}
                title="Recently Viewed"
                subtitle="Find your recently viewed PGs"
                onPress={() =>
                  showSignInPrompt(
                    "Pick up where you left off",
                    "Sign in to revisit PGs you've recently explored and never lose track of your favourites."
                  )
                }
              />

              <MenuRow
                icon={<Settings2 size={20} color="#E87832" />}
                title="My Preferences"
                subtitle="Manage your accommodation preferences"
                onPress={() =>
                  showSignInPrompt(
                    "Find a PG that feels right",
                    "Sign in to manage your preferences and make your PG search easier."
                  )
                }
                last
              />
            </View>

            {/* SETTINGS & SUPPORT - retained for guest users */}
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Settings & Support</Text>
                <Text style={styles.sectionSubtitle}>
                  We're here to help you
                </Text>
              </View>

              <View style={styles.sectionIcon}>
                <HelpCircle size={19} color="#E87832" />
              </View>
            </View>

            <View style={styles.menuCard}>
              <MenuRow
                icon={<Bell size={20} color="#6330AB" />}
                title="Notifications"
                subtitle="Manage your notifications"
                onPress={() => {
                  if (isLoggedIn) {
                    navigation.navigate("NotificationSettings");
                  } else {
                    showSignInPrompt(
                      "Manage your notifications",
                      "Sign in to choose how BedNear keeps you updated.",
                    );
                  }
                }}
              />

              <MenuRow
                icon={<ShieldCheck size={20} color="#E87832" />}
                title="Privacy & Safety"
                subtitle="Your privacy matters to us"
                onPress={() =>
                  navigation.navigate("PrivacySafety", {
                    page: "privacy",
                  })
                }
              />

              <MenuRow
                icon={<FileText size={20} color="#6330AB" />}
                title="Terms & Privacy"
                subtitle="Read our terms and policies"
                onPress={() =>
                  navigation.navigate("TermsPrivacy", {
                    page: "terms",
                  })
                }
              />

              <MenuRow
                icon={<HelpCircle size={20} color="#E87832" />}
                title="Help & Support"
                subtitle="We are happy to help"
                onPress={() =>
                  navigation.navigate("HelpSupport", {
                    page: "support",
                  })
                }
              />

              <MenuRow
                icon={<Info size={20} color="#6330AB" />}
                title="About BedNear"
                subtitle="Find your bed. Find your place."
                onPress={() =>
                  navigation.navigate("AboutBedNear", {
                    page: "about",
                  })
                }
                last
              />
            </View>
          </>
        )}

        {/* FOOTER */}

        <View style={styles.footer}>

          <Text style={styles.footerLogo}>

            Bed<Text style={styles.footerLogoAccent}>Near</Text>

            <Text style={styles.footerDot}>.</Text>

          </Text>



          <Text style={styles.footerTagline}>

            Find your bed. Find your place.

          </Text>



          <Text style={styles.version}>Version 1.0.0</Text>

        </View>

      </ScrollView>

      {/* SIGN-IN BOTTOM SHEET */}
      <Modal
        visible={!!signInPrompt}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={closeSignInPrompt}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={closeSignInPrompt}
          />

          <View style={styles.signInSheet}>
            <View style={styles.sheetHandle} />

            <Pressable
              style={styles.modalClose}
              onPress={closeSignInPrompt}
              hitSlop={10}
            >
              <X size={19} color="#81758A" />
            </Pressable>

            <View style={styles.sheetIcon}>
              <LockKeyhole size={31} color="#6330AB" />
            </View>

            <Text style={styles.sheetTitle}>
              {signInPrompt?.title}
            </Text>

            <Text style={styles.sheetDescription}>
              {signInPrompt?.description}
            </Text>

            <View style={styles.sheetBenefits}>
              <View style={styles.sheetBenefitRow}>
                <ShieldCheck size={17} color="#4B9B6B" />
                <Text style={styles.sheetBenefitText}>
                  Your account and data stay secure
                </Text>
              </View>

              <View style={styles.sheetBenefitRow}>
                <Heart size={17} color="#E87832" />
                <Text style={styles.sheetBenefitText}>
                  Enjoy a personalized BedNear experience
                </Text>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.sheetSignInButton,
                pressed && styles.pressed,
              ]}
              onPress={continueToSignIn}
            >
              <Text style={styles.sheetSignInText}>
                Sign in with mobile number
              </Text>
              <ChevronRight size={19} color="#FFFFFF" />
            </Pressable>

            <Pressable
              style={styles.sheetCancelButton}
              onPress={closeSignInPrompt}
            >
              <Text style={styles.sheetCancelText}>Maybe later</Text>
            </Pressable>

            <Text style={styles.sheetFooter}>
              Find your bed. Find your place.
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>

  );

};



export default ProfileScreen;
