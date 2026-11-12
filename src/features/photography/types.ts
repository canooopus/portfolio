export interface PhotographyItem {
  /** photographyItems 内で一意な ID。home の galleryItems.ts からも参照する */
  id: string;
  /** 元画像のパス（/images/...）。最適化は Image コンポーネント側で解決する */
  src: string;
  /** 一覧・モーダル表面に表示する短いキャプション */
  title: string;
  /** モーダル裏面に表示する説明文 */
  description: string;
  /** 撮影日（YYYY-MM-DD）。未設定なら裏面で日付を表示しない */
  date?: string;
  /** 一覧カードの縦横比（例: "4 / 3"）。未設定なら 4 / 3 */
  aspectRatio?: string;
}
