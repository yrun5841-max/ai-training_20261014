import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// ブラウザ用の Firebase。Google ログインと ID トークンの受け取りに使う
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// ログイン状態はブラウザにも残す。サーバーの Cookie（ID トークン）が1時間で切れたとき、
// ここから新しい ID トークンを受け取って送り直すため
export function clientAuth() {
  return getAuth(getApps().length > 0 ? getApp() : initializeApp(config));
}
