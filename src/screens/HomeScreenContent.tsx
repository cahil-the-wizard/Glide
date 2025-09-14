import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Animated } from 'react-native';
import { Search, Clock, ArrowRight } from 'lucide-react-native';
import { Flow } from '../types/database';
import { databaseService } from '../services/database';

interface HomeScreenContentProps {
  onFlowPress?: (flowId: string) => void;
  refreshTrigger?: number;
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
            <Clock size={18} color="#414651" />
            <Text style={styles.stepText}>{flow.step}</Text>
          </View>
          <View style={styles.timeInfo}>
            <Clock size={18} color="#414651" />
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

const getTimeBasedGreeting = (): string => {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return "Glide into your day";
  } else if (hour >= 12 && hour < 17) {
    return "Glide past the midday slump";
  } else if (hour >= 17 && hour < 21) {
    return "Glide toward tomorrow";
  } else {
    return "Glide into calm";
  }
};

export default function HomeScreenContent({ onFlowPress, refreshTrigger }: HomeScreenContentProps) {
  const [searchText, setSearchText] = useState('');
  const [hoveredFlow, setHoveredFlow] = useState<string | null>(null);
  const [flows, setFlows] = useState<FlowWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState(getTimeBasedGreeting());

  useEffect(() => {
    loadFlows();
  }, [refreshTrigger]);

  // Update greeting every minute to catch time period changes
  useEffect(() => {
    const updateGreeting = () => {
      setGreeting(getTimeBasedGreeting());
    };

    // Update immediately and then every minute
    updateGreeting();
    const interval = setInterval(updateGreeting, 60000);

    return () => clearInterval(interval);
  }, []);

  const loadFlows = async () => {
    try {
      setLoading(true);
      const flowsData = await databaseService.getFlows();

      // Transform flows to include progress info
      const flowsWithProgress = await Promise.all(
        flowsData.map(async (flow) => {
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
      console.error('Error loading flows:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header section */}
        <View style={styles.headerSection}>
          <Text style={styles.mainTitle}>{greeting}</Text>
          <View style={styles.searchContainer}>
            <Search size={18} color="#0A0D12" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              placeholderTextColor="#252B37"
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
        </View>

        {/* Flows list */}
        <View style={styles.flowsList}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading your flows...</Text>
            </View>
          ) : flows.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No flows yet. Create your first flow to get started!</Text>
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingHorizontal: 40,
    paddingTop: 64,
    paddingBottom: 40,
  },
  scrollContent: {
    flex: 1,
  },
  headerSection: {
    width: 600,
    alignSelf: 'center',
    paddingTop: 32,
    paddingBottom: 64,
    alignItems: 'center',
    gap: 28,
  },
  mainTitle: {
    color: 'black',
    fontSize: 32,
    fontWeight: '400',
    lineHeight: 38.4,
    textAlign: 'center',
  },
  searchContainer: {
    width: '100%',
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
    width: 600,
    alignSelf: 'center',
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
    fontWeight: '500',
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
});