// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAR_Xd-5hyEZ1R5IialgWU8rZrLmiFYjfo",
  authDomain: "echoes-a2697.firebaseapp.com",
  projectId: "echoes-a2697",
  storageBucket: "echoes-a2697.firebasestorage.app",
  messagingSenderId: "883654479012",
  appId: "1:883654479012:web:16c44b0d43f9daf0ad6a31",
  measurementId: "G-B9W1LELEXR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);