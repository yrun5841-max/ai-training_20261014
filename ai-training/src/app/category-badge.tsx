import type { Category } from "@/lib/store";

// 区分ごとのバッジの色（2色の配色に合わせる）
const badgeClass: Record<Category, string> = {
  新入社員: "bg-accent/15 text-accent-ink",
  異動者: "bg-primary/15 text-primary-ink",
  既存社員: "bg-line text-muted",
};

export function CategoryBadge({ category }: { category: Category }) {
  return (
    <span
      className={`whitespace-nowrap rounded-full px-3 py-0.5 text-sm font-medium ${badgeClass[category]}`}
    >
      {category}
    </span>
  );
}
