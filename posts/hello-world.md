---
title: "Next.jsとTypeScriptで自作ブログを構築する"
date: "2026-08-02"
---

この記事は、自作ブログの初めての投稿テストです。CSSを自前で書くことで、柔軟にスタイリングが行えます。

## 自作ブログの良さ

ライブラリを最小限に留めることで、以下の恩恵を受けられます。

- バンドルサイズが小さくなる
- アップデートによるレイアウト崩れの影響を受けにくい
- 細かな余白や色使いを、ポートフォリオサイトと完璧に合わせられる

## テスト用のコードブロック

以下は、シンタックスハイライトが正常に機能しているかテストするためのTypeScriptコードです。

```typescript
interface User {
  id: number;
  name: string;
  isReady: boolean;
}

const initializeUser = (name: string): User => {
  return {
    id: Date.now(),
    name,
    isReady: true,
  };
};

console.log(initializeUser("Canooopus"));
```
