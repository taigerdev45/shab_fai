import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/auth";
import { LogIn, HelpCircle } from "lucide-react";
import { db } from "../config/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [resetStep, setResetStep] = useState(0); // 0: Login, 1: Email, 2: Question, 3: New Password
  const [resetData, setResetData] = useState({ email: "", question: "", answer: "", newPassword: "", userId: "" });
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || "Échec de la connexion. Vérifiez vos identifiants.");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    
    try {
      if (resetStep === 1) {
        // Find user by email
        const q = query(collection(db, "users"), where("email", "==", resetData.email));
        const snap = await getDocs(q);
        if (snap.empty) {
          setError("Aucun utilisateur trouvé avec cet email.");
          return;
        }
        const userData = snap.docs[0].data();
        setResetData({ ...resetData, question: userData.securityQuestion, userId: userData.uid, correctAnswer: userData.securityAnswer });
        setResetStep(2);
      } else if (resetStep === 2) {
        // Verify answer
        if (resetData.answer.toLowerCase().trim() === resetData.correctAnswer) {
          setResetStep(3);
        } else {
          setError("Réponse incorrecte.");
        }
      } else if (resetStep === 3) {
        // We can't update password without being logged in in Firebase Client SDK easily 
        // without recent login. But for this demo, we'll assume the security question 
        // is enough to trigger a password reset or we would use a backend function.
        // Since we don't have a backend reset function, we'll simulate success 
        // but normally this would call a secure cloud function.
        alert("Dans une version de production, une fonction sécurisée mettrait à jour le mot de passe ici. Pour le moment, veuillez contacter l'administrateur.");
        setResetStep(0);
      }
    } catch {
      setError("Une erreur est survenue.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="glass-card p-8 w-full max-w-md">
        {resetStep === 0 ? (
          <>
            <div className="flex justify-center mb-6">
              <img src="/Logo_shabfai.png" alt="ShabaFAI Logo" className="h-24 w-auto object-contain" />
            </div>
            <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-white to-blue-400 bg-clip-text text-transparent">ShabaFAI</h2>
            {error && <p className="text-red-500 text-center mb-4">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  className="input-shaba w-full"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Mot de passe</label>
                <input
                  type="password"
                  className="input-shaba w-full"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn-primary w-full">
                Se connecter
              </button>
            </form>
            <div className="mt-4 text-center">
              <button 
                onClick={() => setResetStep(1)}
                className="text-sm text-blue-400 hover:underline flex items-center justify-center gap-1 mx-auto"
              >
                <HelpCircle size={14} /> Mot de passe oublié ?
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-center mb-6">Réinitialisation</h2>
            {error && <p className="text-red-500 text-center mb-4">{error}</p>}
            <form onSubmit={handleResetPassword} className="space-y-4">
              {resetStep === 1 && (
                <div>
                  <label className="block text-sm font-medium mb-1">Entrez votre email</label>
                  <input
                    type="email"
                    className="input-shaba w-full"
                    value={resetData.email}
                    onChange={(e) => setResetData({...resetData, email: e.target.value})}
                    required
                  />
                </div>
              )}
              {resetStep === 2 && (
                <div>
                  <p className="mb-4 text-blue-300 font-medium">{resetData.question}</p>
                  <label className="block text-sm font-medium mb-1">Votre réponse</label>
                  <input
                    type="text"
                    className="input-shaba w-full"
                    value={resetData.answer}
                    onChange={(e) => setResetData({...resetData, answer: e.target.value})}
                    required
                  />
                </div>
              )}
              {resetStep === 3 && (
                <div>
                  <label className="block text-sm font-medium mb-1">Nouveau mot de passe</label>
                  <input
                    type="password"
                    className="input-shaba w-full"
                    value={resetData.newPassword}
                    onChange={(e) => setResetData({...resetData, newPassword: e.target.value})}
                    required
                  />
                </div>
              )}
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => setResetStep(0)}
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl flex-1 transition-all"
                >
                  Annuler
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {resetStep === 3 ? "Réinitialiser" : "Continuer"}
                </button>
              </div>
            </form>
          </>
        )}
        <p className="mt-6 text-center text-gray-400">
          Pas de compte ?{" "}
          <Link to="/register" className="text-blue-400 hover:underline">
            S'inscrire
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;