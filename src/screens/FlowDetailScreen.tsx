import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Linking } from 'react-native';
import { ArrowLeft, Copy, MoreHorizontal, Check, Split } from 'lucide-react-native';
import { Logo } from '../components/Logo';
import { FlowDetail, FlowStep } from '../data/flowData';

interface FlowDetailScreenProps {
  flowData: FlowDetail;
  onBackPress?: () => void;
  onHomePress?: () => void;
  onNewFlowPress?: () => void;
}

const StepItem = ({ step, isLast }: { step: FlowStep; isLast: boolean }) => {
  const getStepIcon = () => {
    if (step.status === 'complete') {
      return (
        <View style={styles.stepIconComplete}>
          <Check size={12} color="white" strokeWidth={2} />
        </View>
      );
    } else {
      return (
        <View style={styles.stepIconPending}>
        </View>
      );
    }
  };

  const getStepTextStyle = () => {
    if (step.status === 'complete') {
      return [styles.stepTitle, styles.stepTitleComplete];
    } else if (step.status === 'current') {
      return [styles.stepTitle, styles.stepTitleCurrent];
    } else {
      return [styles.stepTitle, styles.stepTitlePending];
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

            {step.status !== 'complete' && (
              <View style={styles.stepDetails}>
                {step.estimatedTime && (
                  <Text style={styles.stepMeta}>⏳ {step.estimatedTime}</Text>
                )}

                {step.tools && step.tools.length > 0 && (
                  <Text style={styles.stepMeta}>
                    🔗 Use{' '}
                    {step.tools.map((tool, index) => (
                      <Text key={tool.name}>
                        <Text
                          style={styles.toolLink}
                          onPress={() => handleToolPress(tool.url)}
                        >
                          {tool.name}
                        </Text>
                        {index < step.tools!.length - 1 ? ' or ' : ''}
                      </Text>
                    ))}
                  </Text>
                )}

                {step.tasks && step.tasks.length > 0 && (
                  <View style={styles.tasksList}>
                    {step.tasks.map((task, index) => (
                      <Text key={index} style={styles.taskItem}>
                        {task}
                      </Text>
                    ))}
                  </View>
                )}

                {step.canSplit && (
                  <View style={styles.splitButtonContainer}>
                    <TouchableOpacity style={styles.splitButton}>
                      <Split size={18} color="#0A0D12" />
                      <Text style={styles.splitButtonText}>Split</Text>
                    </TouchableOpacity>
                  </View>
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

export default function FlowDetailScreen({
  flowData,
  onBackPress,
  onHomePress,
  onNewFlowPress
}: FlowDetailScreenProps) {
  const [hoveredNavItem, setHoveredNavItem] = React.useState<string | null>(null);

  return (
    <View style={styles.container}>
      {/* Sidebar - same as other screens */}
      <View style={styles.sidebar}>
        <View style={styles.sidebarContent}>
          <View style={styles.sidebarHeader}>
            <View style={styles.logoContainer}>
              <Logo width={32} color="black" />
            </View>
            <TouchableOpacity style={styles.settingsButton}>
              <View style={styles.settingsIcon} />
            </TouchableOpacity>
          </View>

          <View style={styles.navigation}>
            <TouchableOpacity
              style={[
                styles.navItem,
                hoveredNavItem === 'home' && styles.navItemHover
              ]}
              onPress={onHomePress}
              onMouseEnter={() => setHoveredNavItem('home')}
              onMouseLeave={() => setHoveredNavItem(null)}
            >
              <View style={styles.navIcon} />
              <Text style={styles.navText}>Home</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.navItem,
                hoveredNavItem === 'newflow' && styles.navItemHover
              ]}
              onPress={onNewFlowPress}
              onMouseEnter={() => setHoveredNavItem('newflow')}
              onMouseLeave={() => setHoveredNavItem(null)}
            >
              <View style={styles.plusIcon} />
              <Text style={styles.navText}>New flow</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.navItem,
                hoveredNavItem === 'search' && styles.navItemHover
              ]}
              onMouseEnter={() => setHoveredNavItem('search')}
              onMouseLeave={() => setHoveredNavItem(null)}
            >
              <View style={styles.searchIcon} />
              <Text style={styles.navText}>Search flows</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <View style={styles.flowsSection}>
            <Text style={styles.sectionHeader}>Flows</Text>
            <TouchableOpacity
              style={[
                styles.flowNavItem,
                hoveredNavItem === 'flow-1' && styles.navItemHover
              ]}
              onMouseEnter={() => setHoveredNavItem('flow-1')}
              onMouseLeave={() => setHoveredNavItem(null)}
            >
              <Text style={styles.flowNavText}>Job Application</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.flowNavItem}>
              <Text style={styles.flowNavText}>Kitchen Declutter</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.flowNavItem}>
              <Text style={styles.flowNavText}>Weekly Groceries</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.userProfile}>
          <Image
            source={{ uri: 'https://placehold.co/34x34' }}
            style={styles.avatar}
          />
          <Text style={styles.userName}>Cahil Sankar</Text>
        </View>
      </View>

      {/* Main content */}
      <View style={styles.mainContent}>
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
            <Text style={styles.flowTitle}>{flowData.title}</Text>
            <Text style={styles.flowProgress}>
              {flowData.completedSteps} of {flowData.totalSteps} steps complete
            </Text>
          </View>

          {/* Steps list */}
          <View style={styles.stepsList}>
            {flowData.steps.map((step, index) => (
              <StepItem
                key={step.id}
                step={step}
                isLast={index === flowData.steps.length - 1}
              />
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
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
  settingsIcon: {
    width: 13.5,
    height: 13.5,
    borderWidth: 1.5,
    borderColor: '#717680',
    borderRadius: 7,
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
  navIcon: {
    width: 13.5,
    height: 14.25,
    borderWidth: 1.5,
    borderColor: '#0A0D12',
    borderRadius: 2,
  },
  plusIcon: {
    width: 10.5,
    height: 10.5,
    borderWidth: 2,
    borderColor: '#0A0D12',
    borderRadius: 1,
  },
  searchIcon: {
    width: 13.5,
    height: 13.5,
    borderWidth: 1.5,
    borderColor: '#0A0D12',
    borderRadius: 7,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 8,
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
  mainContent: {
    flex: 1,
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
});