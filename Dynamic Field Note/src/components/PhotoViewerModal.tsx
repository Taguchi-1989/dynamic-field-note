/**
 * PhotoViewerModal Component
 * 写真拡大表示モーダル
 * Phase 3.5.4: 写真拡大表示
 */

import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { Image } from 'expo-image';
import { IconButton, Text } from 'react-native-paper';
import { Photo } from '../types/case';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PhotoViewerModalProps {
  photo: Photo | null;
  visible: boolean;
  onDismiss: () => void;
}

/**
 * 写真拡大表示モーダル
 */
export const PhotoViewerModal: React.FC<PhotoViewerModalProps> = ({
  photo,
  visible,
  onDismiss,
}) => {
  if (!photo) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onDismiss}
        accessible
        accessibilityLabel="写真を閉じる"
      >
        <View style={styles.container}>
          {/* 閉じるボタン */}
          <View style={styles.header}>
            <IconButton
              icon="close"
              iconColor="#fff"
              size={32}
              onPress={onDismiss}
              style={styles.closeButton}
            />
          </View>

          {/* 写真表示 */}
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: photo.file_path }}
              style={styles.image}
              resizeMode="contain"
              accessible
              accessibilityLabel={photo.caption || '写真'}
            />
          </View>

          {/* キャプション表示 */}
          {photo.caption && (
            <View style={styles.captionContainer}>
              <Text style={styles.captionText}>{photo.caption}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 44 : 20,
    right: 16,
    zIndex: 10,
  },
  closeButton: {
    margin: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
  },
  captionContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
    borderRadius: 8,
  },
  captionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
});
