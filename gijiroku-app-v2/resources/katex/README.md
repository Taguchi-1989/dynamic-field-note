# KaTeX オフライン リソース

このディレクトリには、オフライン環境でのKaTeX数式レンダリング用のリソースを配置します。

## 必要なファイル

### CSS
- `katex.min.css` - KaTeXのメインCSS
- `katex-fonts/` - KaTeXフォントディレクトリ

### フォント
- `KaTeX_Main-*` - メインフォント
- `KaTeX_Math-*` - 数学記号フォント
- `KaTeX_Size*` - サイズ別フォント
- `KaTeX_Typewriter-*` - タイプライターフォント

## インストール方法

1. KaTeXの配布物からCSS・フォントをコピー
2. または npm install katex 後、node_modules/katex/dist/ からコピー

```bash
# 例：npmからのコピー
cp -r node_modules/katex/dist/katex.min.css ./
cp -r node_modules/katex/dist/fonts ./katex-fonts/
```

## 使用方法

MarkdownCompilerServiceがこのディレクトリのリソースを参照して、
オフライン環境でも数式を正しくレンダリングします。

## 注意事項

- フォントファイルは著作権に注意
- PDF出力時の文字化け防止のため、必ずフォントを同梱
- パス解決は相対パスで行う（ポータブル対応）