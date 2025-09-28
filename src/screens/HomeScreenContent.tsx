import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { Flow } from '../types/database';
import { databaseService } from '../services/database';
import ChatPanel from '../components/ChatPanel';
import TodaysPath from '../components/TodaysPath';

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



export default function HomeScreenContent({
  onFlowPress,
  onFlowCreated,
  flows: rawFlows,
  flowsLoading,
  initialInputText,
  user
}: HomeScreenContentProps) {
  const [flows, setFlows] = useState<FlowWithProgress[]>([]);

  // Chat panel state
  const [isChatPanelVisible, setIsChatPanelVisible] = useState(false);


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


  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* Today's Path Section */}
        <View style={styles.todaysPathSection}>
          <TodaysPath
            flows={rawFlows}
            onStepPress={(flowId, stepId) => onFlowPress?.(flowId)}
          />
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
  // Today's Path Section Styles
  todaysPathSection: {
    width: Math.min(680, screenWidth - 80),
    alignSelf: 'center',
    marginTop: 0,
    marginBottom: 32,
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