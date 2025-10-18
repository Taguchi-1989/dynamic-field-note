/**
 * PhotoThumbnailGrid Component
 * 写真サムネイルグリッド
 * Phase 3.5.2: 写真サムネイル基盤
 */

import React from 'react';
import { View, ScrollView, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
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
  const isPhotoLimitReached = photos.length >= maxPhotos;

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
              onPress={() => onDeletePress(photo)}
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
