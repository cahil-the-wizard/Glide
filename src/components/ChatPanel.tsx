import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { X, Send, User, Bot, ArrowRight, Mic } from 'lucide-react-native';
import { geminiService } from '../services/gemini';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function ChatPanel({ isVisible, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: geminiService.isConfigured()
        ? "Hi! I'm Glide AI. I can help you break down tasks, answer questions about productivity, or just chat about whatever's on your mind. What would you like to talk about?"
        : "Hi! I'm Glide AI. I'd love to help you, but it looks like the Gemini API isn't configured yet. You can still use the main app features!",
      isUser: false,
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (isVisible) {
      // Auto-focus input when panel opens
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isVisible]);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const messageText = inputText.trim();
    setInputText('');
    setIsLoading(true);

    try {
      // Create conversation history for context
      const conversationHistory = messages.slice(-6).map(msg =>
        `${msg.isUser ? 'User' : 'Glide AI'}: ${msg.text}`
      );

      // Get AI response from Gemini
      const aiResponseText = await geminiService.generateChatResponse(messageText, conversationHistory);

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponseText,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble connecting right now. Please try again in a moment!",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };


  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isVisible) return null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.panel}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerInfo}>
              <View style={styles.aiIcon}>
                <Bot size={16} color="#0A0D12" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Glide AI</Text>
                <Text style={styles.headerSubtitle}>Your productivity assistant</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageWrapper,
                message.isUser ? styles.userMessageWrapper : styles.aiMessageWrapper
              ]}
            >
              <View
                style={[
                  styles.message,
                  message.isUser ? styles.userMessage : styles.aiMessage
                ]}
              >
                <Text style={[
                  styles.messageText,
                  message.isUser ? styles.userMessageText : styles.aiMessageText
                ]}>
                  {message.text}
                </Text>
              </View>
              <Text style={styles.messageTime}>
                {formatTime(message.timestamp)}
              </Text>
            </View>
          ))}

          {isLoading && (
            <View style={styles.loadingWrapper}>
              <View style={styles.loadingMessage}>
                <ActivityIndicator size="small" color="#6B7280" />
                <Text style={styles.loadingText}>Glide is thinking...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputField}>
            <View style={styles.inputRow}>
              <TextInput
                ref={inputRef}
                style={styles.textInput}
                placeholder="Ask Glide anything..."
                placeholderTextColor="#A4A7AE"
                value={inputText}
                onChangeText={setInputText}
                onKeyPress={(e) => {
                  if (e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                multiline
                maxLength={500}
                editable={!isLoading}
                selectionColor="transparent"
              />
            </View>
            <View style={styles.actionButtons}>
              <View style={styles.leftButtons}>
                {/* Hidden plus button space for alignment */}
              </View>
              <View style={styles.rightButtons}>
                <TouchableOpacity style={styles.button}>
                  <Mic size={16} color="#717680" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.primaryButton]}
                  onPress={handleSendMessage}
                  disabled={!inputText.trim() || isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <ArrowRight size={16} color="white" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 400,
    zIndex: 1000,
  },
  panel: {
    flex: 1,
    backgroundColor: 'white',
    borderLeftWidth: 1,
    borderLeftColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0A0D12',
    lineHeight: 20,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 16,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  messagesContent: {
    padding: 20,
    gap: 16,
  },
  messageWrapper: {
    maxWidth: '80%',
  },
  userMessageWrapper: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  aiMessageWrapper: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  message: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    marginBottom: 4,
  },
  userMessage: {
    backgroundColor: '#0A0D12',
  },
  aiMessage: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  userMessageText: {
    color: 'white',
  },
  aiMessageText: {
    color: '#0A0D12',
  },
  messageTime: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '400',
  },
  loadingWrapper: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
    maxWidth: '80%',
  },
  loadingMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 18,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  inputField: {
    backgroundColor: 'white',
    shadowColor: '#101828',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D9D9D9',
    overflow: 'hidden',
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: 'column',
    gap: 12,
  },
  inputRow: {
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 19.6,
    color: 'black',
    minHeight: 19.6,
    paddingVertical: 0,
    paddingHorizontal: 0,
    outlineWidth: 0,
    outlineStyle: 'none',
    maxHeight: 80,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftButtons: {
    width: 32,
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
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    width: 32,
    height: 32,
  },
  primaryButton: {
    backgroundColor: '#0A0D12',
    borderWidth: 1,
    borderColor: '#2C2C2C',
  },
});