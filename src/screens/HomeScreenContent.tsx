import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Animated } from 'react-native';
import { Search, Clock, ArrowRight } from 'lucide-react-native';

const flowsData = [
  { id: 1, title: 'Job Application', step: 'Step 2 of 5: Draft outline', time: '10 min' },
  { id: 2, title: 'Kitchen Declutter', step: 'Step 2 of 5: Draft outline', time: '15 min' },
  { id: 3, title: 'Weekly Groceries', step: 'Step 2 of 5: Draft outline', time: '20 min' },
  { id: 4, title: 'Write Blog Post', step: 'Step 2 of 5: Draft outline', time: '20 min' },
  { id: 5, title: 'Plan Weekend Trip', step: 'Step 2 of 5: Draft outline', time: '5 min' },
  { id: 6, title: 'Budget Planning', step: 'Step 2 of 5: Draft outline', time: '15 min' },
  { id: 7, title: 'Work Opportunity', step: 'Step 2 of 5: Draft outline', time: '25 min' },
];

interface HomeScreenContentProps {
  onFlowPress?: (flowId: string) => void;
}

const FlowItem = ({ flow, index, isHovered, onHover, onLeave, onPress }: {
  flow: typeof flowsData[0];
  index: number;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onPress?: () => void;
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
        index === flowsData.length - 1 && styles.lastFlowItem
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

export default function HomeScreenContent({ onFlowPress }: HomeScreenContentProps) {
  const [searchText, setSearchText] = useState('');
  const [hoveredFlow, setHoveredFlow] = useState<number | null>(null);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header section */}
        <View style={styles.headerSection}>
          <Text style={styles.mainTitle}>Glide through your morning</Text>
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
          {flowsData.map((flow, index) => (
            <FlowItem
              key={flow.id}
              flow={flow}
              index={index}
              isHovered={hoveredFlow === flow.id}
              onHover={() => setHoveredFlow(flow.id)}
              onLeave={() => setHoveredFlow(null)}
              onPress={() => onFlowPress?.(flow.id.toString())}
            />
          ))}
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
});