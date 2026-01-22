import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/auth";
import { UserPlus } from "lucide-react";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [error, setError] = useState("");
  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(email, password, fullName, phone, securityQuestion, securityAnswer);
    } catch {
      setError("Échec de l'inscription. Veuillez réessayer.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="glass-card p-8 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <img src="/Logo_shabfai.png" alt="ShabaFAI Logo" className="h-20 w-auto object-contain" />
        </div>
        <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-white to-blue-400 bg-clip-text text-transparent">Créer un compte</h2>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nom complet</label>
            <input
              type="text"
              className="input-shaba w-full"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Téléphone</label>
            <input
              type="tel"
              className="input-shaba w-full"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              className="input-shaba w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mot de passe</label>
            <input
              type="password"
              className="input-shaba w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Question de sécurité</label>
            <select
              className="input-shaba w-full"
              value={securityQuestion}
              onChange={(e) => setSecurityQuestion(e.target.value)}
              required
            >
              <option value="">Sélectionnez une question</option>
              <option value="Quel est le nom de votre premier animal de compagnie ?">Quel est le nom de votre premier animal de compagnie ?</option>
              <option value="Quelle est votre ville de naissance ?">Quelle est votre ville de naissance ?</option>
              <option value="Quel est le nom de jeune fille de votre mère ?">Quel est le nom de jeune fille de votre mère ?</option>
              <option value="Quel était le nom de votre première école ?">Quel était le nom de votre première école ?</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Réponse de sécurité</label>
            <input
              type="text"
              className="input-shaba w-full"
              value={securityAnswer}
              onChange={(e) => setSecurityAnswer(e.target.value)}
              required
              placeholder="Votre réponse..."
            />
          </div>
          <button type="submit" className="btn-primary w-full mt-4">
            S'inscrire
          </button>
        </form>
        <p className="mt-6 text-center text-gray-400">
          Déjà un compte ?{" "}
          <Link to="/login" className="text-blue-400 hover:underline">
            Se connecter
          </Link>
        </p>
        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <p className="text-xs text-gray-500 italic">
            Développé par <span className="text-blue-400/80 font-medium">Taiger Dev</span> pour une gestion optimale
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;