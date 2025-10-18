/**
 * 日時フォーマットユーティリティ
 * Phase 3.4 Refactoring: 再利用可能な日時フォーマット関数
 */

/**
 * 日時を "YYYY/MM/DD HH:MM" 形式でフォーマット
 */
export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * 日付を "YYYY/MM/DD" 形式でフォーマット
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

/**
 * 時刻を "HH:MM" 形式でフォーマット
 */
export const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * 相対時間表示 (例: "2時間前", "3日前")
 */
export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) {
    return 'たった今';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}分前`;
  } else if (diffHours < 24) {
    return `${diffHours}時間前`;
  } else if (diffDays < 30) {
    return `${diffDays}日前`;
  } else {
    return formatDate(dateString);
  }
};
