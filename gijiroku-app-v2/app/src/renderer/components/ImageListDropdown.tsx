import React, { useState } from 'react';
import './ImageListDropdown.css';

interface ImageListDropdownProps {
  insertedImages: { [key: string]: string };
  onImageDelete: (imageId: string) => void;
}

const ImageListDropdown: React.FC<ImageListDropdownProps> = ({
  insertedImages,
  onImageDelete,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const imageCount = Object.keys(insertedImages).length;
  const imageEntries = Object.entries(insertedImages);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleImageDelete = (imageId: string, fileName: string) => {
    if (window.confirm(`画像 "${fileName}" を削除しますか？`)) {
      onImageDelete(imageId);
    }
  };

  // 画像のファイル名を取得（data URLから推測またはIDから生成）
  const getImageFileName = (imageId: string, dataUri: string): string => {
    // IDからファイル名を推測（img_timestamp形式の場合）
    if (imageId.startsWith('img_')) {
      const timestamp = imageId.replace('img_', '');
      return `image_${timestamp}.png`;
    }
    
    // data URIから形式を取得
    const mimeMatch = dataUri.match(/data:image\/(\w+);base64,/);
    const extension = mimeMatch ? mimeMatch[1] : 'png';
    return `image_${imageId.slice(-8)}.${extension}`;
  };

  // サムネイル生成
  const createThumbnail = (dataUri: string): string => {
    return dataUri; // そのまま使用（実際のサムネイル生成は複雑なので省略）
  };

  return (
    <div className="image-list-dropdown">
      <button 
        onClick={toggleDropdown} 
        className="dropdown-trigger"
        title={imageCount > 0 ? `挿入済み画像: ${imageCount}個` : '挿入済み画像はありません'}
      >
        📋 画像一覧 ({imageCount}個)
      </button>
      
      {isOpen && (
        <div className="dropdown-content">
          {imageCount === 0 ? (
            <div className="no-images-message">
              挿入済みの画像がありません
            </div>
          ) : (
            <div className="image-list">
              {imageEntries.map(([imageId, dataUri]) => {
                const fileName = getImageFileName(imageId, dataUri);
                const thumbnail = createThumbnail(dataUri);
                
                return (
                  <div key={imageId} className="image-item">
                    <img 
                      src={thumbnail} 
                      alt={fileName} 
                      className="thumbnail"
                      onError={(e) => {
                        // サムネイル読み込みエラー時のフォールバック
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    <div className="image-info">
                      <span className="filename" title={fileName}>
                        {fileName.length > 20 ? `${fileName.slice(0, 17)}...` : fileName}
                      </span>
                      <span className="image-size">
                        {Math.round(dataUri.length / 1024)} KB
                      </span>
                    </div>
                    <button
                      onClick={() => handleImageDelete(imageId, fileName)}
                      className="delete-btn"
                      title={`${fileName} を削除`}
                    >
                      🗑️
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      
    </div>
  );
};

export default ImageListDropdown;