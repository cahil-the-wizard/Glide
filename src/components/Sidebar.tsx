import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Modal } from 'react-native';
import { Home, Plus, Search, LogOut } from 'lucide-react-native';
import { Logo } from './Logo';
import { Flow } from '../types/database';
import { databaseService } from '../services/database';
import { authService } from '../services/auth';

interface SidebarProps {
  currentScreen?: 'home' | 'newFlow' | 'flowDetail';
  onHomePress?: () => void;
  onNewFlowPress?: () => void;
  onSearchPress?: () => void;
  onFlowPress?: (flowId: string) => void;
  flows: Flow[];
  flowsLoading: boolean;
}

export default function Sidebar({
  currentScreen = 'home',
  onHomePress,
  onNewFlowPress,
  onSearchPress,
  onFlowPress,
  flows,
  flowsLoading
}: SidebarProps) {
  const [hoveredNavItem, setHoveredNavItem] = useState<string | null>(null);
  const [showUserPopover, setShowUserPopover] = useState(false);

  const handleLogout = async () => {
    try {
      await authService.signOut();
      setShowUserPopover(false);
      // Auth state change will be handled by the parent component
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <View style={styles.sidebar}>
      <View style={styles.sidebarContent}>
        {/* Header with logo and settings */}
        <View style={styles.sidebarHeader}>
          <View style={styles.logoContainer}>
            <Logo width={32} color="black" />
          </View>
          <TouchableOpacity style={styles.settingsButton}>
            <Search size={18} color="#717680" />
          </TouchableOpacity>
        </View>

        {/* Navigation */}
        <View style={styles.navigation}>
          <TouchableOpacity
            style={[
              styles.navItem,
              hoveredNavItem === 'home' && styles.navItemHover,
              currentScreen === 'home' && styles.navItemActive
            ]}
            onMouseEnter={() => setHoveredNavItem('home')}
            onMouseLeave={() => setHoveredNavItem(null)}
            onPress={onHomePress}
          >
            <Home size={18} color="#0A0D12" />
            <Text style={styles.navText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.navItem,
              hoveredNavItem === 'newflow' && styles.navItemHover,
              currentScreen === 'newFlow' && styles.navItemActive
            ]}
            onPress={onNewFlowPress}
            onMouseEnter={() => setHoveredNavItem('newflow')}
            onMouseLeave={() => setHoveredNavItem(null)}
          >
            <Plus size={18} color="#0A0D12" />
            <Text style={styles.navText}>New flow</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.navItem,
              hoveredNavItem === 'search' && styles.navItemHover
            ]}
            onMouseEnter={() => setHoveredNavItem('search')}
            onMouseLeave={() => setHoveredNavItem(null)}
            onPress={onSearchPress}
          >
            <Search size={18} color="#0A0D12" />
            <Text style={styles.navText}>Search flows</Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Flows section */}
        <View style={styles.flowsSection}>
          <Text style={styles.sectionHeader}>Flows</Text>
          {flows.map((flow) => (
            <TouchableOpacity
              key={flow.id}
              style={[
                styles.flowNavItem,
                hoveredNavItem === `flow-${flow.id}` && styles.navItemHover
              ]}
              onMouseEnter={() => setHoveredNavItem(`flow-${flow.id}`)}
              onMouseLeave={() => setHoveredNavItem(null)}
              onPress={() => onFlowPress?.(flow.id)}
            >
              <Text style={styles.flowNavText}>{flow.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* User profile */}
      <View style={styles.userProfile}>
        <TouchableOpacity
          style={styles.userButton}
          onPress={() => setShowUserPopover(true)}
        >
          <Image
            source={{ uri: 'https://placehold.co/34x34' }}
            style={styles.avatar}
          />
          <Text style={styles.userName}>Cahil Sankar</Text>
        </TouchableOpacity>

        {/* User Popover Modal */}
        <Modal
          visible={showUserPopover}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowUserPopover(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowUserPopover(false)}
          >
            <View style={styles.popover}>
              <View style={styles.popoverHeader}>
                <Image
                  source={{ uri: 'https://placehold.co/40x40' }}
                  style={styles.popoverAvatar}
                />
                <View>
                  <Text style={styles.popoverName}>Cahil Sankar</Text>
                  <Text style={styles.popoverEmail}>cahil@example.com</Text>
                </View>
              </View>

              <View style={styles.popoverDivider} />

              <TouchableOpacity
                style={styles.popoverMenuItem}
                onPress={handleLogout}
              >
                <LogOut size={18} color="#DC2626" />
                <Text style={styles.popoverMenuText}>Sign out</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 260,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 20,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  sidebarContent: {
    flex: 1,
    gap: 16,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  logoContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsButton: {
    padding: 8,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navigation: {
    gap: 0,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 38,
  },
  navItemHover: {
    backgroundColor: '#E9EAEB',
  },
  navItemActive: {
    backgroundColor: '#E9EAEB',
  },
  navText: {
    color: '#0A0D12',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22.4,
  },
  divider: {
    height: 1,
    backgroundColor: '#D5D7DA',
    marginHorizontal: 8,
  },
  flowsSection: {
    gap: 0,
  },
  sectionHeader: {
    color: '#535862',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 19.6,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  flowNavItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 38,
  },
  flowNavText: {
    color: '#0A0D12',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22.4,
  },
  userProfile: {
    paddingHorizontal: 8,
  },
  userButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 8,
    borderRadius: 8,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#D9D9D9',
  },
  userName: {
    color: '#181D27',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22.4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
  },
  popover: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
    marginLeft: 16,
    marginBottom: 100,
    minWidth: 240,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  popoverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  popoverAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D9D9D9',
  },
  popoverName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  popoverEmail: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  popoverDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  popoverMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  popoverMenuText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#DC2626',
  },
});