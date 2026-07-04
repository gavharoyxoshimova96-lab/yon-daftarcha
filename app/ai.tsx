import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  ActivityIndicator,
  Button,
  Chip,
  IconButton,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { useFocusEffect } from 'expo-router';

import { ChatBubble } from '@/components/ChatBubble';
import { useLocale } from '@/context/LocaleContext';
import {
  answerLocally,
  buildFinancialContext,
  getWelcomeMessage,
} from '@/services/aiAssistant';
import { answerWithAi, clearOpenAiApiKey, getOpenAiApiKey, setOpenAiApiKey } from '@/services/llm';
import { ChatMessage } from '@/types';

function createMessage(role: ChatMessage['role'], text: string): ChatMessage {
  return { id: `${Date.now()}-${Math.random()}`, role, text, timestamp: Date.now() };
}

export default function AiScreen() {
  const theme = useTheme();
  const { t, strings, locale } = useLocale();
  const scrollRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [hasKey, setHasKey] = useState(false);

  const loadKey = useCallback(async () => {
    const key = await getOpenAiApiKey();
    setHasKey(!!key);
    setApiKey(key ? '••••••••' : '');
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadKey();
    }, [loadKey])
  );

  useEffect(() => {
    (async () => {
      const welcome = await getWelcomeMessage();
      setMessages([createMessage('assistant', welcome)]);
    })();
  }, [locale]);

  const scrollToEnd = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setInput('');
    setMessages((prev) => [...prev, createMessage('user', trimmed)]);
    setLoading(true);
    scrollToEnd();

    try {
      const ctx = await buildFinancialContext();
      let reply = await answerWithAi(trimmed, ctx);
      if (!reply) {
        reply = await answerLocally(trimmed, ctx);
      }
      setMessages((prev) => [...prev, createMessage('assistant', reply)]);
    } catch {
      setMessages((prev) => [
        ...prev,
        createMessage('assistant', t('ai.error')),
      ]);
    } finally {
      setLoading(false);
      scrollToEnd();
    }
  };

  const handleSaveKey = async () => {
    if (apiKey === '••••••••') return;
    if (!apiKey.trim()) {
      await clearOpenAiApiKey();
      setHasKey(false);
      return;
    }
    await setOpenAiApiKey(apiKey);
    setHasKey(true);
    setApiKey('••••••••');
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text variant="titleMedium" style={{ fontWeight: '600' }}>
            {t('ai.title')}
          </Text>
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {hasKey ? t('ai.openAiConnected') : t('ai.offlineMode')}
          </Text>
        </View>
        <IconButton
          icon={showSettings ? 'close' : 'cog'}
          onPress={() => setShowSettings((v) => !v)}
        />
      </View>

      {showSettings && (
        <View style={[styles.settings, { backgroundColor: theme.colors.surface }]}>
          <Text variant="labelMedium" style={{ marginBottom: 8 }}>
            {t('ai.apiKey')}
          </Text>
          <TextInput
            label="API Key"
            value={apiKey}
            onChangeText={setApiKey}
            mode="outlined"
            secureTextEntry={apiKey === '••••••••'}
            placeholder="sk-..."
            style={styles.keyInput}
            onFocus={() => {
              if (apiKey === '••••••••') setApiKey('');
            }}
          />
          <Text variant="bodySmall" style={styles.settingsHint}>
            {t('ai.apiKeyHint')}
          </Text>
          <Button mode="contained-tonal" onPress={handleSaveKey} compact>
            {t('common.save')}
          </Button>
        </View>
      )}

      <ScrollView
        ref={scrollRef}
        style={styles.chat}
        contentContainerStyle={styles.chatContent}
        onContentSizeChange={scrollToEnd}
      >
        {messages.map((msg) => (
          <ChatBubble key={msg.id} role={msg.role} text={msg.text} />
        ))}
        {loading && (
          <View style={styles.typing}>
            <ActivityIndicator size="small" />
            <Text variant="bodySmall" style={{ marginLeft: 8 }}>
              {t('ai.preparing')}
            </Text>
          </View>
        )}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chips}
        contentContainerStyle={styles.chipsContent}
      >
        {strings.ai.quickQuestions.map((q) => (
          <Chip key={q} onPress={() => sendMessage(q)} style={styles.chip} compact>
            {q}
          </Chip>
        ))}
      </ScrollView>

      <View style={[styles.inputRow, { backgroundColor: theme.colors.surface }]}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder={t('ai.placeholder')}
          mode="outlined"
          style={styles.input}
          multiline
          maxLength={500}
          onSubmitEditing={() => sendMessage(input)}
        />
        <IconButton
          icon="send"
          mode="contained"
          containerColor={theme.colors.primary}
          iconColor={theme.colors.onPrimary}
          onPress={() => sendMessage(input)}
          disabled={loading || !input.trim()}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerLeft: { flex: 1 },
  settings: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
  },
  settingsHint: { opacity: 0.7, marginBottom: 8 },
  keyInput: { marginBottom: 8 },
  chat: { flex: 1 },
  chatContent: { paddingVertical: 8, paddingBottom: 16 },
  typing: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  chips: { maxHeight: 48, marginBottom: 4 },
  chipsContent: { paddingHorizontal: 12, gap: 8 },
  chip: { marginRight: 0 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 8,
    paddingBottom: Platform.OS === 'ios' ? 16 : 8,
    gap: 4,
  },
  input: { flex: 1, maxHeight: 100 },
});
