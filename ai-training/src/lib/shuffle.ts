import type { Entry } from "./store";

// グループ分けのルール（SPEC.md 5章）

/** 3人ずつに分け、余った人は4人のグループに入れる。3人未満なら開催しない（空配列）。 */
export function groupSizes(count: number): number[] {
  // 3人未満は開催しない（SPEC.md 5.1）
  if (count < 3) return [];
  const groups = Math.floor(count / 3);
  const remainder = count % 3;
  // 5人のときは例外として 1グループ5人にする（SPEC.md 5.1）
  if (groups === 1) return [count];
  return Array.from({ length: groups }, (_, i) => (i < remainder ? 4 : 3));
}

function shuffled<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// 条件の優先順位（SPEC.md 5.2）を重みで表す。上の条件の1件は、下の条件を全部合わせたより重い
const WEIGHT = { department: 1_000_000, noExisting: 1_000, sameJoinYear: 1 };

const isExisting = (e: Entry) => e.category === "既存社員";

/** グループの減点。同じ部署の「余分な人数」、既存社員がいない、全員の入社年が同じ */
function groupPenalty(group: Entry[]) {
  const departments = new Set(group.map((e) => e.department)).size;
  let penalty = (group.length - departments) * WEIGHT.department;
  if (!group.some(isExisting)) penalty += WEIGHT.noExisting;
  if (group.length > 1 && new Set(group.map((e) => e.joinYear)).size === 1) {
    penalty += WEIGHT.sameJoinYear;
  }
  return penalty;
}

const totalPenalty = (groups: Entry[][]) => groups.reduce((sum, g) => sum + groupPenalty(g), 0);

/** どう分けてもこれより減点を小さくできない値。ここに届けば最善と分かる */
function lowerBound(entries: Entry[], groupCount: number) {
  const countBy = (key: (e: Entry) => string | number) => {
    const counts = new Map<string | number, number>();
    for (const e of entries) counts.set(key(e), (counts.get(key(e)) ?? 0) + 1);
    return [...counts.values()];
  };
  // 部署の人数がグループ数を超えた分は、どこかで必ず重複する
  const department = countBy((e) => e.department).reduce((sum, c) => sum + Math.max(0, c - groupCount), 0);
  // 既存社員がグループ数より少なければ、その分のグループには入れられない
  const noExisting = Math.max(0, groupCount - entries.filter(isExisting).length);
  // いちばん多い入社年以外の人が入らないグループは、全員が同じ入社年になる
  const sameJoinYear = Math.max(0, groupCount - (entries.length - Math.max(...countBy((e) => e.joinYear))));
  return (
    department * WEIGHT.department + noExisting * WEIGHT.noExisting + sameJoinYear * WEIGHT.sameJoinYear
  );
}

/** ランダムな順に、減点がいちばん増えないグループへ入れていく */
function greedy(entries: Entry[], sizes: number[]): Entry[][] {
  const groups: Entry[][] = sizes.map(() => []);
  const ordered = [...shuffled(entries.filter(isExisting)), ...shuffled(entries.filter((e) => !isExisting(e)))];
  for (const entry of ordered) {
    let best = -1;
    let bestValue = Infinity;
    for (const [i, group] of groups.entries()) {
      if (group.length >= sizes[i]) continue;
      // 空のグループを優先して埋める（既存社員を1人ずつ配るため）
      const value = groupPenalty([...group, entry]) - groupPenalty(group) - (group.length === 0 ? 1e9 : 0);
      if (value < bestValue) {
        best = i;
        bestValue = value;
      }
    }
    groups[best].push(entry);
  }
  return groups;
}

/** 2人を入れ替えて減点が減る限り、入れ替え続ける */
function improveBySwaps(groups: Entry[][]) {
  let improved = true;
  while (improved) {
    improved = false;
    for (let a = 0; a < groups.length; a++) {
      for (let b = a + 1; b < groups.length; b++) {
        for (let i = 0; i < groups[a].length; i++) {
          for (let j = 0; j < groups[b].length; j++) {
            const before = groupPenalty(groups[a]) + groupPenalty(groups[b]);
            [groups[a][i], groups[b][j]] = [groups[b][j], groups[a][i]];
            if (groupPenalty(groups[a]) + groupPenalty(groups[b]) < before) {
              improved = true;
            } else {
              [groups[a][i], groups[b][j]] = [groups[b][j], groups[a][i]];
            }
          }
        }
      }
    }
  }
  return groups;
}

/**
 * すべての組み合わせを順に調べ、best より減点の小さいグループ分けを探す。
 * target（下限）に届いたらそこで終わる。調べる数が limit を超えたら、それまでの最善を返す。
 */
function exhaustiveSearch(
  entries: Entry[],
  sizes: number[],
  best: { groups: Entry[][]; penalty: number },
  target: number,
  limit: number,
) {
  // 同じ部署の人が多い順に置くと、早く行き詰まりに気づける
  const departmentCount = new Map<string, number>();
  for (const e of entries) departmentCount.set(e.department, (departmentCount.get(e.department) ?? 0) + 1);
  const ordered = shuffled(entries).sort(
    (x, y) => departmentCount.get(y.department)! - departmentCount.get(x.department)!,
  );
  const remainingExisting = ordered.map((_, i) => ordered.slice(i).filter(isExisting).length);

  const groups: Entry[][] = sizes.map(() => []);
  let nodes = 0;

  const search = (index: number, penalty: number) => {
    if (best.penalty <= target || nodes++ > limit) return;
    if (index === ordered.length) {
      if (penalty < best.penalty) best = { groups: groups.map((g) => [...g]), penalty };
      return;
    }
    // まだ既存社員がいないグループに、残りの既存社員が足りなければ、その分は必ず減点になる
    const lacking = groups.filter((g) => !g.some(isExisting)).length;
    const unavoidable = Math.max(0, lacking - remainingExisting[index]) * WEIGHT.noExisting;
    if (penalty + unavoidable >= best.penalty) return;

    const entry = ordered[index];
    const triedEmpty = new Set<number>();
    for (const [i, group] of groups.entries()) {
      if (group.length >= sizes[i]) continue;
      // 同じ人数の空のグループは、どれに入れても同じなので1つだけ試す
      if (group.length === 0) {
        if (triedEmpty.has(sizes[i])) continue;
        triedEmpty.add(sizes[i]);
      }
      const before = partialPenalty(group);
      group.push(entry);
      const after = group.length === sizes[i] ? groupPenalty(group) : partialPenalty(group);
      search(index + 1, penalty - before + after);
      group.pop();
    }
  };

  // 人数がそろう前のグループは、部署の重複だけを数える（既存社員・入社年はそろってから判定する）
  const partialPenalty = (group: Entry[]) =>
    (group.length - new Set(group.map((e) => e.department)).size) * WEIGHT.department;

  search(0, 0);
  return best;
}

/**
 * 条件をできるだけ満たすグループ分けを返す（SPEC.md 5.2）。
 * 条件をすべて満たせる組み合わせがあれば、必ずそれを返す。組み合わせは実行するたびに変わる。
 */
export function shuffle(entries: Entry[], attempts = 30): Entry[][] {
  const sizes = shuffled(groupSizes(entries.length));
  if (sizes.length === 0) return [];

  const target = lowerBound(entries, sizes.length);
  let best = { groups: [] as Entry[][], penalty: Infinity };
  for (let i = 0; i < attempts && best.penalty > target; i++) {
    const groups = improveBySwaps(greedy(entries, sizes));
    const penalty = totalPenalty(groups);
    if (penalty < best.penalty) best = { groups, penalty };
  }

  if (best.penalty > target) {
    best = exhaustiveSearch(entries, sizes, best, target, 2_000_000);
  }
  return shuffled(best.groups);
}

/** 管理者に見せる警告（SPEC.md 5.3） */
export function groupWarnings(group: Entry[]): string[] {
  const warnings: string[] = [];
  const departments = group.map((e) => e.department);
  const duplicated = [...new Set(departments.filter((d, i) => departments.indexOf(d) !== i))];
  if (duplicated.length > 0) warnings.push(`同じ部署の人がいます（${duplicated.join("、")}）`);
  if (!group.some(isExisting)) warnings.push("既存社員がいません");
  if (new Set(group.map((e) => e.joinYear)).size === 1) warnings.push("全員の入社年が同じです");
  return warnings;
}
