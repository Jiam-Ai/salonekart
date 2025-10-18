// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// IMPORTANT: Replace these with your own Firebase project's configuration.
// In a real application, these keys should be stored securely in environment variables
// and not be hardcoded directly in the source code.
const firebaseConfig = {
  apiKey: "AIzaSyBh-vql60Ib9he20kPM48BOarZwBHgLAZk",
  authDomain: "salonekart.firebaseapp.com",
  databaseURL: "https://salonekart-default-rtdb.firebaseio.com",
  projectId: "salonekart",
  storageBucket: "salonekart.firebasestorage.app",
  messagingSenderId: "1091689227643",
  appId: "1:1091689227643:web:a6b51b3c8a8380e78109de",
  measurementId: "G-1G6WVYKQ7F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
