import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import {
  CheckCheck,
  ShieldCheck,
  Bell,
  ChevronRight,
  X,
} from 'lucide-react-native';

type InterestedSuccessModalProps = {
  visible: boolean;
  onClose: () => void;
  onViewEnquiries: () => void;
};

export default function InterestedSuccessModal({
  visible,
  onClose,
  onViewEnquiries,
}: InterestedSuccessModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close success message"
        />

        <View
          style={styles.sheet}
          accessibilityViewIsModal
        >
          <View style={styles.handle} />

          <Pressable
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <X size={19} color="#81758A" />
          </Pressable>

          <View style={styles.successIcon}>
            <CheckCheck size={38} color="#239B59" />
          </View>

          <Text style={styles.title}>
            Interest Submitted!
          </Text>

          <Text style={styles.description}>
            Your interest has been successfully shared with the
            property owner.
          </Text>

          <View style={styles.infoCard}>
            <View style={styles.infoHeading}>
              <ShieldCheck size={19} color="#6330AB" />
              <Text style={styles.infoHeadingText}>
                What happens next?
              </Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.smallIcon}>
                <CheckCheck size={17} color="#4B9B6B" />
              </View>
              <Text style={styles.infoText}>
                Your enquiry has been recorded successfully.
              </Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.smallIcon}>
                <Bell size={17} color="#6330AB" />
              </View>
              <Text style={styles.infoText}>
                Track your enquiry and its updates in My Enquiries.
              </Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.primaryButtonPressed,
            ]}
            onPress={onViewEnquiries}
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>
              View My Enquiries
            </Text>
            <ChevronRight size={19} color="#FFFFFF" />
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.secondaryButtonPressed,
            ]}
            onPress={onClose}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryButtonText}>
              Continue Exploring PGs
            </Text>
          </Pressable>

          <Text style={styles.footer}>
            Find your bed. Find your place.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(25, 15, 35, 0.48)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 30,
    alignItems: 'center',
  },
  handle: {
    width: 42,
    height: 5,
    borderRadius: 5,
    backgroundColor: '#DED9E4',
    marginBottom: 22,
  },
  closeButton: {
    position: 'absolute',
    right: 22,
    top: 18,
    padding: 7,
    backgroundColor: '#F5F2F8',
    borderRadius: 20,
  },
  successIcon: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#E9F8EF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 18,
  },
  title: {
    fontSize: 23,
    fontWeight: '800',
    color: '#25202B',
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: '#77717F',
    textAlign: 'center',
    marginTop: 9,
    marginBottom: 23,
    paddingHorizontal: 8,
  },
  infoCard: {
    width: '100%',
    backgroundColor: '#F7F3FC',
    borderRadius: 16,
    padding: 17,
    marginBottom: 22,
  },
  infoHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 16,
  },
  infoHeadingText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#352B40',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 13,
    gap: 10,
  },
  smallIcon: {
    width: 27,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: '#62596B',
  },
  primaryButton: {
    width: '100%',
    minHeight: 54,
    backgroundColor: '#6330AB',
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  primaryButtonPressed: {
    opacity: 0.88,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  secondaryButtonPressed: {
    opacity: 0.65,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6330AB',
  },
  footer: {
    fontSize: 11,
    color: '#A69BAA',
    marginTop: 3,
  },
});
