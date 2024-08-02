import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
     apiKey: "AIzaSyBzAxoOBkD6F5L_q3XSHoceI5AHQtepyNY",
     authDomain: "vaid-99446.firebaseapp.com",
     projectId: "vaid-99446",
     storageBucket: "vaid-99446.appspot.com",
     messagingSenderId: "573465165781",
     appId: "1:573465165781:web:88aa9c338a90d55923475c"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

const auth = getAuth();

export { auth, app, db };