---
title: "PDF生成機能総合テスト文書"
author: "Claude Code AI Assistant"
date: "2025-08-29"
toc: true
theme: "default"
latex: "katex"
pageSize: "A4"
marginMm: 15
mermaid:
  theme: "default"
---

# PDF生成機能総合テスト文書

## 1. 基本的なMarkdown要素テスト

### 1.1 見出しのテスト
#### レベル4見出し
##### レベル5見出し
###### レベル6見出し

### 1.2 テキスト装飾
- **太字テスト（Bold）**
- *イタリック体テスト（Italic）*
- ***太字イタリック体***
- ~~取り消し線~~
- `インラインコード`

### 1.3 リスト
#### 箇条書きリスト
- 項目1
- 項目2
  - サブ項目2.1
  - サブ項目2.2
    - サブサブ項目2.2.1
- 項目3

#### 番号付きリスト
1. 第一項目
2. 第二項目
   1. サブ項目2.1
   2. サブ項目2.2
3. 第三項目

## 2. 数学式（LaTeX/KaTeX）テスト

### 2.1 インライン数学式
文中の数式: $E = mc^2$ や $\sqrt{x^2 + y^2}$ のテスト。

### 2.2 ブロック数学式

#### 二次方程式の解の公式
$$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$

#### 積分
$$\int_{0}^{\infty} e^{-x^2} dx = \frac{\sqrt{\pi}}{2}$$

#### 行列
$$\begin{pmatrix}
a & b \\
c & d
\end{pmatrix} \begin{pmatrix}
x \\
y
\end{pmatrix} = \begin{pmatrix}
ax + by \\
cx + dy
\end{pmatrix}$$

#### ギリシャ文字とその他記号
$$\alpha + \beta = \gamma, \quad \sum_{i=1}^{n} x_i = \frac{\partial f}{\partial x}$$

### 2.3 複雑な数式
#### フーリエ変換
$$\hat{f}(\xi) = \int_{-\infty}^{\infty} f(x) e^{-2\pi i x \xi} dx$$

## 3. HTMLタグテスト

### 3.1 基本HTMLタグ
<div style="background-color: #f0f8ff; padding: 10px; border: 1px solid #87ceeb;">
これは<strong>HTMLの div タグ</strong>内のコンテンツです。
</div>

### 3.2 テーブル（HTML）
<table border="1" style="border-collapse: collapse; width: 100%;">
<tr style="background-color: #f2f2f2;">
  <th>項目</th>
  <th>値</th>
  <th>備考</th>
</tr>
<tr>
  <td>CPU使用率</td>
  <td>45%</td>
  <td style="color: green;">正常</td>
</tr>
<tr>
  <td>メモリ使用量</td>
  <td>2.3GB</td>
  <td style="color: orange;">注意</td>
</tr>
</table>

### 3.3 カラーテスト
<p style="color: red;">赤色のテキスト</p>
<p style="color: #0066cc;">青色のテキスト（16進数）</p>
<p style="background-color: yellow; padding: 5px;">黄色背景のテキスト</p>

## 4. Markdownテーブル

| 機能名 | 実装状況 | 優先度 | 進捗率 |
|--------|----------|---------|---------|
| ファイルアップロード | ✅ 完了 | 高 | 100% |
| PDF生成 | 🔄 テスト中 | 高 | 95% |
| 検索機能 | ✅ 完了 | 中 | 100% |
| 同期機能 | ⚠️ 調整中 | 低 | 80% |

## 5. コードブロック

### 5.1 JavaScript
```javascript
function generatePdf(markdown) {
  const compiler = new MarkdownCompiler();
  const html = compiler.compile(markdown);
  return printToPDF(html, {
    pageSize: 'A4',
    margin: '15mm'
  });
}

// 数式処理
const mathExpression = 'E = mc^2';
console.log(`物理学の有名な式: ${mathExpression}`);
```

### 5.2 SQL
```sql
-- データベース検索クエリ例
SELECT 
  meeting_id,
  title,
  created_at,
  attendees
FROM meetings 
WHERE created_at >= '2025-01-01'
ORDER BY created_at DESC
LIMIT 10;
```

### 5.3 Python
```python
import numpy as np
import matplotlib.pyplot as plt

# 二次関数のグラフ
x = np.linspace(-10, 10, 100)
y = x**2 + 2*x - 3

plt.figure(figsize=(8, 6))
plt.plot(x, y, 'b-', linewidth=2)
plt.title('二次関数: y = x² + 2x - 3')
plt.grid(True)
plt.show()
```

## 6. 引用とハイライト

> これは引用文のテストです。  
> 複数行にわたる引用も正しく表示されるかを確認します。
> 
> > 入れ子の引用もテストします。

### 注意書き
> ⚠️ **重要**: この文書はPDF生成機能のテスト用です。
> 実際の会議議事録ではありません。

## 7. リンクと画像（テスト）

### 7.1 リンク
- [外部リンク例](https://www.example.com)
- [内部リンク](#1-基本的なmarkdown要素テスト)

### 7.2 画像（プレースホルダー）
![テスト画像](https://via.placeholder.com/300x200/0066cc/ffffff?text=Test+Image)

## 8. 区切り線とスペーシング

---

## 9. 特殊文字と絵文字

### 特殊文字
- 著作権記号: ©
- 登録商標: ®
- 商標: ™
- 矢印: → ← ↑ ↓
- 数学記号: ≤ ≥ ≠ ≈ ∞

### 絵文字
- ✅ 完了
- ❌ 未完了
- ⚠️ 注意
- 🔄 進行中
- 📊 データ
- 🚀 開始
- 💡 アイデア

## 10. 日本語フォント・文字テスト

### 10.1 ひらがな・カタカナ・漢字
あいうえお かきくけこ さしすせそ
アイウエオ カキクケコ サシスセソ
愛意雨恵央 書記久毛甲 桜獅子背祖

### 10.2 長い日本語テキスト
議事録作成システムは、会議の音声を自動的にテキストに変換し、人工知能を活用して整理された議事録を生成することができます。このシステムにより、会議の参加者は議事録作成の手間を大幅に削減し、会議の内容により集中することが可能になります。

### 10.3 英数字混合
System Version: 2.0.0-beta
API Endpoint: https://api.example.com/v1/meetings
Database: SQLite 3.45.0

## 11. ページ区切りテスト

この後にページ区切りを挿入します。

<div style="page-break-before: always;"></div>

## 新しいページのコンテンツ

このコンテンツは新しいページに表示されるはずです。

### 11.1 ページ区切り後の数式
$$\lim_{n \to \infty} \sum_{k=1}^n \frac{1}{k^2} = \frac{\pi^2}{6}$$

### 11.2 ページ区切り後のテーブル
| テスト項目 | 期待結果 | 実際の結果 |
|-----------|----------|------------|
| フォント描画 | 正常 | ✓ |
| 数式描画 | 正常 | ✓ |
| HTML要素 | 正常 | ✓ |
| ページ区切り | 正常 | ✓ |

## 12. 最終確認項目

### ✅ PDF生成で確認すべき項目
1. **フォント**: 日本語フォント（Noto Sans JP）が正しく適用されているか
2. **数式**: KaTeX数式が正しく描画されているか
3. **HTML**: HTMLタグが正しく解釈・描画されているか
4. **テーブル**: MarkdownテーブルとHTMLテーブルが正しく表示されているか
5. **色**: CSSの color と background-color が反映されているか
6. **ページサイズ**: A4サイズで適切なマージンが設定されているか
7. **改ページ**: page-break-before が正しく動作しているか
8. **目次**: TOC（Table of Contents）が生成されているか

---

**文書終了**: このテスト文書により、PDF生成機能の包括的な動作確認が可能です。