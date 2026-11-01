import { ImageResponse } from "next/og";
import { getPostMetadata, getSortedPostsData } from "@/features/blog/posts";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Canooopus Blog Post";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export function generateStaticParams() {
  const posts = getSortedPostsData();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

interface FontConfig {
  name: string;
  data: Buffer;
  style?: "normal" | "italic";
  weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
}

// Figmaからエクスポートされた背景画像（球体 + canooopus + グラデーションバー）をbase64として読み込み
// フォントはビルド時に Google Fonts へ問い合わせると Vercel のビルド環境で
// タイムアウトし prerender が失敗するため、リポジトリに同梱したファイルを読み込む
const [bgData, robotoFontData, notoSansJpFontData] = await Promise.all([
  readFile(join(process.cwd(), "public/images/brand/ogp.png"), "base64"),
  readFile(join(process.cwd(), "public/fonts/Roboto-Regular.ttf")),
  readFile(join(process.cwd(), "public/fonts/NotoSansJP-Regular.ttf")),
]);

const bgSrc = `data:image/png;base64,${bgData}`;

const fonts: FontConfig[] = [
  { name: "Roboto", data: robotoFontData, style: "normal", weight: 400 },
  {
    name: "Noto Sans JP",
    data: notoSansJpFontData,
    style: "normal",
    weight: 400,
  },
];

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostMetadata(slug);

  const title = post?.title || "Blog Post";

  return new ImageResponse(
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        backgroundColor: "#FFFFFF",
      }}
    >
      {/* Figma背景画像 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={bgSrc}
        alt=""
        width={1200}
        height={630}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 1200,
          height: 630,
        }}
      />

      {/* 記事タイトル描画エリア（左揃え：球体アイコン開始位置 X: 72px に配置） */}
      <div
        style={{
          position: "absolute",
          top: 50,
          left: 65,
          width: 1056,
          height: 360,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            // 文字数に応じて全体的に 8〜16px 程度サイズアップ
            fontSize:
              title.length > 50
                ? 54
                : title.length > 30
                  ? 66
                  : title.length > 15
                    ? 76
                    : 84,
            fontFamily: "'Roboto', 'Noto Sans JP', sans-serif",
            fontStyle: "normal",
            fontWeight: 400,
            color: "#000000",
            lineHeight: 1.25,
            letterSpacing: "-0.01em",
            wordBreak: "break-word",
          }}
        >
          {title}
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts,
    },
  );
}
