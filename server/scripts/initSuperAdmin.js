const { auth, db } = require("../config/firebase");

const superAdminData = {
  fullName: "Taiger",
  phone: "065042561",
  email: "taigermboumba@gmail.com",
  password: "Taiger@2026",
  role: "superadmin",
  securityQuestion: "Quel est votre rôle ?",
  securityAnswer: "superadmin"
};

async function initSuperAdmin() {
  try {
    console.log("Initialisation du SuperAdmin...");
    
    // Check if user already exists in Auth
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(superAdminData.email);
      console.log("Utilisateur Auth déjà existant.");
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        userRecord = await auth.createUser({
          email: superAdminData.email,
          password: superAdminData.password,
          displayName: superAdminData.fullName,
          phoneNumber: "+241" + superAdminData.phone // Gabonese prefix for example
        });
        console.log("Utilisateur Auth créé avec succès.");
      } else {
        throw error;
      }
    }

    // Create/Update Firestore document
    const userDoc = {
      uid: userRecord.uid,
      email: superAdminData.email,
      fullName: superAdminData.fullName,
      phone: superAdminData.phone,
      role: superAdminData.role,
      securityQuestion: superAdminData.securityQuestion,
      securityAnswer: superAdminData.securityAnswer.toLowerCase().trim(),
      createdAt: new Date()
    };

    await db.collection("users").doc(userRecord.uid).set(userDoc, { merge: true });
    console.log("Document Firestore créé/mis à jour avec succès.");
    
    // Set custom claims if needed (optional but good for security)
    await auth.setCustomUserClaims(userRecord.uid, { role: "superadmin" });
    console.log("Claims personnalisés (superadmin) définis.");

    console.log("Initialisation terminée !");
    process.exit(0);
  } catch (error) {
    console.error("Erreur lors de l'initialisation :", error);
    process.exit(1);
  }
}

initSuperAdmin();