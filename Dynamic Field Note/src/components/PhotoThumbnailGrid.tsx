/**
 * PhotoThumbnailGrid Component
 * 写真サムネイルグリッド
 * Phase 3.5.2: 写真サムネイル基盤
 */

import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Text, IconButton, Dialog, Portal, Paragraph, Button } from 'react-native-paper';
import { Photo } from '../types/case';

interface PhotoThumbnailGridProps {
  photos: Photo[];
  maxPhotos: number;
  onPhotoPress: (photo: Photo) => void;
  onDeletePress: (photo: Photo) => void;
  onAddPress: () => void;
  disabled?: boolean;
}

/**
 * 写真サムネイルグリッド
 */
export const PhotoThumbnailGrid: React.FC<PhotoThumbnailGridProps> = ({
  photos,
  maxPhotos,
  onPhotoPress,
  onDeletePress,
  onAddPress,
  disabled = false,
}) => {
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<Photo | null>(null);
  const isPhotoLimitReached = photos.length >= maxPhotos;

  /**
   * 削除確認ダイアログを表示
   */
  const handleDeletePress = (photo: Photo) => {
    setPhotoToDelete(photo);
    setDeleteDialogVisible(true);
  };

  /**
   * 削除キャンセル
   */
  const handleDeleteCancel = () => {
    setDeleteDialogVisible(false);
    setPhotoToDelete(null);
  };

  /**
   * 削除実行
   */
  const handleDeleteConfirm = () => {
    if (photoToDelete) {
      onDeletePress(photoToDelete);
    }
    setDeleteDialogVisible(false);
    setPhotoToDelete(null);
  };

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.headerText}>
          写真 ({photos.length}/{maxPhotos})
        </Text>
      </View>

      {/* サムネイルグリッド */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 写真サムネイル */}
        {photos.map((photo) => (
          <View key={photo.id} style={styles.thumbnailContainer}>
            <TouchableOpacity onPress={() => onPhotoPress(photo)} disabled={disabled}>
              <Image
                source={{ uri: photo.thumbnail_path || photo.file_path }}
                style={styles.thumbnail}
                resizeMode="cover"
              />
            </TouchableOpacity>

            {/* 削除ボタン */}
            <IconButton
              icon="close-circle"
              size={24}
              iconColor="#d32f2f"
              style={styles.deleteButton}
              onPress={() => handleDeletePress(photo)}
              disabled={disabled}
            />
          </View>
        ))}

        {/* 追加ボタン */}
        {!isPhotoLimitReached && (
          <TouchableOpacity
            style={styles.addButtonContainer}
            onPress={onAddPress}
            disabled={disabled}
          >
            <IconButton icon="camera-plus" size={48} iconColor="#1976d2" disabled={disabled} />
            <Text style={styles.addButtonText}>写真を追加</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* 上限到達メッセージ */}
      {isPhotoLimitReached && (
        <Text style={styles.limitText}>写真の上限（{maxPhotos}枚）に達しました</Text>
      )}

      {/* 削除確認ダイアログ */}
      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={handleDeleteCancel}>
          <Dialog.Title>写真を削除</Dialog.Title>
          <Dialog.Content>
            <Paragraph>この写真を削除しますか？{'\n'}この操作は取り消せません。</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleDeleteCancel}>いいえ</Button>
            <Button onPress={handleDeleteConfirm} textColor="#d32f2f">
              はい
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  header: {
    marginBottom: 8,
  },
  headerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollContent: {
    gap: 12,
  },
  thumbnailContainer: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  thumbnail: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
  },
  deleteButton: {
    position: 'absolute',
    top: -12,
    right: -12,
    margin: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  addButtonContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1976d2',
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: 12,
    color: '#1976d2',
    marginTop: -8,
  },
  limitText: {
    fontSize: 12,
    color: '#d32f2f',
    marginTop: 8,
    textAlign: 'center',
  },
});
