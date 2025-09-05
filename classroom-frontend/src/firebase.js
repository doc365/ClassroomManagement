import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyALFat_8nFH9Kk0iaT6QPW7J9Daefa3o4A",
  authDomain: "classroommanagement-91fb9.firebaseapp.com",
  projectId: "classroommanagement-91fb9",
  storageBucket: "classroommanagement-91fb9.appspot.com",
  messagingSenderId: "690389405333",
  appId: "1:690389405333:web:9c015ac4fdb8651a8d59c",
  measurementId: "G-93K27F1KD7"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
