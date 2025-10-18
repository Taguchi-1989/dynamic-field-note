# [Phase 3.5.5] 報告書保存時の写真統合

**作成日**: 2025-10-18
**優先度**: HIGH
**工数見積**: 3-4時間
**依存イシュー**: [#3.5.2](./PHASE_3_5_2_PHOTO_THUMBNAIL_INTEGRATION.md)
**ステータス**: TODO

---

## 📋 概要

報告書保存時に写真を統合し、Markdownに写真パスを埋め込みます。ファイルシステムでフォルダ構造を整理します。

---

## 🎯 目標

- 報告書保存時に写真の`report_id`を更新
- Markdownに写真パスを埋め込み
- ファイルシステムでフォルダ整理
- ReportDAO, PhotoDAOの統合

---

## 📝 実装内容

### 1. reportUtils 作成

**新規ファイル**: `src/utils/reportUtils.ts`

```typescript
import * as FileSystem from 'expo-file-system';
import { photoDAO } from '../dao/PhotoDAO';
import type { Photo } from '../types/case';

/**
 * Markdownに写真パスを埋め込み
 */
export const embedPhotosInMarkdown = (content: string, photos: Photo[]): string => {
  if (photos.length === 0) return content;

  const photoSection = photos
    .map((photo, index) => {
      const caption = photo.caption || `写真${index + 1}`;
      return `![${caption}](${photo.file_path})`;
    })
    .join('\n\n');

  return `${content}\n\n## 現場写真\n\n${photoSection}`;
};

/**
 * 写真ファイルを報告書フォルダに整理
 */
export const organizePhotoFiles = async (reportId: number, photos: Photo[]): Promise<void> => {
  const reportPhotoDir = `${FileSystem.documentDirectory}reports/report_${reportId}/photos`;

  // ディレクトリ作成
  await FileSystem.makeDirectoryAsync(reportPhotoDir, { intermediates: true });

  for (const photo of photos) {
    const fileName = `photo_${photo.id}.jpg`;
    const thumbFileName = `photo_${photo.id}_thumb.jpg`;

    const newPath = `${reportPhotoDir}/${fileName}`;
    const newThumbPath = `${reportPhotoDir}/${thumbFileName}`;

    // ファイルコピー
    await FileSystem.copyAsync({
      from: photo.file_path,
      to: newPath,
    });

    if (photo.thumbnail_path) {
      await FileSystem.copyAsync({
        from: photo.thumbnail_path,
        to: newThumbPath,
      });
    }

    // PhotoDAO更新
    await photoDAO.update(photo.id, {
      file_path: newPath,
      thumbnail_path: newThumbPath,
    });
  }
};
```

### 2. HomeScreen 報告書保存処理

**変更箇所**: `src/screens/HomeScreen.tsx`

```typescript
import { embedPhotosInMarkdown, organizePhotoFiles } from '../utils/reportUtils';

const saveReport = async () => {
  try {
    // 1. Markdownに写真パスを埋め込み
    const markdownWithPhotos = embedPhotosInMarkdown(markdown, photos);

    // 2. 報告書作成
    const reportId = await reportDAO.create({
      case_id: currentCaseId,
      title: reportTitle,
      content: markdownWithPhotos,
      voice_buffer: fullText,
      summary_json: JSON.stringify({ markdown, processingTime }),
      processing_time: processingTime,
    });

    // 3. 写真のreport_id更新
    for (const photo of photos) {
      await photoDAO.update(photo.id, { report_id: reportId });
    }

    // 4. ファイルシステムで整理
    await organizePhotoFiles(reportId, photos);

    showSnackbar('報告書を保存しました');
    clearPhotos(); // 写真クリア
  } catch (error) {
    console.error('[HomeScreen] Failed to save report:', error);
    Alert.alert('エラー', '報告書の保存に失敗しました');
  }
};
```

### 3. PhotoDAO update 実装確認

**既存実装**: `src/dao/PhotoDAO.ts`

```typescript
async update(id: number, input: UpdatePhotoInput): Promise<void> {
  const db = databaseService.getDatabase();
  const fields: string[] = [];
  const values: SQLiteBindValue[] = [];

  if (input.caption !== undefined) {
    fields.push('caption = ?');
    values.push(input.caption);
  }
  if (input.annotation_data !== undefined) {
    fields.push('annotation_data = ?');
    values.push(input.annotation_data);
  }
  // report_id追加
  if (input.report_id !== undefined) {
    fields.push('report_id = ?');
    values.push(input.report_id);
  }
  // file_path, thumbnail_path追加
  if (input.file_path !== undefined) {
    fields.push('file_path = ?');
    values.push(input.file_path);
  }
  if (input.thumbnail_path !== undefined) {
    fields.push('thumbnail_path = ?');
    values.push(input.thumbnail_path);
  }

  fields.push('updated_at = datetime("now", "localtime")');
  values.push(id);

  await db.runAsync(
    `UPDATE photos SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
}
```

### 4. UpdatePhotoInput 型定義拡張

**変更箇所**: `src/types/case.ts`

```typescript
export interface UpdatePhotoInput {
  caption?: string;
  annotation_data?: string;
  report_id?: number; // 追加
  file_path?: string; // 追加
  thumbnail_path?: string; // 追加
}
```

---

## 💻 実装詳細

### ファイル変更・新規作成

- [x] **新規** `src/utils/reportUtils.ts` (50-80行)
- [x] **修正** `src/types/case.ts` (UpdatePhotoInput拡張)
- [x] **修正** `src/dao/PhotoDAO.ts` (update実装確認・修正)
- [x] **修正** `src/screens/HomeScreen.tsx` (報告書保存処理)

### フォルダ構造

```
expo-file-system/documentDirectory/
└── reports/
    ├── report_1/
    │   ├── report.md
    │   └── photos/
    │       ├── photo_1.jpg
    │       ├── photo_1_thumb.jpg
    │       ├── photo_2.jpg
    │       └── photo_2_thumb.jpg
    ├── report_2/
    │   ├── report.md
    │   └── photos/
    │       ├── photo_3.jpg
    │       └── photo_3_thumb.jpg
```

---

## 🧪 テスト

### テストケース

- [x] embedPhotosInMarkdown正常動作
- [x] 写真0枚の場合、元のmarkdownのみ
- [x] 写真複数枚の場合、全て埋め込み
- [x] organizePhotoFiles正常動作
- [x] フォルダ作成確認
- [x] ファイルコピー確認
- [x] PhotoDAO.update呼び出し
- [x] report_id更新確認
- [x] 報告書保存フロー全体のテスト

### テスト実装例

```typescript
// src/utils/__tests__/reportUtils.test.ts
import { embedPhotosInMarkdown } from '../reportUtils';

describe('reportUtils', () => {
  describe('embedPhotosInMarkdown', () => {
    it('should embed photos in markdown', () => {
      const content = '## 報告内容\n\nテスト';
      const photos = [
        { id: 1, file_path: 'file:///photo1.jpg', caption: '外観' },
        { id: 2, file_path: 'file:///photo2.jpg', caption: '詳細' },
      ];

      const result = embedPhotosInMarkdown(content, photos);

      expect(result).toContain('## 現場写真');
      expect(result).toContain('![外観](file:///photo1.jpg)');
      expect(result).toContain('![詳細](file:///photo2.jpg)');
    });

    it('should return original content when no photos', () => {
      const content = '## 報告内容';
      const photos = [];

      const result = embedPhotosInMarkdown(content, photos);

      expect(result).toBe(content);
    });
  });
});
```

---

## ✅ 完了基準

- [x] TypeScript: 0エラー
- [x] ESLint: 0警告
- [x] Prettier: 100%準拠
- [x] Tests: 8-10件全パス
- [x] ガードレール: 全パス
- [x] 報告書保存フロー動作確認
- [x] ファイル整理動作確認
- [x] Markdown埋め込み確認

---

## 📚 参考資料

- [expo-file-system](https://docs.expo.dev/versions/latest/sdk/filesystem/)
- [ReportDAO](../../src/dao/ReportDAO.ts)
- [PhotoDAO](../../src/dao/PhotoDAO.ts)

---

## 🔗 関連イシュー

- **Depends on**: [#3.5.2 写真サムネイル基盤](./PHASE_3_5_2_PHOTO_THUMBNAIL_INTEGRATION.md)
- **Blocks**: なし

---

## 📝 Markdown埋め込み例

```markdown
## 報告内容

現場調査を実施しました。

## 現場写真

![外観](file:///.../reports/report_1/photos/photo_1.jpg)

![設備詳細](file:///.../reports/report_1/photos/photo_2.jpg)

![配線状況](file:///.../reports/report_1/photos/photo_3.jpg)
```

---

**Phase 3.5 完了条件**: 全イシュー（#3.5.1～#3.5.5）完了
