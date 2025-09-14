import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Animated, Easing } from 'react-native';
import NewFlowScreen from './src/screens/NewFlowScreen';
import HomeScreenContent from './src/screens/HomeScreenContent';
import FlowDetailScreenContent from './src/screens/FlowDetailScreenContent';
import AuthScreen from './src/screens/AuthScreen';
import Sidebar from './src/components/Sidebar';
import { authService, AuthUser } from './src/services/auth';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'newFlow' | 'flowDetail'>('home');
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const slideAnim = useRef(new Animated.Value(32)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Check for existing auth session
    const checkAuth = async () => {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      setAuthLoading(false);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange((user) => {
      setUser(user);
      setAuthLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const handleNavigateToNewFlow = () => setCurrentScreen('newFlow');

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
        onNewFlowPress={handleNavigateToNewFlow}
        onFlowPress={handleNavigateToFlowDetail}
        refreshTrigger={refreshTrigger}
      />

      <View style={styles.mainContainer}>
        {currentScreen === 'newFlow' ? (
          <NewFlowScreen onBackPress={handleNavigateToHome} onFlowCreated={handleFlowCreated} />
        ) : (
          <>
            {/* Home screen - always rendered when not in newFlow */}
            <HomeScreenContent
              onFlowPress={handleNavigateToFlowDetail}
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
                />
              </Animated.View>
            )}
          </>
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
