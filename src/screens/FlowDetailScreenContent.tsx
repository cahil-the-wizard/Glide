import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking, ActivityIndicator, Animated, Modal } from 'react-native';
import { ArrowLeft, Copy, MoreHorizontal, Check, Split, Trash2, Copy as DuplicateIcon, Edit, ExternalLink } from 'lucide-react-native';
import { Flow, Step } from '../types/database';
import { databaseService } from '../services/database';
import { soundService } from '../services/sound';

interface FlowDetailScreenContentProps {
  flowId: string;
  onBackPress?: () => void;
  onFlowDeleted?: () => void;
  onEditFlow?: (flowTitle: string) => void;
}

const StepItem = ({ step, isLast, onToggleComplete, onSplitStep, splitLoading }: {
  step: Step;
  isLast: boolean;
  onToggleComplete?: (stepId: string, isCompleted: boolean) => void;
  onSplitStep?: (stepId: string) => void;
  splitLoading?: string | null;
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

                <View style={styles.splitButtonContainer}>
                  <TouchableOpacity
                    style={[
                      styles.splitButton,
                      splitLoading === step.id && styles.splitButtonDisabled
                    ]}
                    onPress={() => onSplitStep?.(step.id)}
                    disabled={splitLoading === step.id}
                  >
                    {splitLoading === step.id ? (
                      <ActivityIndicator size="small" color="#0A0D12" />
                    ) : (
                      <Split size={18} color="#0A0D12" />
                    )}
                    <Text style={styles.splitButtonText}>
                      {splitLoading === step.id ? 'Splitting...' : 'Split'}
                    </Text>
                  </TouchableOpacity>
                </View>
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
  onBackPress,
  onFlowDeleted,
  onEditFlow
}: FlowDetailScreenContentProps) {
  const [flow, setFlow] = useState<Flow | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [splitLoading, setSplitLoading] = useState<string | null>(null);
  const [splitMessage, setSplitMessage] = useState<string>('');
  const [showHeaderTitle, setShowHeaderTitle] = useState(false);
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);
  const [showHeaderStroke, setShowHeaderStroke] = useState(false);
  const headerTitleOpacity = useRef(new Animated.Value(0)).current;
  const headerStrokeOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadFlowData();
    loadSounds();

    return () => {
      soundService.unloadSounds();
    };
  }, [flowId]);

  const loadSounds = async () => {
    await soundService.loadSounds();
  };

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

      // Play sound when completing a step (not when unchecking)
      if (isCompleted) {
        await soundService.playStepCompleteSound();
      }

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

  const handleSplitStep = async (stepId: string) => {
    try {
      setSplitLoading(stepId);
      setSplitMessage('');
      setError('');

      await databaseService.splitStep(
        stepId,
        (message: string) => setSplitMessage(message)
      );

      // Reload flow data to get the updated steps
      await loadFlowData();

      setSplitMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to split step');
    } finally {
      setSplitLoading(null);
      setSplitMessage('');
    }
  };

  const handleDeleteFlow = async () => {
    try {
      await databaseService.deleteFlow(flowId);
      onFlowDeleted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete flow');
    }
  };

  const handleDuplicateFlow = async () => {
    if (!flow) return;

    try {
      // Create a new flow with the same title (with "Copy" prefix)
      const duplicatedFlow = await databaseService.createFlowFromTask(
        `Copy of ${flow.title}`,
        (message: string) => console.log('Duplicating:', message)
      );

      // Navigate back to see the new flow
      onBackPress?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate flow');
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/flow/${flowId}`;
      navigator.clipboard.writeText(url).then(() => {
        // Could show a toast or feedback here
        console.log('Link copied to clipboard');
      }).catch(err => {
        console.error('Failed to copy link:', err);
      });
    }
  };

  const handleEditFlow = () => {
    if (flow) {
      // Pass the flow title as the prompt to edit
      onEditFlow?.(flow.title);
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
      {/* Sticky Header with back button and actions */}
      <View style={styles.headerActions}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
            <ArrowLeft size={18} color="#0A0D12" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          {flow && (
            <Animated.Text
              style={[
                styles.headerTitle,
                {
                  opacity: headerTitleOpacity,
                }
              ]}
            >
              {flow.title}
            </Animated.Text>
          )}
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.copyButton}>
            <Copy size={18} color="#0A0D12" />
            <Text style={styles.copyButtonText}>Copy Steps</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.moreButton}
            onPress={() => setShowMoreDropdown(true)}
          >
            <MoreHorizontal size={18} color="#0A0D12" />
          </TouchableOpacity>
        </View>

        {/* Animated bottom stroke */}
        <Animated.View
          style={[
            styles.headerStroke,
            {
              opacity: headerStrokeOpacity,
            }
          ]}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={(event) => {
          const scrollY = event.nativeEvent.contentOffset.y;
          const shouldShow = scrollY > 120;
          const shouldShowStroke = scrollY > 10;

          if (shouldShow !== showHeaderTitle) {
            setShowHeaderTitle(shouldShow);

            Animated.timing(headerTitleOpacity, {
              toValue: shouldShow ? 1 : 0,
              duration: 200,
              useNativeDriver: true,
            }).start();
          }

          if (shouldShowStroke !== showHeaderStroke) {
            setShowHeaderStroke(shouldShowStroke);

            Animated.timing(headerStrokeOpacity, {
              toValue: shouldShowStroke ? 1 : 0,
              duration: 150,
              useNativeDriver: true,
            }).start();
          }
        }}
        scrollEventThrottle={16}
      >

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
              onSplitStep={handleSplitStep}
              splitLoading={splitLoading}
            />
          ))}
        </View>

        {/* Split loading message */}
        {splitLoading && splitMessage && (
          <View style={styles.progressContainer}>
            <ActivityIndicator size="small" color="#0A0D12" />
            <Text style={styles.progressText}>{splitMessage}</Text>
          </View>
        )}
      </ScrollView>

      {/* More Options Dropdown Modal */}
      <Modal
        visible={showMoreDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMoreDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMoreDropdown(false)}
        >
          <View style={styles.dropdown}>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setShowMoreDropdown(false);
                handleEditFlow();
              }}
            >
              <Edit size={18} color="#0A0D12" />
              <Text style={styles.dropdownItemText}>Edit flow</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setShowMoreDropdown(false);
                handleDuplicateFlow();
              }}
            >
              <DuplicateIcon size={18} color="#0A0D12" />
              <Text style={styles.dropdownItemText}>Duplicate</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setShowMoreDropdown(false);
                handleCopyLink();
              }}
            >
              <ExternalLink size={18} color="#0A0D12" />
              <Text style={styles.dropdownItemText}>Copy link</Text>
            </TouchableOpacity>

            <View style={styles.dropdownDivider} />

            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setShowMoreDropdown(false);
                handleDeleteFlow();
              }}
            >
              <Trash2 size={18} color="#DC2626" />
              <Text style={[styles.dropdownItemText, styles.dropdownItemTextDanger]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollContent: {
    paddingTop: 70,
    paddingBottom: 40,
  },
  headerActions: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    zIndex: 1000,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  headerTitle: {
    color: '#0A0D12',
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 38,
  },
  backButtonText: {
    color: '#0A0D12',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 38,
  },
  copyButtonText: {
    color: '#0A0D12',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  moreButton: {
    padding: 6,
    borderRadius: 38,
  },
  flowHeader: {
    width: 700,
    alignSelf: 'center',
    paddingHorizontal: 20,
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
    width: 700,
    alignSelf: 'center',
    paddingHorizontal: 20,
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
  splitButtonDisabled: {
    opacity: 0.6,
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
  // Dropdown Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 70,
    paddingRight: 20,
  },
  dropdown: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 200,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#0A0D12',
  },
  dropdownItemTextDanger: {
    color: '#DC2626',
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
    marginHorizontal: 8,
  },
  headerStroke: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
});