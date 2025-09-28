import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Clock, CheckCircle } from 'lucide-react-native';
import { Flow, Step } from '../types/database';
import { databaseService } from '../services/database';

interface TodaysPathProps {
  flows: Flow[];
  onStepPress?: (flowId: string, stepId: string) => void;
}

interface NextStep {
  flowId: string;
  flowTitle: string;
  step: Step;
}

const getTodaysDateInfo = () => {
  const today = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const dayName = dayNames[today.getDay()];
  const monthName = monthNames[today.getMonth()];
  const dayNumber = today.getDate();

  return `${monthName} ${dayNumber}, ${dayName}`;
};

export default function TodaysPath({ flows, onStepPress }: TodaysPathProps) {
  const [nextSteps, setNextSteps] = useState<NextStep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNextSteps = async () => {
      if (!flows.length) {
        setNextSteps([]);
        setLoading(false);
        return;
      }

      try {
        const nextStepsData: NextStep[] = [];

        for (const flow of flows) {
          try {
            const { steps } = await databaseService.getFlowWithSteps(flow.id);

            // Find the next uncompleted step
            const nextStep = steps.find(step => !step.is_completed);

            if (nextStep) {
              nextStepsData.push({
                flowId: flow.id,
                flowTitle: flow.title,
                step: nextStep
              });
            }
          } catch (error) {
            console.error(`Error loading steps for flow ${flow.id}:`, error);
          }
        }

        setNextSteps(nextStepsData);
      } catch (error) {
        console.error('Error loading next steps:', error);
      } finally {
        setLoading(false);
      }
    };

    loadNextSteps();
  }, [flows]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#0A0D12" />
        <Text style={styles.loadingText}>Loading today's path...</Text>
      </View>
    );
  }

  if (nextSteps.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.heading}>Today's path</Text>
          <View style={styles.subHeading}>
            <Text style={styles.stepCount}>0 Steps</Text>
            <View style={styles.dot} />
            <Text style={styles.dateText}>{getTodaysDateInfo()}</Text>
          </View>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No steps available. Create a new flow to get started!</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.heading}>Today's path</Text>
        <View style={styles.subHeading}>
          <Text style={styles.stepCount}>{nextSteps.length} Step{nextSteps.length !== 1 ? 's' : ''}</Text>
          <View style={styles.dot} />
          <Text style={styles.dateText}>{getTodaysDateInfo()}</Text>
        </View>
      </View>

      {/* Steps List */}
      <View style={styles.stepsList}>
        {nextSteps.map((nextStep, index) => (
          <TouchableOpacity
            key={nextStep.flowId}
            style={[
              styles.stepItem,
              index === nextSteps.length - 1 && styles.lastStepItem
            ]}
            onPress={() => onStepPress?.(nextStep.flowId, nextStep.step.id)}
          >
            <View style={styles.checkboxContainer}>
              <View style={styles.checkbox} />
            </View>

            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>{nextStep.step.title}</Text>
              <View style={styles.stepMeta}>
                <View style={styles.metaItem}>
                  <Clock size={16} color="#535862" />
                  <Text style={styles.metaText}>Complete in {nextStep.step.time_estimate}</Text>
                </View>
                <View style={styles.metaItem}>
                  <CheckCircle size={16} color="#535862" />
                  <Text style={styles.metaText}>{nextStep.flowTitle}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 600,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    alignSelf: 'center',
  },
  header: {
    alignSelf: 'stretch',
    overflow: 'hidden',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 8,
  },
  heading: {
    color: 'black',
    fontSize: 32,
    fontWeight: '500',
    lineHeight: 38.4,
  },
  subHeading: {
    paddingLeft: 4,
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 4,
    flexDirection: 'row',
  },
  stepCount: {
    color: '#535862',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 19.6,
  },
  dot: {
    width: 3,
    height: 3,
    backgroundColor: '#535862',
    borderRadius: 9999,
  },
  dateText: {
    color: '#535862',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 19.6,
  },
  stepsList: {
    alignSelf: 'stretch',
    overflow: 'hidden',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepItem: {
    alignSelf: 'stretch',
    paddingTop: 20,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: '#D5D7DA',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    gap: 12,
    flexDirection: 'row',
  },
  lastStepItem: {
    borderBottomWidth: 0,
  },
  checkboxContainer: {
    width: 24,
    height: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  checkbox: {
    width: 20,
    height: 20,
    left: 2,
    top: 2,
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: '#A4A7AE',
    borderRadius: 10,
  },
  stepContent: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    gap: 8,
    paddingBottom: 20,
  },
  stepTitle: {
    color: 'black',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22.4,
  },
  stepMeta: {
    width: 279,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    gap: 6,
  },
  metaItem: {
    alignSelf: 'stretch',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 4,
    flexDirection: 'row',
  },
  metaText: {
    color: '#535862',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 19.6,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '400',
    marginTop: 8,
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