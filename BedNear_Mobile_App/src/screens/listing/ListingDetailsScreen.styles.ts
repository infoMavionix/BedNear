
import { StyleSheet } from 'react-native';
import { colors, radius } from '../../constants/theme';

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFF9F3',
  },

  content: {
    paddingBottom: 40,
  },

  heroImage: {
    width: '100%',
    height: 290,
    backgroundColor: '#EDE5FA',
  },

  body: {
    paddingHorizontal: 20,
    paddingTop: 22,
  },

  name: {
    flex: 1,
    fontSize: 25,
    lineHeight: 32,
    fontWeight: '800',
    color: '#241D2B',
    letterSpacing: -0.5,
  },

  location: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: '#77717E',
    marginTop: 0,
  },

  priceBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEE6F2',
    borderRadius: 20,
    padding: 19,
    marginTop: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    elevation: 2,
    shadowColor: '#30203C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },

  price: {
    fontSize: 23,
    fontWeight: '900',
    color: '#642BB2',
    letterSpacing: -0.5,
  },

  caption: {
    fontSize: 12,
    color: '#89828F',
    marginTop: 6,
    fontWeight: '500',
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#28212F',
    marginTop: 27,
    marginBottom: 13,
    letterSpacing: -0.3,
  },

  description: {
    fontSize: 14,
    lineHeight: 23,
    color: '#706978',
  },

  amenities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  amenity: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9E0F2',
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 11,
    color: '#51258F',
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
  },

  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 23,
  },

  flexButton: {
    flex: 1,
  },
});
