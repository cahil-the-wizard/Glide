import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Animated, Easing } from 'react-native';
import HomeScreenContent from './src/screens/HomeScreenContent';
import FlowDetailScreenContent from './src/screens/FlowDetailScreenContent';
import AuthScreen from './src/screens/AuthScreen';
import Sidebar from './src/components/Sidebar';
import { authService, AuthUser } from './src/services/auth';
import { databaseService } from './src/services/database';
import { Flow } from './src/types/database';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'flowDetail'>('home');
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);
  const [editFlowText, setEditFlowText] = useState<string | undefined>(undefined);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [flowsLoading, setFlowsLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const sidebarWidthAnim = useRef(new Animated.Value(260)).current;
  const slideAnim = useRef(new Animated.Value(32)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Check for existing auth session
    const checkAuth = async () => {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        setRefreshTrigger(prev => prev + 1);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange(async (user) => {
      if (user) {
        // Ensure onboarding flow exists when user logs in
        await authService.ensureOnboardingFlow(user.id);
        setRefreshTrigger(prev => prev + 1);
      }
      setUser(user);
      setAuthLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Load flows whenever refresh trigger changes
  useEffect(() => {
    if (user) {
      loadFlows();
    }
  }, [refreshTrigger, user]);

  // Auto-navigate new users to Getting started flow (only once)
  const [hasAutoNavigated, setHasAutoNavigated] = useState(false);

  useEffect(() => {
    if (user && flows.length > 0 && currentScreen === 'home' && !hasAutoNavigated) {
      // Check if user only has the onboarding flow (new user)
      const onboardingFlow = flows.find(flow => flow.title === "👋 Getting started in Glide");

      if (onboardingFlow && flows.length === 1) {
        // New user with only the onboarding flow - auto navigate
        setHasAutoNavigated(true);
        handleNavigateToFlowDetail(onboardingFlow.id);
      }
    }
  }, [flows, user, currentScreen, hasAutoNavigated]);

  const loadFlows = async () => {
    if (!user) return;

    try {
      setFlowsLoading(true);
      const flowsData = await databaseService.getFlows();
      setFlows(flowsData);
    } catch (error) {
      console.error('Error loading flows:', error);
    } finally {
      setFlowsLoading(false);
    }
  };


  const handleFlowCreated = (flowId: string) => {
    // Trigger refresh of flows list
    setRefreshTrigger(prev => prev + 1);
    handleNavigateToFlowDetail(flowId);
  };

  const handleNavigateToHome = () => {
    if (currentScreen === 'flowDetail') {
      // Fade out and slide out to the right
      setIsAnimating(true);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 450,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(slideAnim, {
          toValue: 32,
          duration: 450,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]).start(() => {
        setCurrentScreen('home');
        setIsAnimating(false);
        // Clear edit flow text after a brief delay to allow the input to update
        setTimeout(() => setEditFlowText(undefined), 100);
      });
    } else {
      setCurrentScreen('home');
    }
  };

  const handleNavigateToFlowDetail = (flowId: string) => {
    setSelectedFlowId(flowId);
    setIsAnimating(true);

    // Start from the right with fade
    slideAnim.setValue(32);
    fadeAnim.setValue(0);
    setCurrentScreen('flowDetail');

    // Fade in and slide in from the right
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start(() => {
      setIsAnimating(false);
    });
  };

  const handleFlowDeleted = () => {
    // Refresh flows list and navigate back to home
    setRefreshTrigger(prev => prev + 1);
    handleNavigateToHome();
  };

  const handleEditFlow = (flowTitle: string) => {
    // Set the flow title as initial input text and navigate to home
    setEditFlowText(flowTitle);
    handleNavigateToHome();
  };

  const handleToggleSidebar = () => {
    const toValue = sidebarCollapsed ? 260 : 64;

    Animated.timing(sidebarWidthAnim, {
      toValue,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Show auth screen if not authenticated
  if (authLoading) {
    return <View style={styles.container} />; // Loading state
  }

  if (!user) {
    return <AuthScreen onAuthSuccess={() => {/* Auth state will update automatically */}} />;
  }

  return (
    <View style={styles.container}>
      <Sidebar
        currentScreen={currentScreen}
        onHomePress={handleNavigateToHome}
        onFlowPress={handleNavigateToFlowDetail}
        flows={flows}
        flowsLoading={flowsLoading}
        collapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
        animatedWidth={sidebarWidthAnim}
      />

      <View style={styles.mainContainer}>
        {/* Home screen - always rendered */}
        <HomeScreenContent
          onFlowPress={handleNavigateToFlowDetail}
          onFlowCreated={handleFlowCreated}
          flows={flows}
          flowsLoading={flowsLoading}
          initialInputText={editFlowText}
        />

        {/* Flow detail overlay - only when on flowDetail screen */}
        {(currentScreen === 'flowDetail' || isAnimating) && selectedFlowId && (
          <Animated.View
            style={[
              styles.animatedContainer,
              styles.overlay,
              {
                opacity: fadeAnim,
                transform: [{
                  translateX: slideAnim
                }]
              }
            ]}
          >
            <FlowDetailScreenContent
              flowId={selectedFlowId}
              onBackPress={handleNavigateToHome}
              onFlowDeleted={handleFlowDeleted}
              onEditFlow={handleEditFlow}
            />
          </Animated.View>
        )}
      </View>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  mainContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  animatedContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
  },
});
