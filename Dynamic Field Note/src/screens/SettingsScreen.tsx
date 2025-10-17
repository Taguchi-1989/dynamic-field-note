/**
 * 設定画面
 * Phase 2: アクセシビリティ対応 + AI設定
 */

import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { Text, Card, List, Switch, SegmentedButtons } from 'react-native-paper';
import { useAccessibility, FontSize } from '../contexts/AccessibilityContext';

export const SettingsScreen: React.FC = () => {
  const [anonymizeEnabled, setAnonymizeEnabled] = React.useState(false);
  const { fontSize, isDarkMode, setFontSize, toggleDarkMode } = useAccessibility();

  return (
    <ScrollView style={styles.container}>
      {/* アクセシビリティ設定 */}
      <Card style={styles.card}>
        <Card.Title title="アクセシビリティ" />
        <Card.Content>
          <List.Section>
            <List.Subheader>フォントサイズ</List.Subheader>
            <SegmentedButtons
              value={fontSize}
              onValueChange={(value) => setFontSize(value as FontSize)}
              buttons={[
                { value: 'small', label: '小' },
                { value: 'medium', label: '中' },
                { value: 'large', label: '大' },
              ]}
              style={styles.segmentedButtons}
            />

            <List.Item
              title="ダークモード"
              description="暗い背景で表示（Phase 2.5で実装予定）"
              left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
              right={() => <Switch value={isDarkMode} onValueChange={toggleDarkMode} disabled />}
              style={styles.listItem}
            />
          </List.Section>
        </Card.Content>
      </Card>

      {/* AI設定 */}
      <Card style={styles.card}>
        <Card.Title title="AI設定" />
        <Card.Content>
          <List.Section>
            <List.Item
              title="Gemini APIキー"
              description="設定済み"
              left={(props) => <List.Icon {...props} icon="key" />}
              right={(props) => <List.Icon {...props} icon="check" color="green" />}
            />
            <List.Item
              title="GPT-5 APIキー"
              description="未設定（Phase 5で実装予定）"
              left={(props) => <List.Icon {...props} icon="key" />}
              right={(props) => <List.Icon {...props} icon="alert" color="orange" />}
            />
          </List.Section>
        </Card.Content>
      </Card>

      {/* 匿名化設定 */}
      <Card style={styles.card}>
        <Card.Title title="プライバシー" />
        <Card.Content>
          <List.Item
            title="個人情報の匿名化"
            description="名前や住所を自動的にマスク（Phase 3で実装予定）"
            left={(props) => <List.Icon {...props} icon="shield-account" />}
            right={() => (
              <Switch value={anonymizeEnabled} onValueChange={setAnonymizeEnabled} disabled />
            )}
          />
        </Card.Content>
      </Card>

      {/* アプリ情報 */}
      <Card style={styles.card}>
        <Card.Title title="アプリ情報" />
        <Card.Content>
          <Text style={styles.infoText}>バージョン: 1.0.0 (Phase 2)</Text>
          <Text style={styles.infoText}>ビルド: PoC + アクセシビリティ対応</Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
    elevation: 2,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  listItem: {
    marginTop: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
});
