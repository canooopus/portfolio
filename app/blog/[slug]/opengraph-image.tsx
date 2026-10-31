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
  data: ArrayBuffer;
  style?: "normal" | "italic";
  weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
}

/**
 * Google FontsからTrueType形式のフォントサブセットを動的に取得
 */
async function loadGoogleFont(
  family: string,
  weight: number,
  italic: boolean,
  text: string,
): Promise<ArrayBuffer | null> {
  try {
    const familyQuery = italic
      ? `${family}:ital,wght@1,${weight}`
      : `${family}:wght@${weight}`;
    const url = `https://fonts.googleapis.com/css2?family=${familyQuery}&text=${encodeURIComponent(
      text,
    )}`;

    const cssResponse = await fetch(url, {
      headers: {
        // TrueType形式を返すレガシーSafari User-Agent
        "User-Agent":
          "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1",
      },
    });

    if (!cssResponse.ok) return null;

    const css = await cssResponse.text();
    const resource = css.match(
      /src:\s*url\((.+?)\)\s*format\(['"](?:opentype|truetype)['"]\)/i,
    );

    if (resource && resource[1]) {
      const fontUrl = resource[1].replace(/['"]/g, "");
      const fontResponse = await fetch(fontUrl);
      if (fontResponse.ok) {
        return await fontResponse.arrayBuffer();
      }
    }
  } catch (error) {
    console.warn(
      `[OGP] Could not load dynamic Google Font (${family}):`,
      error,
    );
  }

  return null;
}

// Figmaからエクスポートされた背景画像（球体 + canooopus + グラデーションバー）をbase64として読み込み
const bgData = await readFile(
  join(process.cwd(), "public/images/brand/ogp.png"),
  "base64",
);
const bgSrc = `data:image/png;base64,${bgData}`;

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostMetadata(slug);

  const title = post?.title || "Blog Post";

  // Roboto Medium Italic (weight: 400) のサブセットを取得
  const robotoFont = await loadGoogleFont("Roboto", 400, true, title);

  // 日本語文字が含まれる場合は Noto Sans JP (weight: 400) も取得
  const hasJapanese = /[^\u0000-\u007F]/.test(title);
  const notoFont = hasJapanese
    ? await loadGoogleFont("Noto Sans JP", 400, false, title)
    : null;

  const fonts: FontConfig[] = [];
  if (robotoFont) {
    fonts.push({
      name: "Roboto",
      data: robotoFont,
      style: "italic",
      weight: 400,
    });
  }
  if (notoFont) {
    fonts.push({
      name: "Noto Sans JP",
      data: notoFont,
      style: "normal",
      weight: 400,
    });
  }

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
          top: 70,
          left: 72,
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
            fontSize: title.length > 50 ? 46 : title.length > 30 ? 56 : 64,
            fontFamily:
              fonts.length > 0
                ? "'Roboto', 'Noto Sans JP', sans-serif"
                : "sans-serif",
            fontStyle: "italic",
            fontWeight: 400,
            color: "#000000",
            lineHeight: 1.3,
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
