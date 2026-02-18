
import { initializeApp } from "firebase/app";
import {getAuth, GoogleAuthProvider} from "firebase/auth"

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: "loginonecart-69313.firebaseapp.com",
  projectId: "loginonecart-69313",
  storageBucket: "loginonecart-69313.firebasestorage.app",
  messagingSenderId: "312828233568",
  appId: "1:312828233568:web:e916ec458d7d7e905fc005"
};


const app = initializeApp(firebaseConfig);
const auth=getAuth(app)
const provider= new GoogleAuthProvider()

export {auth,provider} 