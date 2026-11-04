import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

// 部署の一覧（SPEC.md 9章「部署の一覧」が決まるまでは、仮の部署を固定で持つ）
export const departments = [
  "営業部",
  "開発部",
  "マーケティング部",
  "人事部",
  "総務部",
  "経理部",
] as const;

export const categories = ["新入社員", "異動者", "既存社員"] as const;

export type Category = (typeof categories)[number];

export type Entry = {
  id: string;
  /** 本人確認用。Cookie にも保存する */
  token: string;
  name: string;
  department: string;
  joinYear: number;
  category: Category;
  createdAt: string;
};

export type RoundData = {
  entries: Entry[];
  /** グループごとの Entry.id。シャッフル前は null */
  groups: string[][] | null;
  published: boolean;
};

type Data = Record<string, RoundData>;

// データはプロジェクト直下の data/lunch.json に保存する
const DATA_FILE = path.join(process.cwd(), "data", "lunch.json");

async function readAll(): Promise<Data> {
  try {
    return JSON.parse(await readFile(DATA_FILE, "utf-8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return {};
    throw error;
  }
}

async function writeAll(data: Data) {
  await mkdir(path.dirname(DATA_FILE), { recursive: true });
  // 書き込み途中のファイルを読まれないよう、一時ファイルに書いてから置き換える
  const tmp = `${DATA_FILE}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(data, null, 2));
  await rename(tmp, DATA_FILE);
}

const emptyRound = (): RoundData => ({ entries: [], groups: null, published: false });

export async function getRound(key: string): Promise<RoundData> {
  return (await readAll())[key] ?? emptyRound();
}

// 同時に申し込まれても書き込みが失われないよう、更新は1件ずつ順番に行う
let queue: Promise<unknown> = Promise.resolve();

export function updateRound<T>(
  key: string,
  update: (round: RoundData) => T,
): Promise<T> {
  const task = queue.then(async () => {
    const data = await readAll();
    const round = data[key] ?? emptyRound();
    const result = update(round);
    data[key] = round;
    await writeAll(data);
    return result;
  });
  queue = task.catch(() => {});
  return task;
}
