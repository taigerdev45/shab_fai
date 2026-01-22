import { useEffect, useState } from "react";
import { auth, db } from "../config/firebase";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { AuthContext } from "./auth";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeDoc = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        // Listen to user data changes in real-time
        unsubscribeDoc = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserData(data);
            
            // If account is paused while logged in
            if (data.status === "paused") {
              signOut(auth);
              alert("Votre compte a été suspendu par l'administrateur.");
            }
          } else {
            setUserData(null);
          }
          setLoading(false);
        }, (err) => {
          console.error("Erreur lors de l'écoute des données utilisateur:", err);
          setLoading(false);
        });
      } else {
        setUserData(null);
        unsubscribeDoc();
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeDoc();
    };
  }, []);

  const login = async (email, password) => {
    const res = await signInWithEmailAndPassword(auth, email, password);
    const docRef = doc(db, "users", res.user.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data().status === "paused") {
      await signOut(auth);
      throw new Error("Votre compte est suspendu. Veuillez contacter l'administrateur.");
    }
    return res;
  };
  
  const register = async (email, password, fullName, phone, securityQuestion, securityAnswer) => {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    const newUser = {
      uid: res.user.uid,
      email,
      fullName,
      phone,
      securityQuestion,
      securityAnswer: securityAnswer.toLowerCase().trim(),
      role: "user", // Default role
      createdAt: new Date(),
    };
    await setDoc(doc(db, "users", res.user.uid), newUser);
    setUserData(newUser);
    return res;
  };

  const updateProfile = async (updates) => {
    if (!user) return;
    const docRef = doc(db, "users", user.uid);
    if (updates.securityAnswer) {
      updates.securityAnswer = updates.securityAnswer.toLowerCase().trim();
    }
    await setDoc(docRef, updates, { merge: true });
    setUserData(prev => ({ ...prev, ...updates }));
  };

  const logout = () => signOut(auth);

  const value = {
    user,
    userData,
    login,
    register,
    updateProfile,
    logout,
    isAdmin: userData?.role === "admin" || userData?.role === "superadmin",
    isSuperAdmin: userData?.role === "superadmin",
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};