#!/usr/bin/env bash
# Stop フック: 回答の最後にテストを実行する。
# 失敗したら結果を Claude に渡して止めない（exit 2）。
# ただし、このフックで1回引き止めたあと（stop_hook_active が true）は、そのまま終わらせる。

input=$(cat)
active=$(printf '%s' "$input" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{console.log(JSON.parse(s).stop_hook_active===true)}catch{console.log(false)}})')
if [ "$active" = "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}" || exit 0

# npm run test は監視モードなので、--run で1回だけ実行する
output=$(npm run test -- --run 2>&1)
if [ $? -ne 0 ]; then
  {
    echo "テスト（npm run test -- --run）が失敗しました。lib/ の処理を直してテストを通してください（テストは変えないこと）。"
    echo
    printf '%s\n' "$output" | tail -n 150
  } >&2
  exit 2
fi
exit 0
