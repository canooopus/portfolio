/**
 * タグをパステルカラーのピルとして表示する。
 * 色はタグ文字列のハッシュから決定的に選ぶため、一覧と詳細で同じタグは同じ色になる。
 */
const TAG_COLORS = [
  "bg-rose-100 text-rose-700",
  "bg-orange-100 text-orange-700",
  "bg-amber-100 text-amber-700",
  "bg-lime-100 text-lime-700",
  "bg-emerald-100 text-emerald-700",
  "bg-teal-100 text-teal-700",
  "bg-sky-100 text-sky-700",
  "bg-indigo-100 text-indigo-700",
  "bg-violet-100 text-violet-700",
  "bg-pink-100 text-pink-700",
] as const;

/**
 * 特定タグの色を固定する（キーは小文字で比較）。
 * ここに無いタグはハッシュでパレットから選ぶ。
 */
const FIXED_TAG_COLORS: Record<string, string> = {
  design: "bg-red-100 text-red-700",
  dev: "bg-orange-100 text-orange-700",
  self: "bg-sky-100 text-sky-700",
};

function colorForTag(tag: string): string {
  const fixed = FIXED_TAG_COLORS[tag.toLowerCase()];
  if (fixed) {
    return fixed;
  }

  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = (hash * 31 + tag.charCodeAt(i)) >>> 0;
  }
  return TAG_COLORS[hash % TAG_COLORS.length];
}

interface TagListProps {
  tags: string[];
  className?: string;
}

export default function TagList({ tags, className = "" }: TagListProps) {
  if (tags.length === 0) {
    return null;
  }

  return (
    <ul aria-label="Tags" className={className}>
      {tags.map((tag) => (
        <li
          key={tag}
          className={`cursor-default select-none rounded-full px-2 py-0.5 text-xs ${colorForTag(tag)}`}
        >
          {tag}
        </li>
      ))}
    </ul>
  );
}
