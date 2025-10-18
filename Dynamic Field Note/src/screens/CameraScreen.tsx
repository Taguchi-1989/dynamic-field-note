/**
 * CameraScreen
 * 写真撮影画面
 * Phase 3.2: 写真撮影・注釈機能実装
 */

import React, { useState, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Text, IconButton, Button } from 'react-native-paper';
import { Paths, Directory } from 'expo-file-system';
import { useNavigation } from '@react-navigation/native';
import { PhotoAnnotator } from '../components/PhotoAnnotator';

interface CameraScreenProps {
  caseId?: number;
}

export const CameraScreen: React.FC<CameraScreenProps> = ({ caseId }) => {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [currentPhotoUri, setCurrentPhotoUri] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const navigation = useNavigation();

  // パーミッションチェック
  if (!permission) {
    return (
      <View style={styles.container}>
        <Text>カメラの読み込み中...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>カメラへのアクセス権限が必要です</Text>
        <View style={styles.permissionButtonContainer}>
          <Button mode="outlined" onPress={() => navigation.goBack()} style={styles.backButton}>
            戻る
          </Button>
          <Button mode="contained" onPress={requestPermission} style={styles.permissionButton}>
            権限を許可
          </Button>
        </View>
      </View>
    );
  }

  /**
   * カメラの向きを切り替え
   */
  function toggleCameraFacing() {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  }

  /**
   * 写真撮影
   */
  async function takePicture() {
    if (!cameraRef.current) {
      Alert.alert('エラー', 'カメラが準備できていません');
      return;
    }

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        exif: true,
      });

      if (!photo) {
        Alert.alert('エラー', '写真の撮影に失敗しました');
        return;
      }

      console.log('[CameraScreen] Photo taken:', photo.uri);

      // 撮影した写真を保存ディレクトリに保存
      const fileName = `photo_${Date.now()}.jpg`;
      const photosDir = new Directory(Paths.cache, 'photos');

      // ディレクトリ作成（存在しない場合）
      if (!photosDir.exists) {
        photosDir.create();
      }

      const photoFile = photosDir.createFile(fileName, 'image/jpeg');

      // 写真ファイルを保存
      const response = await fetch(photo.uri);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      await photoFile.write(uint8Array);

      const savedUri = photoFile.uri;

      Alert.alert(
        '撮影完了',
        '写真を保存しました。注釈を追加しますか？',
        [
          {
            text: 'キャンセル',
            style: 'cancel',
          },
          {
            text: '注釈を追加',
            onPress: () => {
              setCurrentPhotoUri(savedUri);
              setIsAnnotating(true);
            },
          },
          {
            text: 'そのまま保存',
            onPress: async () => {
              // TODO: PhotoDAOに保存
              console.log('[CameraScreen] Save photo without annotation:', savedUri);
              Alert.alert('成功', '写真を保存しました');
            },
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.error('[CameraScreen] Failed to take picture:', error);
      Alert.alert('エラー', '写真の撮影に失敗しました');
    }
  }

  /**
   * 注釈保存ハンドラー
   */
  const handleAnnotationSave = (annotations: unknown[]) => {
    console.log('[CameraScreen] Annotations saved:', annotations);
    // TODO: PhotoDAOに保存（annotation_dataとしてJSON保存）
    const annotationData = JSON.stringify(annotations);
    console.log('[CameraScreen] Annotation data:', annotationData);
    Alert.alert('成功', '注釈付き写真を保存しました');
    setIsAnnotating(false);
    setCurrentPhotoUri(null);
  };

  /**
   * 注釈キャンセルハンドラー
   */
  const handleAnnotationCancel = () => {
    setIsAnnotating(false);
    setCurrentPhotoUri(null);
  };

  // 注釈モード
  if (isAnnotating && currentPhotoUri) {
    return (
      <PhotoAnnotator
        photoUri={currentPhotoUri}
        onSave={handleAnnotationSave}
        onCancel={handleAnnotationCancel}
      />
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <IconButton icon="close" iconColor="#fff" size={30} onPress={() => navigation.goBack()} />
          <Text style={styles.headerText}>写真撮影</Text>
          <View style={{ width: 50 }} />
        </View>

        {/* 案件表示 */}
        {caseId && (
          <View style={styles.caseInfo}>
            <Text style={styles.caseText}>案件 ID: {caseId}</Text>
          </View>
        )}

        {/* コントロールボタン */}
        <View style={styles.controlsContainer}>
          {/* カメラ切り替えボタン */}
          <TouchableOpacity style={styles.iconButton} onPress={toggleCameraFacing}>
            <IconButton icon="camera-flip" iconColor="#fff" size={32} />
          </TouchableOpacity>

          {/* シャッターボタン */}
          <TouchableOpacity style={styles.shutterButton} onPress={takePicture}>
            <View style={styles.shutterInner} />
          </TouchableOpacity>

          {/* プレースホルダー（左右対称にするため） */}
          <View style={styles.iconButton} />
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  headerText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  caseInfo: {
    position: 'absolute',
    top: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  caseText: {
    color: '#fff',
    fontSize: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  shutterButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  iconButton: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
    color: '#fff',
    paddingHorizontal: 20,
  },
  permissionButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
  },
  backButton: {
    minWidth: 100,
  },
  permissionButton: {
    minWidth: 120,
  },
});
