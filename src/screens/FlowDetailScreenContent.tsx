import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking, ActivityIndicator } from 'react-native';
import { ArrowLeft, Copy, MoreHorizontal, Check, Split } from 'lucide-react-native';
import { Flow, Step } from '../types/database';
import { databaseService } from '../services/database';

interface FlowDetailScreenContentProps {
  flowId: string;
  onBackPress?: () => void;
}

const StepItem = ({ step, isLast, onToggleComplete }: {
  step: Step;
  isLast: boolean;
  onToggleComplete?: (stepId: string, isCompleted: boolean) => void;
}) => {
  const getStepIcon = () => {
    if (step.is_completed) {
      return (
        <TouchableOpacity
          style={styles.stepIconComplete}
          onPress={() => onToggleComplete?.(step.id, false)}
        >
          <Check size={12} color="white" strokeWidth={2} />
        </TouchableOpacity>
      );
    } else {
      return (
        <TouchableOpacity
          style={styles.stepIconPending}
          onPress={() => onToggleComplete?.(step.id, true)}
        >
        </TouchableOpacity>
      );
    }
  };

  const getStepTextStyle = () => {
    if (step.is_completed) {
      return [styles.stepTitle, styles.stepTitleComplete];
    } else {
      return [styles.stepTitle, styles.stepTitleCurrent];
    }
  };

  const handleToolPress = (url?: string) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  return (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        {getStepIcon()}
        <View style={styles.stepContent}>
          <View style={styles.stepInfo}>
            <Text style={getStepTextStyle()}>{step.title}</Text>

            {!step.is_completed && (
              <View style={styles.stepDetails}>
                {step.time_estimate && (
                  <Text style={styles.stepMeta}>⏳ {step.time_estimate}</Text>
                )}

                {step.description && (
                  <Text style={styles.stepMeta}>{step.description}</Text>
                )}

                {step.completion_cue && (
                  <Text style={styles.stepMeta}>✅ {step.completion_cue}</Text>
                )}
              </View>
            )}
          </View>
        </View>
      </View>

      {!isLast && <View style={styles.stepDivider} />}
    </View>
  );
};

export default function FlowDetailScreenContent({
  flowId,
  onBackPress
}: FlowDetailScreenContentProps) {
  const [flow, setFlow] = useState<Flow | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadFlowData();
  }, [flowId]);

  const loadFlowData = async () => {
    try {
      setLoading(true);
      const flowData = await databaseService.getFlowWithSteps(flowId);
      setFlow(flowData.flow);
      setSteps(flowData.steps);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load flow');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComplete = async (stepId: string, isCompleted: boolean) => {
    try {
      await databaseService.toggleStepCompletion(stepId, isCompleted);

      // Update local state
      setSteps(prevSteps =>
        prevSteps.map(step =>
          step.id === stepId ? { ...step, is_completed: isCompleted } : step
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update step');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#0A0D12" />
        <Text style={styles.loadingText}>Loading flow...</Text>
      </View>
    );
  }

  if (error || !flow) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{error || 'Flow not found'}</Text>
        <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
          <ArrowLeft size={18} color="#0A0D12" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const completedSteps = steps.filter(step => step.is_completed).length;
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header with back button and actions */}
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
            <ArrowLeft size={18} color="#0A0D12" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.copyButton}>
              <Copy size={18} color="#0A0D12" />
              <Text style={styles.copyButtonText}>Copy Steps</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.moreButton}>
              <MoreHorizontal size={18} color="#0A0D12" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Flow title and progress */}
        <View style={styles.flowHeader}>
          <Text style={styles.flowTitle}>{flow.title}</Text>
          <Text style={styles.flowProgress}>
            {completedSteps} of {steps.length} steps complete
          </Text>
        </View>

        {/* Steps list */}
        <View style={styles.stepsList}>
          {steps.map((step, index) => (
            <StepItem
              key={step.id}
              step={step}
              isLast={index === steps.length - 1}
              onToggleComplete={handleToggleComplete}
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
  headerActions: {
    width: 600,
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 38,
  },
  backButtonText: {
    color: '#0A0D12',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22.4,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 38,
  },
  copyButtonText: {
    color: '#0A0D12',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22.4,
  },
  moreButton: {
    padding: 8,
    borderRadius: 38,
  },
  flowHeader: {
    width: 600,
    alignSelf: 'center',
    paddingVertical: 16,
    gap: 4,
  },
  flowTitle: {
    color: 'black',
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 28.8,
  },
  flowProgress: {
    color: '#535862',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22.4,
  },
  stepsList: {
    width: 600,
    alignSelf: 'center',
  },
  stepContainer: {
    paddingTop: 20,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepIconComplete: {
    width: 24,
    height: 24,
    backgroundColor: '#17B26A',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIconPending: {
    width: 24,
    height: 24,
    borderWidth: 1.5,
    borderColor: '#A4A7AE',
    borderRadius: 12,
  },
  stepContent: {
    flex: 1,
    gap: 20,
  },
  stepInfo: {
    gap: 8,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22.4,
  },
  stepTitleComplete: {
    color: '#A4A7AE',
    textDecorationLine: 'line-through',
    fontWeight: '400',
  },
  stepTitleCurrent: {
    color: 'black',
  },
  stepTitlePending: {
    color: 'black',
  },
  stepDetails: {
    gap: 8,
  },
  stepMeta: {
    color: '#535862',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22.4,
  },
  toolLink: {
    textDecorationLine: 'underline',
  },
  tasksList: {
    gap: 4,
  },
  taskItem: {
    color: '#535862',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22.4,
  },
  splitButtonContainer: {
    paddingTop: 4,
  },
  splitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 38,
    alignSelf: 'flex-start',
  },
  splitButtonText: {
    color: '#0A0D12',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22.4,
  },
  stepDivider: {
    height: 1,
    backgroundColor: '#D5D7DA',
    borderRadius: 20,
    marginTop: 20,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '400',
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 16,
  },
});