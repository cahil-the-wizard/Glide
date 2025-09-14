import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { PlusIcon, MicIcon, ArrowUpIcon } from '../components/Icons';
import { Logo } from '../components/Logo';
import { databaseService } from '../services/database';

const { width: screenWidth } = Dimensions.get('window');

interface NewFlowScreenProps {
  onBackPress?: () => void;
  onFlowCreated?: (flowId: string) => void;
}

export default function NewFlowScreen({ onBackPress, onFlowCreated }: NewFlowScreenProps) {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<TextInput>(null);

  // Auto-focus the input when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async () => {
    if (!inputText.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const flow = await databaseService.createFlowFromTask(
        inputText.trim(),
        (message: string) => setProgressMessage(message)
      );

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
      <View style={styles.content}>
        <View style={styles.header}>
          <Logo />
          <Text style={styles.title}>Every flow starts with a single step</Text>
        </View>

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
                onSubmitEditing={handleSubmit}
                returnKeyType="done"
                multiline
                editable={!isLoading}
                selectionColor="transparent"
              />
            </View>
            <View style={styles.actionButtons}>
              <View style={styles.leftButtons}>
                <TouchableOpacity style={styles.button}>
                  <PlusIcon />
                </TouchableOpacity>
              </View>
              <View style={styles.rightButtons}>
                <TouchableOpacity style={styles.button}>
                  <MicIcon />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.primaryButton]}
                  onPress={handleSubmit}
                  disabled={!inputText.trim() || isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <ArrowUpIcon />
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    overflow: 'hidden',
  },
  content: {
    width: Math.min(680, screenWidth - 32),
    flexDirection: 'column',
    alignItems: 'center',
    gap: 32,
  },
  header: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 28,
  },
  title: {
    textAlign: 'center',
    color: 'black',
    fontSize: 32,
    fontWeight: '400',
    lineHeight: 38.4,
    maxWidth: 600,
  },
  inputContainer: {
    width: '100%',
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
});