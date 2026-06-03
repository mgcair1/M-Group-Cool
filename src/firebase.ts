import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAScdMaZul-QF9s11VIoAPPLB5ol9YUxyI",
  authDomain: "m-group-cool.firebaseapp.com",
  projectId: "m-group-cool",
  storageBucket: "m-group-cool.firebasestorage.app",
  messagingSenderId: "683557424156",
  appId: "1:683557424156:web:eef6a153972224eb6e63d9",
  measurementId: "G-J0J8KCHRGV"
};

export const firebaseApp = initializeApp(firebaseConfig);
export const firebaseAnalytics = getAnalytics(firebaseApp);
