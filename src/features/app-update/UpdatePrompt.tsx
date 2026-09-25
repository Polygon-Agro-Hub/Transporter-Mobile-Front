import React from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import type { UpdateMessages } from './updatePolicy';

const { width } = Dimensions.get('window');

const BRAND = {
  yellow: '#F7CA21',
  yellowLight: '#FFF8D6',
  yellowDark: '#D4A800',
  darkText: '#181A20',
  grayText: '#6C757D',
  grayLight: '#F4F5F7',
  border: '#E8ECEF',
  redAccent: '#EF4444',
  redLight: '#FEE2E2',
  greenAccent: '#10B981',
};

const DEFAULT_TEXT: Required<UpdateMessages> = {
  softTitle: 'New Version Available! 🚀',
  softMessage: 'A new and improved version of GoVi Transport is ready for you. Update now for the best experience.',
  forceTitle: 'Update Required ⚠️',
  forceMessage: 'Your current app version is out of date and no longer supported. Please update immediately to continue using GoVi Transport.',
  updateButton: 'Update on Google Play',
  laterButton: 'Maybe Later',
};

export interface UpdatePromptProps {
  visible: boolean;
  mode: 'soft' | 'force';
  installedVersion: string;
  latestVersion: string;
  messages?: UpdateMessages;
  onUpdate: () => void;
  onLater: () => void;
}

export function UpdatePrompt({
  visible,
  mode,
  installedVersion,
  latestVersion,
  messages,
  onUpdate,
  onLater,
}: UpdatePromptProps) {
  const isDark = useColorScheme() === 'dark';
  const text = { ...DEFAULT_TEXT, ...messages };
  const isForce = mode === 'force';

  const cardBg = isDark ? '#1F242C' : '#FFFFFF';
  const primaryTextColor = isDark ? '#F9FAFB' : '#181A20';
  const secondaryTextColor = isDark ? '#9CA3AF' : '#64748B';
  const chipBg = isDark ? '#2B323D' : '#F8FAFC';
  const chipBorder = isDark ? '#3E4756' : '#E2E8F0';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={isForce ? () => {} : onLater}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: cardBg,
              borderColor: isDark ? '#333B48' : '#F0F2F5',
            },
          ]}
        >
          {/* Top Decorative Header */}
          <View style={styles.headerContainer}>
            <View
              style={[
                styles.iconCircleOuter,
                { backgroundColor: isForce ? BRAND.redLight : BRAND.yellowLight },
              ]}
            >
              <View
                style={[
                  styles.iconCircleInner,
                  { backgroundColor: isForce ? BRAND.redAccent : BRAND.yellow },
                ]}
              >
                {isForce ? (
                  <Ionicons name="warning" size={32} color="#FFFFFF" />
                ) : (
                  <MaterialCommunityIcons name="rocket-launch" size={32} color="#181A20" />
                )}
              </View>
            </View>

            {/* Optional Close Button on Soft Mode */}
            {!isForce && (
              <Pressable
                onPress={onLater}
                hitSlop={12}
                style={({ pressed }) => [
                  styles.closeButton,
                  { backgroundColor: isDark ? '#2E3642' : '#F1F5F9', opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Ionicons name="close" size={18} color={secondaryTextColor} />
              </Pressable>
            )}
          </View>

          {/* Title & Tag */}
          <View style={styles.textSection}>
            <View style={styles.tagContainer}>
              <Text
                style={[
                  styles.tagText,
                  {
                    color: isForce ? BRAND.redAccent : '#9A7400',
                    backgroundColor: isForce ? BRAND.redLight : BRAND.yellowLight,
                  },
                ]}
              >
                {isForce ? 'ACTION REQUIRED' : 'NEW RELEASE'}
              </Text>
            </View>

            <Text style={[styles.title, { color: primaryTextColor }]}>
              {isForce ? text.forceTitle : text.softTitle}
            </Text>

            <Text style={[styles.message, { color: secondaryTextColor }]}>
              {isForce ? text.forceMessage : text.softMessage}
            </Text>
          </View>

          {/* Version Transition Chip */}
          <View style={[styles.versionRow, { backgroundColor: chipBg, borderColor: chipBorder }]}>
            <View style={styles.versionCol}>
              <Text style={styles.versionLabel}>Current</Text>
              <Text style={[styles.versionValue, { color: secondaryTextColor }]}>
                v{installedVersion}
              </Text>
            </View>

            <View style={styles.arrowContainer}>
              <Ionicons name="arrow-forward" size={18} color={BRAND.yellowDark} />
            </View>

            <View style={styles.versionCol}>
              <Text style={styles.versionLabel}>Latest</Text>
              <Text style={[styles.versionValueHighlight, { color: BRAND.yellowDark }]}>
                v{latestVersion}
              </Text>
            </View>
          </View>

          {/* Highlights List */}
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={18} color={BRAND.greenAccent} />
              <Text style={[styles.featureText, { color: secondaryTextColor }]}>
                Enhanced delivery workflow & speed
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={18} color={BRAND.greenAccent} />
              <Text style={[styles.featureText, { color: secondaryTextColor }]}>
                Important bug fixes & system security
              </Text>
            </View>
          </View>

          {/* High Priority Action Buttons */}
          <View style={styles.actionsContainer}>
            <Pressable
              accessibilityRole="button"
              onPress={onUpdate}
              style={({ pressed }) => [
                styles.primaryBtn,
                { backgroundColor: BRAND.yellow, opacity: pressed ? 0.9 : 1 },
              ]}
            >
              <View style={styles.primaryBtnContent}>
                <FontAwesome5
                  name={Platform.OS === 'ios' ? 'app-store-ios' : 'google-play'}
                  size={20}
                  color="#181A20"
                />
                <Text style={styles.primaryBtnText}>
                  {isForce ? 'Update Now to Continue' : 'Update Now'}
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#181A20" />
              </View>
            </Pressable>

            {!isForce && (
              <Pressable
                accessibilityRole="button"
                onPress={onLater}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.secondaryBtn,
                  { opacity: pressed ? 0.6 : 1 },
                ]}
              >
                <Text style={[styles.secondaryBtnText, { color: secondaryTextColor }]}>
                  {text.laterButton}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 15, 26, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: Math.min(width - 32, 380),
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 14,
  },
  headerContainer: {
    width: '100%',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 12,
  },
  iconCircleOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  closeButton: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textSection: {
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  tagContainer: {
    marginBottom: 8,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.2,
    marginBottom: 6,
  },
  message: {
    fontSize: 13.5,
    lineHeight: 19,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  versionRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  versionCol: {
    alignItems: 'center',
  },
  versionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  versionValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  versionValueHighlight: {
    fontSize: 14,
    fontWeight: '800',
  },
  arrowContainer: {
    paddingHorizontal: 8,
  },
  featuresContainer: {
    width: '100%',
    gap: 8,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 12.5,
    fontWeight: '500',
  },
  actionsContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  primaryBtn: {
    width: '100%',
    minHeight: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#181A20',
    letterSpacing: 0.2,
  },
  secondaryBtn: {
    width: '100%',
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
