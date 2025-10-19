/**
 * PhotoAnnotator
 * 写真注釈コンポーネント
 * Phase 3.3: 写真注釈機能実装
 *
 * 機能:
 * - 丸（Circle）描画
 * - 矢印（Arrow）描画
 * - テキスト追加
 * - 注釈データJSON保存
 */

import React, { useState } from 'react';
import { StyleSheet, View, Dimensions, Alert, GestureResponderEvent } from 'react-native';
import { Image } from 'expo-image';
import { Button, IconButton, Text } from 'react-native-paper';
import Svg, { Circle, Line, Text as SvgText, G } from 'react-native-svg';
import { DEFAULT_BLURHASH, BLURHASH_CONFIG } from '../constants/blurhash';

/**
 * 注釈ツール種別
 */
type AnnotationTool = 'circle' | 'arrow' | 'text' | 'none';

/**
 * 注釈アイテム（丸）
 */
interface CircleAnnotation {
  type: 'circle';
  id: string;
  x: number;
  y: number;
  radius: number;
  color: string;
}

/**
 * 注釈アイテム（矢印）
 */
interface ArrowAnnotation {
  type: 'arrow';
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
}

/**
 * 注釈アイテム（テキスト）
 */
interface TextAnnotation {
  type: 'text';
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
}

/**
 * 注釈データ型
 */
type Annotation = CircleAnnotation | ArrowAnnotation | TextAnnotation;

/**
 * Props型定義
 */
interface PhotoAnnotatorProps {
  /** 写真URI */
  photoUri: string;
  /** 保存コールバック */
  onSave: (annotations: Annotation[]) => void;
  /** キャンセルコールバック */
  onCancel: () => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

/**
 * 写真注釈コンポーネント
 */
export const PhotoAnnotator: React.FC<PhotoAnnotatorProps> = ({ photoUri, onSave, onCancel }) => {
  const [selectedTool, setSelectedTool] = useState<AnnotationTool>('none');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [currentColor] = useState('#FF0000');

  /**
   * 画面タップハンドラ（簡易実装）
   */
  const handlePress = (event: GestureResponderEvent) => {
    const { locationX, locationY } = event.nativeEvent;

    if (selectedTool === 'circle') {
      // 丸を追加
      const newCircle: CircleAnnotation = {
        type: 'circle',
        id: `circle_${Date.now()}`,
        x: locationX,
        y: locationY,
        radius: 30,
        color: currentColor,
      };
      setAnnotations([...annotations, newCircle]);
    } else if (selectedTool === 'text') {
      // テキスト入力ダイアログ（簡易版）
      Alert.prompt('テキスト入力', '注釈テキストを入力してください', (text) => {
        if (text) {
          const newText: TextAnnotation = {
            type: 'text',
            id: `text_${Date.now()}`,
            x: locationX,
            y: locationY,
            text,
            color: currentColor,
            fontSize: 16,
          };
          setAnnotations([...annotations, newText]);
        }
      });
    }
    // 矢印は2点タップが必要なため簡易実装では省略
  };

  /**
   * 保存処理
   */
  const handleSave = () => {
    if (annotations.length === 0) {
      Alert.alert('確認', '注釈が追加されていませんが、保存しますか？', [
        { text: 'キャンセル', style: 'cancel' },
        { text: '保存', onPress: () => onSave(annotations) },
      ]);
    } else {
      onSave(annotations);
    }
  };

  /**
   * 元に戻す
   */
  const handleUndo = () => {
    if (annotations.length > 0) {
      setAnnotations(annotations.slice(0, -1));
    }
  };

  /**
   * 全クリア
   */
  const handleClear = () => {
    Alert.alert('確認', '全ての注釈を削除しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      { text: '削除', onPress: () => setAnnotations([]), style: 'destructive' },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <IconButton icon="close" iconColor="#fff" onPress={onCancel} />
        <Text variant="titleMedium" style={styles.headerTitle}>
          写真注釈
        </Text>
        <IconButton icon="check" iconColor="#fff" onPress={handleSave} />
      </View>

      {/* 写真 + SVGオーバーレイ */}
      <View style={styles.imageContainer} onTouchEnd={handlePress}>
        <Image
          source={{ uri: photoUri }}
          placeholder={{ blurhash: DEFAULT_BLURHASH }}
          transition={BLURHASH_CONFIG.transitionDuration}
          cachePolicy={BLURHASH_CONFIG.cachePolicy}
          contentFit="contain"
          style={styles.image}
        />

        {/* SVG注釈レイヤー */}
        <Svg style={styles.svgOverlay} width={SCREEN_WIDTH} height={SCREEN_HEIGHT - 200}>
          <G>
            {annotations.map((annotation) => {
              if (annotation.type === 'circle') {
                return (
                  <Circle
                    key={annotation.id}
                    cx={annotation.x}
                    cy={annotation.y}
                    r={annotation.radius}
                    stroke={annotation.color}
                    strokeWidth={3}
                    fill="none"
                  />
                );
              } else if (annotation.type === 'arrow') {
                return (
                  <Line
                    key={annotation.id}
                    x1={annotation.x1}
                    y1={annotation.y1}
                    x2={annotation.x2}
                    y2={annotation.y2}
                    stroke={annotation.color}
                    strokeWidth={3}
                    markerEnd="url(#arrowhead)"
                  />
                );
              } else if (annotation.type === 'text') {
                return (
                  <SvgText
                    key={annotation.id}
                    x={annotation.x}
                    y={annotation.y}
                    fontSize={annotation.fontSize}
                    fill={annotation.color}
                    fontWeight="bold"
                  >
                    {annotation.text}
                  </SvgText>
                );
              }
              return null;
            })}
          </G>
        </Svg>
      </View>

      {/* ツールバー */}
      <View style={styles.toolbar}>
        <View style={styles.toolButtons}>
          <IconButton
            icon="circle-outline"
            mode={selectedTool === 'circle' ? 'contained' : 'outlined'}
            selected={selectedTool === 'circle'}
            onPress={() => setSelectedTool('circle')}
            iconColor={selectedTool === 'circle' ? '#1976d2' : '#666'}
          />
          <IconButton
            icon="arrow-right"
            mode={selectedTool === 'arrow' ? 'contained' : 'outlined'}
            selected={selectedTool === 'arrow'}
            onPress={() => Alert.alert('準備中', '矢印機能は次の更新で実装されます')}
            iconColor={selectedTool === 'arrow' ? '#1976d2' : '#666'}
          />
          <IconButton
            icon="text"
            mode={selectedTool === 'text' ? 'contained' : 'outlined'}
            selected={selectedTool === 'text'}
            onPress={() => setSelectedTool('text')}
            iconColor={selectedTool === 'text' ? '#1976d2' : '#666'}
          />
        </View>

        <View style={styles.actionButtons}>
          <Button mode="outlined" onPress={handleUndo} disabled={annotations.length === 0}>
            元に戻す
          </Button>
          <Button
            mode="outlined"
            onPress={handleClear}
            disabled={annotations.length === 0}
            textColor="#d32f2f"
          >
            クリア
          </Button>
        </View>
      </View>

      {/* 注釈件数表示 */}
      <View style={styles.statusBar}>
        <Text variant="bodySmall" style={styles.statusText}>
          注釈: {annotations.length}件
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1976d2',
    paddingTop: 40,
    paddingHorizontal: 8,
  },
  headerTitle: {
    color: '#fff',
    fontWeight: 'bold',
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  svgOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  toolbar: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  toolButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statusBar: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 8,
    alignItems: 'center',
  },
  statusText: {
    color: '#666',
  },
});
