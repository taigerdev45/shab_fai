import React, { useState, useEffect } from "react";
import { db } from "../config/firebase";
import { collection, addDoc, query, where, onSnapshot, doc, getDoc, orderBy, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../context/auth";
import { Wifi, Clock, Download, AlertTriangle, Send, FileText } from "lucide-react";
import { jsPDF } from "jspdf";

const UserDashboard = () => {
  const { user, userData } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [pricing, setPricing] = useState(null);
  const [formData, setFormData] = useState({
    transactionRef: "",
    macAddress: "",
    networkType: "2.4GHz",
    paymentMethod: "Airtel Money",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Fetch subscriptions
  useEffect(() => {
    const q = query(
      collection(db, "subscriptions"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setSubscriptions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      (error) => {
        if (error.code !== "permission-denied") {
          console.error("Erreur d'écoute des abonnements:", error);
        }
        setSubscriptions([]);
      }
    );
    return unsubscribe;
  }, [user.uid]);

  // Fetch pricing
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const docRef = doc(db, "settings", "pricing");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPricing(docSnap.data());
        }
      } catch (err) {
        console.error("Erreur lors de la récupération des tarifs:", err);
      }
    };
    fetchPricing();
  }, []);

  const activeSub = subscriptions.find(s => s.status === "ACTIF");

  const generatePDF = (sub) => {
    try {
      const docPDF = new jsPDF();
      
      // Header
      docPDF.setFillColor(59, 130, 246); // Blue color
      docPDF.rect(0, 0, 210, 40, 'F');
      
      docPDF.setTextColor(255, 255, 255);
      docPDF.setFontSize(24);
      docPDF.text("SHABAFAI - REÇU", 105, 25, { align: "center" });
      
      docPDF.setTextColor(0, 0, 0);
      docPDF.setFontSize(12);
      
      const startX = 20;
      let currentY = 60;
      
      // Info Sections
      const addInfo = (label, value) => {
        docPDF.setFont("helvetica", "bold");
        docPDF.text(`${label}:`, startX, currentY);
        docPDF.setFont("helvetica", "normal");
        docPDF.text(`${value}`, startX + 50, currentY);
        currentY += 10;
      };

      addInfo("Date d'émission", new Date().toLocaleDateString());
      addInfo("ID Transaction", sub.id);
      currentY += 10;
      
      addInfo("Client", sub.fullName);
      addInfo("Téléphone", sub.phone);
      addInfo("Adresse MAC", sub.macAddress);
      addInfo("Type de Réseau", sub.networkType);
      currentY += 10;
      
      addInfo("Méthode de Paiement", sub.paymentMethod);
      addInfo("Réf. Paiement", sub.transactionRef);
      addInfo("Montant Payé", `${sub.price} CFA`);
      currentY += 10;

      if (sub.startDate && sub.endDate) {
        const start = sub.startDate.toDate ? sub.startDate.toDate() : new Date(sub.startDate);
        const end = sub.endDate.toDate ? sub.endDate.toDate() : new Date(sub.endDate);
        addInfo("Période de validité", `Du ${start.toLocaleDateString()} au ${end.toLocaleDateString()}`);
      }

      // Footer
      docPDF.setDrawColor(200, 200, 200);
      docPDF.line(20, 250, 190, 250);
      docPDF.setFontSize(10);
      docPDF.setTextColor(150, 150, 150);
      docPDF.text("Merci pour votre confiance - Équipe SHABAFAI", 105, 260, { align: "center" });
      docPDF.text("Ce document est généré automatiquement et sert de preuve de paiement.", 105, 265, { align: "center" });

      docPDF.save(`Recu_SHABAFAI_${sub.id}.pdf`);
    } catch (error) {
      console.error("PDF Error:", error);
      alert("Erreur lors de la génération du PDF.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submit déclenché");
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      console.log("Données du formulaire:", formData);
      const price = formData.networkType === "2.4GHz" ? pricing?.["2.4GHz"] : pricing?.["5GHz"];
      
      const docData = {
        userId: user.uid,
        fullName: userData?.fullName || "Anonyme",
        phone: userData?.phone || "N/A",
        ...formData,
        price: price || 0,
        status: "EN_ATTENTE",
        createdAt: serverTimestamp(),
      };

      console.log("Tentative d'envoi Firestore avec:", docData);
      
      const docRef = await addDoc(collection(db, "subscriptions"), docData);
      console.log("Document envoyé avec ID:", docRef.id);

      setMessage({ type: "success", text: "Demande envoyée avec succès !" });
      setFormData({ ...formData, transactionRef: "", macAddress: "" });
    } catch (error) {
      console.error("Erreur détaillée lors de l'envoi:", error);
      setMessage({ type: "error", text: `Erreur: ${error.message || "Problème de connexion"}` });
    }
    setLoading(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left: Subscription Form */}
      <div className="lg:col-span-1">
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Wifi className="text-blue-400" />
            Nouvelle Demande
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Type de réseau</label>
              <select 
                className="input-shaba w-full"
                value={formData.networkType}
                onChange={(e) => setFormData({...formData, networkType: e.target.value})}
              >
                <option value="2.4GHz">2.4 GHz ({pricing?.["2.4GHz"] || "..."} CFA)</option>
                <option value="5GHz">5 GHz ({pricing?.["5GHz"] || "..."} CFA)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Mode de paiement</label>
              <select 
                className="input-shaba w-full"
                value={formData.paymentMethod}
                onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
              >
                <option value="Airtel Money">Airtel Money (074021445)</option>
                <option value="Moov Money">Moov Money (065042561)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Référence Transaction</label>
              <input 
                type="text" 
                className="input-shaba w-full" 
                required
                value={formData.transactionRef}
                onChange={(e) => setFormData({...formData, transactionRef: e.target.value})}
                placeholder="Ex: 123456789"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Adresse MAC</label>
              <input 
                type="text" 
                className="input-shaba w-full" 
                required
                value={formData.macAddress}
                onChange={(e) => setFormData({...formData, macAddress: e.target.value})}
                placeholder="Ex: AA:BB:CC:DD:EE:FF"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              <Send size={18} />
              {loading ? "Envoi..." : "Envoyer la demande"}
            </button>
            
            {message.text && (
              <p className={`text-center text-sm ${message.type === "success" ? "text-green-400" : "text-red-400"}`}>
                {message.text}
              </p>
            )}
          </form>
        </div>
      </div>

      {/* Right: Active Subscription & History */}
      <div className="lg:col-span-2 space-y-8">
        {/* Active Subscription */}
        <div className="glass-card p-6 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Wifi size={120} />
          </div>
          
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Clock className="text-blue-400" />
            État de l'abonnement
          </h3>

          {activeSub ? (
            <div className="flex flex-col md:flex-row items-center gap-8">
              {activeSub.endDate && typeof activeSub.endDate.toDate === 'function' && (
                <Countdown targetDate={activeSub.endDate.toDate()} />
              )}
              <div className="flex-1 space-y-3">
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-gray-400">Réseau</span>
                  <span className="font-semibold">{activeSub.networkType}</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-gray-400">Expire le</span>
                  <span className="font-semibold">
                    {activeSub.endDate && typeof activeSub.endDate.toDate === 'function' 
                      ? activeSub.endDate.toDate().toLocaleDateString() 
                      : "Date inconnue"}
                  </span>
                </div>
                
                <button 
                  onClick={() => generatePDF(activeSub)}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600/20 text-blue-400 py-3 rounded-xl hover:bg-blue-600/30 transition-all mt-4 border border-blue-500/30"
                >
                  <Download size={18} />
                  Générer mon reçu PDF
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-gray-400">
              <AlertTriangle size={48} className="mx-auto mb-4 opacity-20" />
              <p>Aucun abonnement actif pour le moment.</p>
            </div>
          )}
        </div>

        {/* Subscription History */}
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold mb-6">Historique</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-400 text-sm border-b border-white/10">
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Montant</th>
                  <th className="pb-3">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {subscriptions.map(sub => (
                  <tr key={sub.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-4 text-sm">
                      {sub.createdAt && typeof sub.createdAt.toDate === 'function' 
                        ? sub.createdAt.toDate().toLocaleDateString() 
                        : "En cours..."}
                    </td>
                    <td className="py-4 font-medium">{sub.networkType}</td>
                    <td className="py-4 text">{sub.price} CFA</td>
                    <td className="py-4">
                      <div className="flex items-center justify-between gap-4">
                        <span className={`status-${sub.status.toLowerCase().replace(' ', '_')}`}>
                          {sub.status}
                        </span>
                        {sub.status === "ACTIF" && (
                          <button 
                            onClick={() => generatePDF(sub)}
                            className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="Générer le reçu"
                          >
                            <FileText size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const Countdown = ({ targetDate }) => {
  const calculateTimeLeft = React.useCallback(() => {
    const difference = +targetDate - +new Date();
    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        jours: Math.floor(difference / (1000 * 60 * 60 * 24)),
        heures: Math.floor((difference / (1000 * 60 * 60)) % 24),
        mins: Math.floor((difference / 1000 / 60) % 60),
      };
    } else {
      timeLeft = { jours: 0, heures: 0, mins: 0 };
    }
    return timeLeft;
  }, [targetDate]);

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 60000);
    return () => clearInterval(timer);
  }, [calculateTimeLeft]);

  const isExpiringSoon = timeLeft.jours < 2;
  const isExpired = timeLeft.jours === 0 && timeLeft.heures === 0 && timeLeft.mins === 0;

  return (
    <div className={`flex gap-4 ${isExpired ? 'text-red-500' : isExpiringSoon ? 'text-yellow-500' : 'text-blue-400'}`}>
      <div className="text-center">
        <div className="text-4xl font-bold">{timeLeft.jours}</div>
        <div className="text-xs uppercase">Jours</div>
      </div>
      <div className="text-4xl font-bold">:</div>
      <div className="text-center">
        <div className="text-4xl font-bold">{timeLeft.heures}</div>
        <div className="text-xs uppercase">Heures</div>
      </div>
      <div className="text-4xl font-bold">:</div>
      <div className="text-center">
        <div className="text-4xl font-bold">{timeLeft.mins}</div>
        <div className="text-xs uppercase">Mins</div>
      </div>
    </div>
  );
};

export default UserDashboard;
