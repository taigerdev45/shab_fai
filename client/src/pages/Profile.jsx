import React, { useState } from "react";
import { useAuth } from "../context/auth";
import { User, Phone, Mail, ShieldQuestion, Save, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Profile = () => {
  const { userData, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    securityQuestion: "",
    securityAnswer: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Sync formData with userData when it loads
  React.useEffect(() => {
    if (userData) {
      setFormData(prev => ({
        ...prev,
        fullName: userData.fullName || "",
        phone: userData.phone || "",
        securityQuestion: userData.securityQuestion || "",
      }));
    }
  }, [userData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const updates = { ...formData };
      if (!updates.securityAnswer) delete updates.securityAnswer;
      
      await updateProfile(updates);
      setMessage({ type: "success", text: "Profil mis à jour avec succès !" });
    } catch {
      setMessage({ type: "error", text: "Erreur lors de la mise à jour du profil." });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <Link to="/dashboard" className="p-2 hover:bg-white/10 rounded-full transition-all">
          <ArrowLeft size={24} />
        </Link>
        <h2 className="text-3xl font-bold">Mon Profil</h2>
      </div>

      <div className="glass-card p-8">
        <div className="flex justify-center mb-8">
          <div className="p-4 bg-blue-600/20 rounded-full border border-blue-500/30">
            <User size={48} className="text-blue-400" />
          </div>
        </div>

        {message.text && (
          <div className={`p-4 rounded-xl mb-6 text-center ${
            message.type === "success" ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <User size={16} className="text-gray-400" /> Nom complet
              </label>
              <input
                type="text"
                className="input-shaba w-full"
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Phone size={16} className="text-gray-400" /> Téléphone
              </label>
              <input
                type="tel"
                className="input-shaba w-full"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Mail size={16} className="text-gray-400" /> Email
            </label>
            <input
              type="email"
              className="input-shaba w-full opacity-50 cursor-not-allowed"
              value={userData?.email || ""}
              disabled
            />
            <p className="text-xs text-gray-500 mt-1">L'email ne peut pas être modifié.</p>
          </div>

          <hr className="border-white/10 my-8" />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <ShieldQuestion size={20} className="text-blue-400" /> Sécurité
            </h3>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-400">Question de sécurité</label>
              <select
                className="input-shaba w-full"
                value={formData.securityQuestion}
                onChange={(e) => setFormData({...formData, securityQuestion: e.target.value})}
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
              <label className="block text-sm font-medium mb-2 text-gray-400">Réponse de sécurité</label>
              <input
                type="text"
                className="input-shaba w-full"
                value={formData.securityAnswer}
                onChange={(e) => setFormData({...formData, securityAnswer: e.target.value})}
                placeholder="Laissez vide pour ne pas modifier"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-4"
          >
            <Save size={20} />
            {loading ? "Mise à jour..." : "Enregistrer les modifications"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
