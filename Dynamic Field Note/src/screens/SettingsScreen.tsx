/**
 * 設定画面
 * Phase 2: AI設定などの管理
 */

import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Card, List, Switch } from 'react-native-paper';

export const SettingsScreen: React.FC = () => {
  const [anonymizeEnabled, setAnonymizeEnabled] = React.useState(false);

  return (
    <ScrollView style={styles.container}>
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

      <Card style={styles.card}>
        <Card.Title title="匿名化設定" />
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

      <Card style={styles.card}>
        <Card.Title title="アプリ情報" />
        <Card.Content>
          <Text style={styles.infoText}>バージョン: 1.0.0 (Phase 2)</Text>
          <Text style={styles.infoText}>ビルド: PoC</Text>
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
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
});
