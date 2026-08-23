import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false, // オブジェクトではなく、直接 false を指定します
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
