import { useEffect, useState } from "react";
import { auth, db } from "../config/firebase";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { AuthContext } from "./auth";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          }
        } catch (err) {
          console.error("Erreur lors de la récupération des données utilisateur:", err);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  
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