import React, { useState, useEffect, useRef } from "react";
import { db } from "../config/firebase";
import { collection, addDoc, query, where, onSnapshot, doc, orderBy, serverTimestamp, updateDoc } from "firebase/firestore";
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
  const [showWifi, setShowWifi] = useState(false);
  const [wifiTimer, setWifiTimer] = useState(30);
  const wifiShownRef = useRef(null);

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

  // Fetch pricing real-time
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "pricing"), (docSnap) => {
      if (docSnap.exists()) {
        setPricing(docSnap.data());
      }
    }, (err) => {
      console.error("Erreur lors de la récupération des tarifs:", err);
    });
    return unsub;
  }, []);

  const activeSub = subscriptions.find(s => {
    if (s.status !== "ACTIF") return false;
    if (!s.endDate) return false;
    const endDate = s.endDate.toDate ? s.endDate.toDate() : new Date(s.endDate);
    return endDate > new Date();
  });

  // Timer logic for WiFi Modal
  useEffect(() => {
    let timer;
    if (showWifi && wifiTimer > 0) {
      timer = setInterval(() => {
        setWifiTimer((prev) => {
          if (prev <= 1) {
            setShowWifi(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showWifi, wifiTimer]);

  // Auto-show WiFi Password for 30s - Only once per subscription
  useEffect(() => {
    if (activeSub && !activeSub.wifiShownAuto && wifiShownRef.current !== activeSub.id && pricing) {
      wifiShownRef.current = activeSub.id;
      
      // Defer state updates to avoid cascading renders warning
      const timeout = setTimeout(async () => {
        setWifiTimer(30);
        setShowWifi(true);
        
        // Mark as shown in Firestore so it doesn't auto-show again
        try {
          const subRef = doc(db, "subscriptions", activeSub.id);
          await updateDoc(subRef, {
            wifiShownAuto: true
          });
        } catch (err) {
          console.error("Erreur lors de la mise à jour de l'état d'affichage WiFi:", err);
        }
      }, 0);
      
      return () => clearTimeout(timeout);
    }
  }, [activeSub, pricing]);

  const generatePDF = async (sub) => {
    try {
      const docPDF = new jsPDF();
      const logoUrl = "/Logo_shabfai.png";
      
      // Fonction pour charger l'image
      const loadImage = (url) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = url;
        });
      };

      let logoImg = null;
      try {
        logoImg = await loadImage(logoUrl);
      } catch {
        console.warn("Logo non chargé pour le PDF");
      }

      // 1. Logo en arrière-plan (Opacité réduite)
      if (logoImg) {
        docPDF.saveGraphicsState();
        docPDF.setGState(new docPDF.GState({ opacity: 0.1 }));
        docPDF.addImage(logoImg, 'PNG', 40, 80, 130, 130);
        docPDF.restoreGraphicsState();
      }
      
      // 2. Header avec Logo au centre en haut
      docPDF.setFillColor(30, 64, 175); // Darker Blue for professional look
      docPDF.rect(0, 0, 210, 65, 'F');
      
      if (logoImg) {
        // Ajout d'un cercle blanc derrière le logo pour le faire ressortir
        docPDF.setFillColor(255, 255, 255);
        docPDF.circle(105, 28, 22, 'F');
        docPDF.addImage(logoImg, 'PNG', 88, 11, 34, 34);
      }

      docPDF.setTextColor(255, 255, 255);
      docPDF.setFontSize(26);
      docPDF.setFont("helvetica", "bold");
      docPDF.text("SHABAFAI", 105, 52, { align: "center" });
      docPDF.setFontSize(14);
      docPDF.setFont("helvetica", "normal");
      docPDF.text("REÇU DE PAIEMENT OFFICIEL", 105, 60, { align: "center" });
      
      docPDF.setTextColor(0, 0, 0);
      
      const startX = 25;
      let currentY = 75;
      
      // Bordure de page
      docPDF.setDrawColor(30, 64, 175);
      docPDF.setLineWidth(0.5);
      docPDF.rect(10, 10, 190, 277);
      
      // Info Sections stylisées
      const addInfo = (label, value, isTitle = false) => {
        if (isTitle) {
          currentY += 8;
          docPDF.setFontSize(12);
          docPDF.setTextColor(30, 64, 175);
          docPDF.setFont("helvetica", "bold");
          docPDF.text(label.toUpperCase(), startX, currentY);
          currentY += 3;
          docPDF.setDrawColor(30, 64, 175);
          docPDF.setLineWidth(0.6);
          docPDF.line(startX, currentY, startX + 160, currentY);
          currentY += 9;
          docPDF.setTextColor(0, 0, 0);
          docPDF.setFontSize(10);
        } else {
          docPDF.setFont("helvetica", "bold");
          docPDF.text(`${label}:`, startX, currentY);
          docPDF.setFont("helvetica", "normal");
          docPDF.text(`${value}`, startX + 60, currentY);
          currentY += 8;
        }
      };

      addInfo("Informations du Reçu", null, true);
      addInfo("Numéro de Reçu", `REC-${sub.id.substring(0, 8).toUpperCase()}`);
      addInfo("Date d'émission", new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }));
      addInfo("Statut", "PAYÉ / ACTIF");
      currentY += 3;
      
      addInfo("Informations Client", null, true);
      addInfo("Nom Complet", sub.fullName);
      addInfo("Téléphone", sub.phone);
      addInfo("Adresse MAC", sub.macAddress);
      currentY += 3;
      
      addInfo("Détails de l'Abonnement", null, true);
      addInfo("Type de Réseau", sub.networkType);
      
      // Ajout du nom du réseau (SSID)
      const ssid = pricing?.[sub.networkType === "2.4GHz" ? "ssid24" : "ssid5"] || "SHABAFAI";
      addInfo("Nom du Réseau (SSID)", ssid);
      
      addInfo("Période de Validité", sub.startDate && sub.endDate ? 
        `Du ${sub.startDate.toDate ? sub.startDate.toDate().toLocaleDateString('fr-FR') : new Date(sub.startDate).toLocaleDateString('fr-FR')} au ${sub.endDate.toDate ? sub.endDate.toDate().toLocaleDateString('fr-FR') : new Date(sub.endDate).toLocaleDateString('fr-FR')}` 
        : "7 jours à compter de l'activation");
      currentY += 3;
      
      addInfo("Règlement", null, true);
      addInfo("Méthode de Paiement", sub.paymentMethod);
      addInfo("Référence Transaction", sub.transactionRef);
      
      // Encadré pour le montant total
      currentY += 12;
      docPDF.setFillColor(243, 244, 246);
      docPDF.rect(startX - 5, currentY - 5, 160, 18, 'F');
      docPDF.setFontSize(14);
      docPDF.setFont("helvetica", "bold");
      docPDF.text("MONTANT TOTAL PAYÉ", startX, currentY + 7);
      docPDF.setTextColor(30, 64, 175);
      docPDF.text(`${sub.price} CFA`, startX + 150, currentY + 7, { align: "right" });
      
      // Footer
      docPDF.setDrawColor(200, 200, 200);
      docPDF.setLineWidth(0.2);
      docPDF.line(20, 265, 190, 265);
      docPDF.setFontSize(9);
      docPDF.setTextColor(100, 100, 100);
      docPDF.setFont("helvetica", "italic");
      docPDF.text("ShabaFAI - L'Internet à votre portée", 105, 272, { align: "center" });
      docPDF.setFont("helvetica", "normal");
      docPDF.text("Ce reçu électronique est une preuve officielle de votre abonnement.", 105, 277, { align: "center" });
      docPDF.text("Contact Support: +241 074021445 / 065042561", 105, 282, { align: "center" });

      docPDF.save(`Recu_SHABAFAI_${sub.id}.pdf`);
    } catch (error) {
      console.error("PDF Error:", error);
      alert("Erreur lors de la génération du PDF.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
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

      await addDoc(collection(db, "subscriptions"), docData);

      setMessage({ type: "success", text: "Demande envoyée avec succès !" });
      setFormData({ ...formData, transactionRef: "", macAddress: "" });
    } catch (error) {
      console.error("Erreur détaillée lors de l'envoi:", error);
      setMessage({ type: "error", text: `Erreur: ${error.message || "Problème de connexion"}` });
    }
    setLoading(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
      {/* Left: Subscription Form */}
      <div className="lg:col-span-1 order-2 lg:order-1">
        <div className="glass-card p-4 md:p-6">
          <h3 className="text-lg md:text-xl font-bold mb-2 flex items-center gap-2">
            <Wifi className="text-blue-400" size={20} />
            Nouvelle Demande
          </h3>
          <p className="text-[10px] md:text-xs text-gray-400 mb-6 italic">Tous les abonnements sont valables pour une durée de 7 jours dès l'activation.</p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs md:text-sm font-medium mb-1">Type de réseau</label>
              <select 
                className="input-shaba w-full text-sm py-2"
                value={formData.networkType}
                onChange={(e) => setFormData({...formData, networkType: e.target.value})}
              >
                <option value="2.4GHz">2.4 GHz ({pricing?.["2.4GHz"] || "..."} CFA)</option>
                <option value="5GHz">5 GHz ({pricing?.["5GHz"] || "..."} CFA)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium mb-1">Mode de paiement</label>
              <select 
                className="input-shaba w-full text-sm py-2"
                value={formData.paymentMethod}
                onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
              >
                <option value="Airtel Money">Airtel Money (074021445)</option>
                <option value="Moov Money">Moov Money (065042561)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium mb-1">Référence Transaction</label>
              <input 
                type="text" 
                className="input-shaba w-full text-sm py-2" 
                required
                value={formData.transactionRef}
                onChange={(e) => setFormData({...formData, transactionRef: e.target.value})}
                placeholder="Ex: 123456789"
              />
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium mb-1">Adresse MAC</label>
              <input 
                type="text" 
                className="input-shaba w-full text-sm py-2" 
                required
                value={formData.macAddress}
                onChange={(e) => setFormData({...formData, macAddress: e.target.value})}
                placeholder="Ex: AA:BB:CC:DD:EE:FF"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 md:py-3 text-sm font-semibold">
              <Send size={18} />
              {loading ? "Envoi..." : "Envoyer la demande"}
            </button>
            
            {message.text && (
              <p className={`text-center text-xs md:text-sm ${message.type === "success" ? "text-green-400" : "text-red-400"}`}>
                {message.text}
              </p>
            )}
          </form>
        </div>
      </div>

      {/* Right: Active Subscription & History */}
      <div className="lg:col-span-2 space-y-6 md:y-8 order-1 lg:order-2">
        {/* Active Subscription */}
        <div className="glass-card p-4 md:p-6 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Wifi size={120} className="w-20 h-20 md:w-30 md:h-30" />
          </div>
          
          <h3 className="text-lg md:text-xl font-bold mb-4 md:mb-6 flex items-center gap-2">
            <Clock className="text-blue-400" size={20} />
            État de l'abonnement
          </h3>

          {activeSub ? (
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
              <div className="w-full md:w-auto flex justify-center scale-90 md:scale-100 origin-center">
                {activeSub.endDate && typeof activeSub.endDate.toDate === 'function' && (
                  <Countdown targetDate={activeSub.endDate.toDate()} />
                )}
              </div>
              <div className="w-full flex-1 space-y-3">
                <div className="flex justify-between border-b border-white/10 pb-2 text-sm md:text-base">
                  <span className="text-gray-400">Réseau</span>
                  <span className="font-semibold">{activeSub.networkType}</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-2 text-sm md:text-base">
                  <span className="text-gray-400">Expire le</span>
                  <span className="font-semibold text-right">
                    {activeSub.endDate && typeof activeSub.endDate.toDate === 'function' 
                      ? activeSub.endDate.toDate().toLocaleDateString() 
                      : "Date inconnue"}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  <button 
                    onClick={() => generatePDF(activeSub)}
                    className="flex items-center justify-center gap-2 bg-blue-600/20 text-blue-400 py-3 rounded-xl hover:bg-blue-600/30 transition-all border border-blue-500/30 text-sm font-medium"
                  >
                    <Download size={18} />
                    Reçu PDF
                  </button>

                  <button 
                    onClick={() => {
                      setWifiTimer(30);
                      setShowWifi(true);
                    }}
                    className="flex items-center justify-center gap-2 bg-green-600/20 text-green-400 py-3 rounded-xl hover:bg-green-600/30 transition-all border border-green-500/30 text-sm font-medium"
                  >
                    <Wifi size={18} />
                    Code WiFi
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 md:py-10 text-gray-400">
              <AlertTriangle size={40} className="mx-auto mb-4 opacity-20" />
              <p className="text-sm">Aucun abonnement actif pour le moment.</p>
            </div>
          )}
        </div>

        {/* Subscription History */}
        <div className="glass-card p-4 md:p-6 overflow-hidden">
          <h3 className="text-lg md:text-xl font-bold mb-6">Historique</h3>
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-gray-400 text-[10px] md:text-sm uppercase tracking-wider border-b border-white/10">
                    <th className="pb-3 px-4">Date</th>
                    <th className="pb-3 px-4 hidden sm:table-cell">Type</th>
                    <th className="pb-3 px-4">Montant</th>
                    <th className="pb-3 px-4 text-center">Statut</th>
                    <th className="pb-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {subscriptions.map(sub => (
                    <tr key={sub.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-4 px-4">
                        <div className="text-xs md:text-sm whitespace-nowrap">
                          {sub.createdAt && typeof sub.createdAt.toDate === 'function' 
                            ? sub.createdAt.toDate().toLocaleDateString() 
                            : "En cours..."}
                        </div>
                        <div className="sm:hidden text-[10px] text-gray-500 mt-0.5 font-medium">
                          {sub.networkType}
                        </div>
                      </td>
                      <td className="py-4 px-4 font-medium text-sm hidden sm:table-cell">{sub.networkType}</td>
                      <td className="py-4 px-4 text-xs md:text-sm whitespace-nowrap">{sub.price} CFA</td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] md:text-xs font-bold ${
                          sub.status === "ACTIF" ? "bg-green-500/20 text-green-500" : 
                          sub.status === "EN_ATTENTE" ? "bg-yellow-500/20 text-yellow-500" : 
                          "bg-red-500/20 text-red-500"
                        }`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        {sub.status === "ACTIF" && (
                          <button 
                            onClick={() => generatePDF(sub)}
                            className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors inline-flex"
                            title="Générer le reçu"
                          >
                            <FileText size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* WiFi Password Modal */}
      {showWifi && activeSub && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="glass-card p-6 md:p-8 max-w-sm w-full text-center space-y-6 border-2 border-blue-500/50 shadow-2xl shadow-blue-500/20 relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
              <Wifi size={200} className="absolute -top-20 -left-20 rotate-12" />
            </div>

            <div className="relative">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
                <Wifi className="text-blue-400" size={32} />
              </div>
              
              <h3 className="text-xl md:text-2xl font-bold text-white">Votre Mot de Passe</h3>
              <div className="space-y-1 mt-1">
                <p className="text-gray-400 text-xs md:text-sm">Réseau: <span className="text-blue-400 font-semibold">{activeSub.networkType}</span></p>
                {pricing?.[activeSub.networkType === "2.4GHz" ? "ssid24" : "ssid5"] && (
                  <p className="text-[10px] md:text-xs text-gray-500">SSID: <span className="text-blue-400/80">{pricing[activeSub.networkType === "2.4GHz" ? "ssid24" : "ssid5"]}</span></p>
                )}
              </div>
            </div>

            <div 
              className="bg-white/5 p-5 md:p-6 rounded-2xl border border-white/10 select-none relative group"
              onContextMenu={(e) => e.preventDefault()}
            >
              <div className="text-3xl md:text-4xl font-mono font-bold tracking-widest text-blue-400 drop-shadow-lg break-all">
                {activeSub.networkType === "2.4GHz" ? pricing?.wifi24 : pricing?.wifi5}
              </div>
              <p className="text-[9px] md:text-[10px] text-gray-500 mt-4 uppercase tracking-tighter">
                Saisie manuelle requise • Ne pas partager
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-1000 ease-linear"
                  style={{ width: `${(wifiTimer / 30) * 100}%` }}
                ></div>
              </div>
              <p className="text-[10px] md:text-xs text-gray-500">Disparaît dans {wifiTimer} secondes</p>
            </div>

            <button 
              onClick={() => setShowWifi(false)}
              className="w-full py-2 text-sm text-gray-400 hover:text-white transition-colors border-t border-white/5 mt-2"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
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
