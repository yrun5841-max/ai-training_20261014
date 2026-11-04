import { describe, expect, test } from "vitest";
import { formatDate, formatMonth, getCurrentRound } from "./schedule";

// 日本時間で時刻を指定する
const jst = (dateTime: string) => new Date(`${dateTime}+09:00`);

// SPEC 6章
describe("getCurrentRound: 開催日・締め切り日", () => {
  test.each([
    ["1日が金曜の月", "2027-01-01T09:00", "2027-01", "2027-01-15"],
    ["1日が木曜の月", "2026-10-01T09:00", "2026-10", "2026-10-16"],
    ["1日が土曜の月", "2026-08-01T09:00", "2026-08", "2026-08-21"],
    ["1日が日曜の月", "2026-11-01T09:00", "2026-11", "2026-11-20"],
  ])("D-1: %s でも、開催日は第3金曜になる", (_, now, key, eventDate) => {
    const round = getCurrentRound(jst(now));
    expect(round.key).toBe(key);
    expect(round.eventDate).toBe(eventDate);
  });

  test("D-2: 締め切り日は開催日の7日前になる", () => {
    expect(getCurrentRound(jst("2026-11-01T09:00")).deadline).toBe("2026-11-13");
    expect(getCurrentRound(jst("2027-01-01T09:00")).deadline).toBe("2027-01-08");
  });

  test("D-3: 締め切り日の 23:59 は受付中、翌日の 0:00 は受付終了", () => {
    expect(getCurrentRound(jst("2026-11-13T23:59:59")).isOpen).toBe(true);
    expect(getCurrentRound(jst("2026-11-14T00:00:00")).isOpen).toBe(false);
  });

  test("D-4: UTC では締め切り日でも、日本時間で翌日なら受付終了", () => {
    // UTC 11/13 23:00 = 日本時間 11/14 8:00
    expect(getCurrentRound(new Date("2026-11-13T23:00:00Z")).isOpen).toBe(false);
    // UTC 11/13 14:00 = 日本時間 11/13 23:00
    expect(getCurrentRound(new Date("2026-11-13T14:00:00Z")).isOpen).toBe(true);
  });

  test("D-5: 開催日の当日は今月の回、翌日から翌月の回になる", () => {
    const onEventDay = getCurrentRound(jst("2026-11-20T23:59:59"));
    expect(onEventDay.key).toBe("2026-11");
    expect(onEventDay.isOpen).toBe(false);

    const nextDay = getCurrentRound(jst("2026-11-21T00:00:00"));
    expect(nextDay).toEqual({
      key: "2026-12",
      eventDate: "2026-12-18",
      deadline: "2026-12-11",
      isOpen: true,
    });
  });

  test("D-6: 12月の開催日を過ぎると、翌年1月の回になる", () => {
    const round = getCurrentRound(jst("2026-12-19T09:00"));
    expect(round).toEqual({
      key: "2027-01",
      eventDate: "2027-01-15",
      deadline: "2027-01-08",
      isOpen: true,
    });
  });

  test("D-7: 上書きした月は、上書きした日付を使う", () => {
    const overrides = { "2026-12": { eventDate: "2026-12-11", deadline: "2026-12-04" } };
    expect(getCurrentRound(jst("2026-12-01T09:00"), overrides)).toEqual({
      key: "2026-12",
      eventDate: "2026-12-11",
      deadline: "2026-12-04",
      isOpen: true,
    });
    // 上書きした開催日を過ぎたら翌月の回になる
    expect(getCurrentRound(jst("2026-12-12T09:00"), overrides).key).toBe("2027-01");
    // ほかの月には影響しない
    expect(getCurrentRound(jst("2026-11-01T09:00"), overrides).eventDate).toBe("2026-11-20");
  });
});

describe("表示用の日付", () => {
  test("D-8: 日付は「11月20日（金）」の形で表示する", () => {
    expect(formatDate("2026-11-20")).toBe("11月20日（金）");
    expect(formatDate("2027-01-08")).toBe("1月8日（金）");
    expect(formatMonth("2026-11")).toBe("11月");
    expect(formatMonth("2027-01")).toBe("1月");
  });
});
