import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Animated, ActivityIndicator, Dimensions, Alert, ImageBackground, Image } from 'react-native';
import { Search, ArrowRight, Plus, Mic } from 'lucide-react-native';
import { Flow } from '../types/database';
import { databaseService } from '../services/database';
import ChatPanel from '../components/ChatPanel';

const { width: screenWidth } = Dimensions.get('window');


interface HomeScreenContentProps {
  onFlowPress?: (flowId: string) => void;
  onFlowCreated?: (flowId: string) => void;
  flows: Flow[];
  flowsLoading: boolean;
  initialInputText?: string;
  user?: { firstName?: string; lastName?: string } | null;
}

interface FlowWithProgress {
  id: string;
  title: string;
  step: string;
  time: string;
}

const FlowItem = ({ flow, index, isHovered, onHover, onLeave, onPress, totalFlows }: {
  flow: FlowWithProgress;
  index: number;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onPress?: () => void;
  totalFlows: number;
}) => {
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(4))[0];

  React.useEffect(() => {
    if (isHovered) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: false,
        }),
        Animated.timing(slideAnim, {
          toValue: 4,
          duration: 150,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [isHovered]);

  return (
    <TouchableOpacity
      style={[
        styles.flowItem,
        index === 0 && styles.firstFlowItem,
        index === totalFlows - 1 && styles.lastFlowItem
      ]}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onPress={onPress}
    >
      <View style={styles.flowContent}>
        <Text style={styles.flowTitle}>{flow.title}</Text>
        <View style={styles.flowMeta}>
          <View style={styles.stepInfo}>
            <Text style={styles.stepText}>{flow.step}</Text>
          </View>
          <View style={styles.timeInfo}>
            <Text style={styles.timeText}>{flow.time}</Text>
          </View>
        </View>
      </View>
      <View style={styles.arrowContainer}>
        <Animated.View
          style={[
            styles.arrowWrapper,
            {
              opacity: fadeAnim,
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          <ArrowRight size={24} color="#717680" />
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
};

const getTimeBasedGreeting = (firstName?: string): string => {
  const hour = new Date().getHours();
  const name = firstName ? `, ${firstName}` : '';

  if (hour >= 5 && hour < 12) {
    return `Good morning${name} 🌅`;
  } else if (hour >= 12 && hour < 17) {
    return `Good afternoon${name} ☀️`;
  } else if (hour >= 17 && hour < 21) {
    return `Good evening${name} 🌝`;
  } else {
    return `Good night${name} 🌙`;
  }
};

export default function HomeScreenContent({
  onFlowPress,
  onFlowCreated,
  flows: rawFlows,
  flowsLoading,
  initialInputText,
  user
}: HomeScreenContentProps) {
  const [searchText, setSearchText] = useState('');
  const [hoveredFlow, setHoveredFlow] = useState<string | null>(null);
  const [flows, setFlows] = useState<FlowWithProgress[]>([]);
  const [greeting, setGreeting] = useState(getTimeBasedGreeting(user?.firstName));

  // New flow input states
  const [inputText, setInputText] = useState(initialInputText || '');
  const [isLoading, setIsLoading] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<TextInput>(null);

  // Weather states
  const [weather, setWeather] = useState<{
    temperature: number;
    condition: string;
    location: string;
    loading: boolean;
  }>({
    temperature: 25,
    condition: 'Partly cloudy',
    location: 'Washington, DC',
    loading: false,
  });

  // Chat panel state
  const [isChatPanelVisible, setIsChatPanelVisible] = useState(false);

  // Auto-focus the input when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Update input text when initialInputText changes
  useEffect(() => {
    if (initialInputText !== undefined) {
      setInputText(initialInputText);
    }
  }, [initialInputText]);


  // Update greeting every minute to catch time period changes
  useEffect(() => {
    const updateGreeting = () => {
      setGreeting(getTimeBasedGreeting(user?.firstName));
    };

    // Update immediately and then every minute
    updateGreeting();
    const interval = setInterval(updateGreeting, 60000);

    return () => clearInterval(interval);
  }, [user?.firstName]);

  // Transform flows when rawFlows changes
  useEffect(() => {
    const loadFlowsWithProgress = async () => {
      if (!rawFlows.length) {
        setFlows([]);
        return;
      }

      try {
        const flowsWithProgress = await Promise.all(
          rawFlows.map(async (flow) => {
            try {
              const stats = await databaseService.getFlowStats(flow.id);
              const nextStepNumber = stats.completedSteps + 1;
              return {
                id: flow.id,
                title: flow.title,
                step: `Step ${nextStepNumber} of ${stats.totalSteps}`,
                time: '5 min' // Default time estimate
              };
            } catch (error) {
              return {
                id: flow.id,
                title: flow.title,
                step: 'Ready to start',
                time: '5 min'
              };
            }
          })
        );

        setFlows(flowsWithProgress);
      } catch (error) {
        console.error('Error loading flow progress:', error);
      }
    };

    loadFlowsWithProgress();
  }, [rawFlows]);

  const handleSubmit = async () => {
    if (!inputText.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const flow = await databaseService.createFlowFromTask(
        inputText.trim(),
        (message: string) => setProgressMessage(message)
      );

      setInputText('');
      onFlowCreated?.(flow.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create flow');
    } finally {
      setIsLoading(false);
      setProgressMessage('');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{greeting}</Text>
        </View>

        {/* New Flow Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputField}>
            <View style={styles.inputRow}>
              <TextInput
                ref={inputRef}
                style={styles.textInput}
                placeholder="What's something you're struggling to start?"
                placeholderTextColor="#A4A7AE"
                value={inputText}
                onChangeText={setInputText}
                onKeyPress={(e) => {
                  if (e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                multiline
                editable={!isLoading}
                selectionColor="transparent"
              />
            </View>
            <View style={styles.actionButtons}>
              <View style={styles.leftButtons}>
                <TouchableOpacity style={styles.button}>
                  <Plus size={18} color="#717680" />
                </TouchableOpacity>
              </View>
              <View style={styles.rightButtons}>
                <TouchableOpacity style={styles.button}>
                  <Mic size={18} color="#717680" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.primaryButton]}
                  onPress={handleSubmit}
                  disabled={!inputText.trim() || isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <ArrowRight size={18} color="white" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Loading and Progress Messages */}
          {isLoading && progressMessage && (
            <View style={styles.progressContainer}>
              <ActivityIndicator size="small" color="#0A0D12" />
              <Text style={styles.progressText}>{progressMessage}</Text>
            </View>
          )}

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>

        {/* Cards Section */}
        <View style={styles.cardsSection}>
          <View style={styles.cardsGrid}>
            {/* 7 Day Streak Card */}
            <ImageBackground
              source={require('../../assets/plufow-le-studio-8LhVNaTYBfI-unsplash.jpg')}
              style={styles.newCard}
              imageStyle={styles.newCardImage}
            >
              <Image
                source={require('../../assets/flame.png')}
                style={styles.iconImage}
                resizeMode="contain"
              />
              <Text style={styles.newCardLabel}>7 day streak</Text>
            </ImageBackground>

            {/* Plan My Day Card */}
            <ImageBackground
              source={require('../../assets/zaky-jundana-5lRygFO1JEE-unsplash.jpg')}
              style={styles.newCard}
              imageStyle={styles.newCardImage}
            >
              <Image
                source={require('../../assets/calendar.png')}
                style={styles.iconImage}
                resizeMode="contain"
              />
              <Text style={styles.newCardLabel}>Plan my day</Text>
            </ImageBackground>

            {/* Pomodoro Card */}
            <ImageBackground
              source={require('../../assets/from-nio-fCk9k-vrcZM-unsplash.jpg')}
              style={styles.newCard}
              imageStyle={styles.newCardImage}
            >
              <Image
                source={require('../../assets/clock-fading.png')}
                style={styles.iconImage}
                resizeMode="contain"
              />
              <Text style={styles.newCardLabel}>Pomodoro</Text>
            </ImageBackground>

            {/* Ask Glide Card */}
            <TouchableOpacity onPress={() => setIsChatPanelVisible(true)}>
              <ImageBackground
                source={require('../../assets/zaky-jundana-6grFyaQVt24-unsplash.jpg')}
                style={styles.newCard}
                imageStyle={styles.newCardImage}
              >
                <Image
                  source={require('../../assets/line-squiggle.png')}
                  style={styles.iconImage}
                  resizeMode="contain"
                />
                <Text style={styles.newCardLabel}>Ask Glide</Text>
              </ImageBackground>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Flows Section */}
        <View style={styles.recentFlowsSection}>
          <Text style={styles.recentFlowsHeading}>Recent flows</Text>
          <View style={styles.recentFlowsContainer}>
            <View style={styles.recentFlowsList}>
              {flowsLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#0A0D12" />
                  <Text style={styles.loadingText}>Loading your flows...</Text>
                </View>
              ) : flows.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No flows yet. Create your first flow above!</Text>
                </View>
              ) : (
                flows.map((flow, index) => (
                  <TouchableOpacity
                    key={flow.id}
                    style={[
                      styles.recentFlowItem,
                      index === flows.length - 1 && styles.lastRecentFlowItem
                    ]}
                    onPress={() => onFlowPress?.(flow.id)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#F0F0F0';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <View style={styles.recentFlowContent}>
                      <Text style={styles.recentFlowTitle}>{flow.title}</Text>
                      <View style={styles.recentFlowMeta}>
                        <View style={styles.recentFlowMetaItem}>
                          <Text style={styles.recentFlowMetaText}>{flow.step}</Text>
                        </View>
                        <View style={styles.recentFlowMetaItem}>
                          <Text style={styles.recentFlowMetaText}>{flow.time}</Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>
        </View>

{/* Flows List Section - Hidden */}
        {false && (
          <View style={styles.flowsSection}>
            <Text style={styles.flowsHeading}>My flows</Text>
            <View style={styles.flowsList}>
              {flowsLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#0A0D12" />
                  <Text style={styles.loadingText}>Loading your flows...</Text>
                </View>
              ) : flows.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No flows yet. Create your first flow above!</Text>
                </View>
              ) : (
                flows.map((flow, index) => (
                  <FlowItem
                    key={flow.id}
                    flow={flow}
                    index={index}
                    isHovered={hoveredFlow === flow.id}
                    onHover={() => setHoveredFlow(flow.id)}
                    onLeave={() => setHoveredFlow(null)}
                    onPress={() => onFlowPress?.(flow.id)}
                    totalFlows={flows.length}
                  />
                ))
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Chat Panel */}
      <ChatPanel
        isVisible={isChatPanelVisible}
        onClose={() => setIsChatPanelVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollContent: {
    paddingHorizontal: 40,
    paddingTop: 64,
    paddingBottom: 40,
  },
  header: {
    width: Math.min(680, screenWidth - 80),
    alignSelf: 'center',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 28,
    paddingBottom: 44,
  },
  title: {
    textAlign: 'center',
    color: 'black',
    fontSize: 32,
    fontWeight: '500',
    lineHeight: 38.4,
    maxWidth: 600,
  },
  inputContainer: {
    width: Math.min(680, screenWidth - 80),
    alignSelf: 'center',
    backgroundColor: 'white',
    shadowColor: '#101828',
    shadowOffset: {
      width: 0,
      height: 16,
    },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 3,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D9D9D9',
    overflow: 'hidden',
    marginBottom: 0,
  },
  inputField: {
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: 'white',
    flexDirection: 'column',
    gap: 16,
  },
  inputRow: {
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22.4,
    color: 'black',
    minHeight: 22,
    paddingVertical: 0,
    paddingHorizontal: 0,
    outlineWidth: 0,
    outlineStyle: 'none',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftButtons: {
    width: 179.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  button: {
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    width: 42,
    height: 42,
  },
  primaryButton: {
    backgroundColor: '#0A0D12',
    borderWidth: 1,
    borderColor: '#2C2C2C',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  progressText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '400',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
  },
  flowsSection: {
    width: Math.min(680, screenWidth - 80),
    alignSelf: 'center',
  },
  flowsHeading: {
    fontSize: 16,
    fontWeight: '400',
    color: '#0A0D12',
    marginBottom: 24,
    textAlign: 'left',
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 24,
  },
  sectionHeader: {
    color: 'black',
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 28.8,
  },
  searchContainer: {
    minWidth: 300,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#F5F5F5',
    borderRadius: 38,
  },
  searchInput: {
    flex: 1,
    color: '#252B37',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22.4,
  },
  flowsList: {
    width: '100%',
  },
  flowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderColor: '#E9EAEB',
  },
  firstFlowItem: {
    borderTopWidth: 1,
  },
  lastFlowItem: {
    borderBottomWidth: 1,
  },
  flowContent: {
    flex: 1,
    gap: 4,
  },
  arrowContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  flowTitle: {
    color: 'black',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22.4,
  },
  flowMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  stepInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stepText: {
    color: '#252B37',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 19.6,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    color: '#252B37',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 19.6,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '400',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '400',
    textAlign: 'center',
  },
  // Cards Section Styles
  cardsSection: {
    width: Math.min(680, screenWidth - 80),
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 64,
  },
  cardsGrid: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  newCard: {
    width: (Math.min(680, screenWidth - 80) - 36) / 4,
    height: 160,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    overflow: 'hidden',
  },
  newCardImage: {
    borderRadius: 16,
  },
  iconContainer: {
    width: 47,
    height: 47,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: 'rgba(0, 0, 0, 0.13)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconImage: {
    width: 44,
    height: 44,
  },
  newCardLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22.4,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  // Recent Flows Section Styles
  recentFlowsSection: {
    width: Math.min(680, screenWidth - 80),
    alignSelf: 'center',
    marginTop: 24,
    gap: 12,
  },
  recentFlowsHeading: {
    color: '#535862',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 19.6,
  },
  recentFlowsContainer: {
    width: Math.min(600, screenWidth - 80),
    paddingHorizontal: 28,
    paddingVertical: 12,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    overflow: 'hidden',
  },
  recentFlowsList: {
    width: '100%',
  },
  recentFlowItem: {
    height: 86,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E9EAEB',
    justifyContent: 'center',
  },
  lastRecentFlowItem: {
    borderBottomWidth: 0,
  },
  recentFlowContent: {
    gap: 4,
  },
  recentFlowTitle: {
    color: '#181D27',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22.4,
  },
  recentFlowMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  recentFlowMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recentFlowMetaText: {
    color: '#252B37',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 19.6,
  },
});