import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBwJFxwQZJ0SCOG-on16N4LRVwjE-ZGWYc",
  authDomain: "fs-booking-app.firebaseapp.com",
  projectId: "fs-booking-app",
  storageBucket: "fs-booking-app.firebasestorage.app",
  messagingSenderId: "977698927279",
  appId: "1:977698927279:web:fd148a3e18a87ecdd15a5a"
};

// Firebaseアプリを初期化
// Next.jsでのサーバーサイドレンダリング時の重複初期化を防ぐための記述
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };