# コードレビュー出力テンプレート

コードレビュー結果を提示する際の推奨フォーマットです。ユーザーが結果を一目で把握し、迅速に修正対応やディスカッションに進めるように構成されています。

---

## テンプレート例

```markdown
# 📋 コードレビュー結果

## 概要サマリー
- **レビュー対象**: `src/components/layout/FloatingMenu.tsx` (または `git diff` 差分)
- **変更の要約**: フローティングメニューの開閉アニメーションとアクセシビリティ対応の追加
- **総合判定**: ⚠️ **Changes Requested** (または ✅ **Approved** / 💬 **Comment**)
  - 全体として綺麗に設計されていますが、キーボード操作時のエッジケースと不要な再レンダリングの懸念が一部見られます。

---

## 🔍 指摘事項一覧

### 🚨 Critical (修正必須: 重大なバグ・脆弱性・データ損失)
> 該当なし (または指摘内容を記述)

### ⚠️ Warning (改善推奨: 潜在的バグ・パフォーマンス懸念・設計課題)
#### 1. [ファイル名](file:///path/to/file#L10-L25): useEffect のクリーンアップ処理の不足
- **該当箇所**: `src/components/layout/FloatingMenu.tsx:42-55`
- **問題点**: イベントリスナーの追加後、コンポーネントがアンマウントされた際のクリーンアップ関数が定義されていません。これによりメモリリークが発生する可能性があります。
- **改善案**:
  ```tsx
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { ... };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  ```

### 💡 Suggestion / Nitpick (提案: 可読性向上・より良いイディオム)
#### 1. [ファイル名](file:///path/to/file#L80): Early Return によるネストの削減
- **該当箇所**: `src/components/layout/FloatingMenu.tsx:80-95`
- **提案内容**: 条件判定で早期リターンを行うことで、インデントが深くなるのを防ぎ、可読性が向上します。

### 👏 Positive (良い点・優れた実装)
- アクセシビリティ（`aria-expanded`, `aria-label`）が丁寧に実装されており、キーボード操作にも配慮されています。
- TypeScriptの型定義が厳密に設定されており、型安全性が高く維持されています。

---

## 🚀 次のステップ
1. 上記の `⚠️ Warning` に関するクリーンアップ処理の追加
2. ご希望であれば、エージェント側で該当箇所の修正を自動適用することも可能です。「Warningを修正して」とお知らせください。
```

