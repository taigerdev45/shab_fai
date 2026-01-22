import { useState, useEffect } from "react";
import { db } from "../config/firebase";
import { collection, query, onSnapshot, doc, updateDoc, getDoc, setDoc, orderBy, where, deleteDoc } from "firebase/firestore";
import { Check, X, Settings, TrendingUp, Users, DollarSign, RefreshCw, Pause, Play, Trash2 } from "lucide-react";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

import { useAuth } from "../context/auth";
import { Navigate } from "react-router-dom";

const AdminDashboard = () => {
  const { isAdmin, isSuperAdmin } = useAuth();
  const [pendingSubs, setPendingSubs] = useState([]);
  const [allSubs, setAllSubs] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [pricing, setPricing] = useState({ "2.4GHz": 0, "5GHz": 0 });
  const [stats, setStats] = useState({ totalRevenue: 0, activeUsers: 0, totalSubs: 0 });
  const [tab, setTab] = useState("requests"); // requests, pricing, stats, users, admin_management

  const API_URL = window.location.hostname === "localhost" ? "http://localhost:5000/api" : "/api";

  // Fetch data
  useEffect(() => {
    if (!isAdmin) return;

    // Pending Subscriptions
    const qPending = query(
      collection(db, "subscriptions"), 
      where("status", "==", "EN_ATTENTE"), 
      orderBy("createdAt", "desc")
    );
    
    const unsubPending = onSnapshot(
      qPending,
      (snap) => {
        setPendingSubs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      (error) => {
        if (error.code !== "permission-denied") {
          console.error("Erreur d'écoute des demandes:", error);
        }
        setPendingSubs([]);
      }
    );

    // All Subscriptions
    const qAll = query(collection(db, "subscriptions"), orderBy("createdAt", "desc"));
    const unsubAll = onSnapshot(
      qAll,
      (snap) => {
        const subs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllSubs(subs);
        
        const active = subs.filter(s => s.status === "ACTIF").length;
        const revenue = subs.filter(s => s.status === "ACTIF").reduce((acc, curr) => acc + (curr.price || 0), 0);
        setStats({ totalRevenue: revenue, activeUsers: active, totalSubs: subs.length });
      },
      (error) => {
        if (error.code !== "permission-denied") {
          console.error("Erreur d'écoute des abonnements:", error);
        }
        setAllSubs([]);
        setStats({ totalRevenue: 0, activeUsers: 0, totalSubs: 0 });
      }
    );

    // All Users (for SuperAdmin)
    let unsubUsers = () => {};
    if (isSuperAdmin) {
      const qUsers = query(collection(db, "users"), orderBy("createdAt", "desc"));
      unsubUsers = onSnapshot(
        qUsers,
        (snap) => {
          setAllUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        },
        (error) => {
          if (error.code !== "permission-denied") {
            console.error("Erreur d'écoute des utilisateurs:", error);
          }
          setAllUsers([]);
        }
      );
    }

    // Pricing real-time
    const unsubPricing = onSnapshot(doc(db, "settings", "pricing"), (snap) => {
      if (snap.exists()) setPricing(snap.data());
    }, (err) => {
      console.error("Pricing fetch error:", err);
    });

    return () => { unsubPending(); unsubAll(); unsubUsers(); unsubPricing(); };
  }, [isAdmin, isSuperAdmin]);

  const toggleAdminRole = async (userId, currentRole) => {
    if (!isSuperAdmin) return;
    try {
      const newRole = currentRole === "admin" ? "user" : "admin";
      await updateDoc(doc(db, "users", userId), { role: newRole });
    } catch (error) {
      console.error("Error toggling admin role:", error);
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    if (!isSuperAdmin) return;
    try {
      const newStatus = currentStatus === "paused" ? "active" : "paused";
      await updateDoc(doc(db, "users", userId), { status: newStatus });
    } catch (error) {
      console.error("Error toggling user status:", error);
      alert("Erreur lors du changement de statut.");
    }
  };

  const deleteUser = async (userId, userName) => {
     if (!isSuperAdmin) return;
     if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${userName} ? Cette action est irréversible.`)) {
       try {
         // En production, il faudrait aussi supprimer l'utilisateur de Firebase Auth via une Cloud Function
         await updateDoc(doc(db, "users", userId), { 
           deleted: true, 
           status: "deleted",
           email: `deleted_${Date.now()}_${userId}@shabfai.com` // Pour libérer l'email si besoin (optionnel)
         });
         // Pour cette démo, on va simplement supprimer le document Firestore
         // Mais marquer comme supprimé est souvent plus sûr pour l'historique
         // await deleteDoc(doc(db, "users", userId)); 
         
         // Finalement, on va juste le supprimer du listing en filtrant côté client ou en ajoutant un where("deleted", "==", false)
         await updateDoc(doc(db, "users", userId), { role: "deleted", status: "deleted" });
         alert("Utilisateur supprimé de la liste de gestion.");
       } catch (error) {
         console.error("Error deleting user:", error);
         alert("Erreur lors de la suppression.");
       }
     }
   };

   const deleteSubscription = async (subId) => {
     if (!isSuperAdmin) return;
     if (window.confirm("Êtes-vous sûr de vouloir supprimer cet abonnement ?")) {
       try {
         await deleteDoc(doc(db, "subscriptions", subId));
         alert("Abonnement supprimé avec succès.");
       } catch (error) {
         console.error("Error deleting subscription:", error);
         alert("Erreur lors de la suppression de l'abonnement.");
       }
     }
   };

  const handleAction = async (subId, action) => {
    try {
      if (action === "APPROVE") {
        // 1. Récupérer les données de la demande
        const subRef = doc(db, "subscriptions", subId);
        const subSnap = await getDoc(subRef);
        if (!subSnap.exists()) return;

        // 2. Calculer les dates
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + 7); // Durée de 7 jours

        // 3. Mettre à jour Firestore
        await updateDoc(subRef, {
          status: "ACTIF",
          startDate,
          endDate
        });

        alert("Demande approuvée ! L'abonnement est actif pour 7 jours.");
      } else {
        // Rejeter
        await updateDoc(doc(db, "subscriptions", subId), { status: "REJETÉ" });
      }
    } catch (error) {
      console.error("Action error:", error);
      alert("Erreur lors de l'action : " + error.message);
    }
  };

  const updatePricing = async (e) => {
    e.preventDefault();
    try {
      const pricingRef = doc(db, "settings", "pricing");
      
      // Utilisation de setDoc avec merge: true pour gérer à la fois la création et la mise à jour
      // Cela évite l'erreur si le document n'existe pas encore
      await setDoc(pricingRef, pricing, { merge: true });
      
      alert("Tarifs mis à jour avec succès !");
    } catch (error) {
      console.error("Erreur mise à jour tarifs:", error);
      alert("Erreur lors de la mise à jour : " + error.message);
    }
  };

  if (!isAdmin) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="space-y-8">
      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <StatCard icon={<DollarSign className="text-green-400" size={20} />} title="Revenus" value={`${stats.totalRevenue}`} unit="CFA" />
        <StatCard icon={<Users className="text-blue-400" size={20} />} title="Abonnés" value={stats.activeUsers} />
        <div className="col-span-2 md:col-span-1">
          <StatCard icon={<TrendingUp className="text-purple-400" size={20} />} title="Total Demandes" value={stats.totalSubs} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-nowrap overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap gap-2 md:gap-4 mb-8 scrollbar-hide">
        {[
          { id: "requests", label: "Demandes", icon: RefreshCw },
          { id: "users", label: "Abonnés", icon: Users },
          { id: "stats", label: "Stats", icon: TrendingUp },
          { id: "pricing", label: "Config", icon: Settings },
          isSuperAdmin && { id: "admin_management", label: "Gestion Utilisateurs", icon: Users },
        ].filter(Boolean).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 md:px-6 md:py-3 rounded-xl transition-all whitespace-nowrap text-sm font-medium ${
              tab === t.id 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50" 
                : "bg-gray-800/50 text-gray-400 hover:bg-gray-800 border border-white/5"
            }`}
          >
            <t.icon size={16} className="md:w-[18px]" />
            {t.label}
            {t.id === "requests" && pendingSubs.length > 0 && (
              <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {pendingSubs.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-6">
        {tab === "requests" && (
          <div className="glass-card p-4 md:p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <RefreshCw className="text-blue-400 animate-spin-slow" size={24} />
                Demandes en attente
              </h3>
              <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded-full border border-blue-500/30">
                {pendingSubs.length} nouvelle(s)
              </span>
            </div>
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <div className="inline-block min-w-full align-middle">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-gray-400 text-xs uppercase tracking-wider border-b border-white/10">
                      <th className="pb-3 px-4 font-semibold">Client</th>
                      <th className="pb-3 px-4 hidden sm:table-cell font-semibold">Réseau</th>
                      <th className="pb-3 px-4 hidden md:table-cell font-semibold">Paiement</th>
                      <th className="pb-3 px-4 font-semibold">Référence</th>
                      <th className="pb-3 px-4 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {pendingSubs.map(sub => (
                      <tr key={sub.id} className="hover:bg-white/5 transition-colors group">
                        <td className="py-4 px-4">
                          <div className="flex flex-col">
                            <span className="font-medium text-sm md:text-base text-white group-hover:text-blue-400 transition-colors">{sub.fullName}</span>
                            <span className="text-[10px] md:text-xs text-gray-500">{sub.phone}</span>
                            <div className="sm:hidden text-[10px] text-blue-400 mt-1">{sub.networkType}</div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm hidden sm:table-cell">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            sub.networkType === "5GHz" ? "bg-purple-500/10 text-purple-400" : "bg-blue-500/10 text-blue-400"
                          }`}>
                            {sub.networkType}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm hidden md:table-cell">
                          <span className="text-gray-300 bg-white/5 px-2 py-1 rounded text-xs">{sub.paymentMethod}</span>
                        </td>
                        <td className="py-4 px-4">
                          <code className="font-mono text-[10px] md:text-xs text-blue-300 bg-blue-500/5 px-2 py-1 rounded">
                            {sub.transactionRef}
                          </code>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleAction(sub.id, "APPROVE")}
                              className="p-2 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500/20 border border-green-500/20 transition-all transform hover:scale-110"
                              title="Valider"
                            >
                              <Check size={18} />
                            </button>
                            <button 
                              onClick={() => handleAction(sub.id, "REJECT")}
                              className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 border border-red-500/20 transition-all transform hover:scale-110"
                              title="Rejeter"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  {pendingSubs.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center gap-2">
                          <Check className="text-green-500/30" size={48} />
                          <span>Aucune demande en attente.</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

        {tab === "admin_management" && isSuperAdmin && (
          <div className="glass-card p-4 md:p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Settings className="text-blue-400" size={24} />
                Gestion des Utilisateurs
              </h3>
            </div>
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <div className="inline-block min-w-full align-middle">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-gray-400 text-xs uppercase tracking-wider border-b border-white/10">
                      <th className="px-4 pb-3 font-semibold">Utilisateur</th>
                      <th className="px-4 pb-3 hidden md:table-cell font-semibold">Email</th>
                      <th className="px-4 pb-3 font-semibold">Rôle</th>
                      <th className="px-4 pb-3 font-semibold">Statut</th>
                      <th className="px-4 pb-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {allUsers
                      .filter(u => u.role !== "superadmin" && u.role !== "deleted")
                      .map((u) => (
                      <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-4 py-4">
                          <div className="flex flex-col">
                            <span className="font-medium text-sm md:text-base text-white group-hover:text-blue-400 transition-colors">{u.fullName}</span>
                            <span className="text-[10px] text-gray-500 md:hidden">{u.email}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-400 hidden md:table-cell">{u.email}</td>
                        <td className="px-4 py-4">
                          <button 
                            onClick={() => toggleAdminRole(u.id, u.role)}
                            className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider transition-all border ${
                              u.role === "admin" 
                                ? "bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30" 
                                : "bg-gray-500/20 text-gray-400 border-gray-500/30 hover:bg-gray-500/30"
                            }`}
                          >
                            {u.role || "user"}
                          </button>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider border ${
                            u.status === "paused" 
                              ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" 
                              : "bg-green-500/20 text-green-400 border-green-500/30"
                          }`}>
                            {u.status === "paused" ? "SUSPENDU" : "ACTIF"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => toggleUserStatus(u.id, u.status)}
                              className={`p-2 rounded-lg transition-all border ${
                                u.status === "paused" 
                                  ? "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20" 
                                  : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20"
                              }`}
                              title={u.status === "paused" ? "Réactiver" : "Mettre en pause"}
                            >
                              {u.status === "paused" ? <Play size={16} /> : <Pause size={16} />}
                            </button>
                            <button 
                              onClick={() => deleteUser(u.id, u.fullName)}
                              className="p-2 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 rounded-lg transition-all"
                              title="Supprimer"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === "users" && (
          <div className="glass-card p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Users className="text-blue-400" size={24} />
                Liste des abonnés
              </h3>
              <div className="text-sm text-gray-400">
                {allSubs.length} abonnement(s) au total
              </div>
            </div>

            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-gray-400 text-xs uppercase tracking-wider border-b border-white/10">
                      <th className="px-4 pb-3 font-semibold">Client</th>
                      <th className="px-4 pb-3 font-semibold">MAC Address</th>
                      <th className="px-4 pb-3 font-semibold">Réseau</th>
                      <th className="px-4 pb-3 font-semibold">Période</th>
                      <th className="px-4 pb-3 font-semibold">Statut</th>
                      {isSuperAdmin && <th className="px-4 pb-3 font-semibold text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {allSubs.map(sub => (
                      <tr key={sub.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-4 py-4">
                          <div className="flex flex-col">
                            <span className="font-medium text-white group-hover:text-blue-400 transition-colors">{sub.fullName}</span>
                            <span className="text-xs text-gray-500">{sub.phone}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <code className="text-xs font-mono bg-white/5 px-2 py-1 rounded text-blue-300">
                            {sub.macAddress}
                          </code>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            sub.networkType === "5GHz" ? "bg-purple-500/10 text-purple-400" : "bg-blue-500/10 text-blue-400"
                          }`}>
                            {sub.networkType}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col text-xs text-gray-400">
                            {sub.startDate && typeof sub.startDate.toDate === 'function' && sub.endDate && typeof sub.endDate.toDate === 'function' ? (
                              <>
                                <span>Du {sub.startDate.toDate().toLocaleDateString()}</span>
                                <span>Au {sub.endDate.toDate().toLocaleDateString()}</span>
                              </>
                            ) : (
                              <span className="text-yellow-500/70">Période non définie</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-tighter ${
                            sub.status === "ACTIF" ? "bg-green-500/20 text-green-400 border border-green-500/30" :
                            sub.status === "EN_ATTENTE" ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" :
                            "bg-red-500/20 text-red-400 border border-red-500/30"
                          }`}>
                            {sub.status || "INCONNU"}
                          </span>
                        </td>
                        {isSuperAdmin && (
                          <td className="px-4 py-4 text-right">
                            <button 
                              onClick={() => deleteSubscription(sub.id)}
                              className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/30 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                              title="Supprimer l'abonnement"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                    {allSubs.length === 0 && (
                      <tr>
                        <td colSpan={isSuperAdmin ? 6 : 5} className="py-10 text-center text-gray-500">
                          Aucun abonnement trouvé.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === "pricing" && (
          <div className="glass-card p-8 max-w-lg mx-auto">
            <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
              <Settings className="text-blue-400" />
              Configuration Système
            </h3>
            <form onSubmit={updatePricing} className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-400 border-b border-white/10 pb-2">Tarifs (CFA / 7 jours)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">2.4 GHz</label>
                    <input 
                      type="number" 
                      className="input-shaba w-full" 
                      value={pricing?.["2.4GHz"] || 0}
                      onChange={(e) => setPricing({...pricing, "2.4GHz": parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">5 GHz</label>
                    <input 
                      type="number" 
                      className="input-shaba w-full" 
                      value={pricing?.["5GHz"] || 0}
                      onChange={(e) => setPricing({...pricing, "5GHz": parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <h4 className="font-semibold text-gray-400 border-b border-white/10 pb-2">Mots de passe Wi-Fi</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Mots de passe 2.4G</label>
                    <input 
                      type="text" 
                      className="input-shaba w-full" 
                      placeholder="Psw 2.4GHz"
                      value={pricing?.["wifi24"] || ""}
                      onChange={(e) => setPricing({...pricing, "wifi24": e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Mots de passe 5G</label>
                    <input 
                      type="text" 
                      className="input-shaba w-full" 
                      placeholder="Psw 5GHz"
                      value={pricing?.["wifi5"] || ""}
                      onChange={(e) => setPricing({...pricing, "wifi5": e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {isSuperAdmin && (
                <div className="space-y-4 pt-4">
                  <h4 className="font-semibold text-red-400/80 border-b border-red-500/10 pb-2 flex items-center gap-2">
                    <Settings size={16} />
                    Noms des Réseaux (SSID) - Super Admin
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-400">SSID 2.4GHz</label>
                      <input 
                        type="text" 
                        className="input-shaba w-full border-red-500/10 focus:border-red-500/30" 
                        placeholder="Ex: Shaba_2.4G"
                        value={pricing?.["ssid24"] || ""}
                        onChange={(e) => setPricing({...pricing, "ssid24": e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-400">SSID 5GHz</label>
                      <input 
                        type="text" 
                        className="input-shaba w-full border-red-500/10 focus:border-red-500/30" 
                        placeholder="Ex: Shaba_5G"
                        value={pricing?.["ssid5"] || ""}
                        onChange={(e) => setPricing({...pricing, "ssid5": e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              )}

              <button type="submit" className="btn-primary w-full mt-6">
                Enregistrer les configurations
              </button>
            </form>
          </div>
        )}

        {tab === "stats" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold mb-6">Revenus par type de réseau</h3>
              <Bar 
                data={{
                  labels: ["2.4 GHz", "5 GHz"],
                  datasets: [{
                    label: "CFA",
                    data: [
                      allSubs.filter(s => s.status === "ACTIF" && s.networkType === "2.4GHz").reduce((acc, curr) => acc + (curr.price || 0), 0),
                      allSubs.filter(s => s.status === "ACTIF" && s.networkType === "5GHz").reduce((acc, curr) => acc + (curr.price || 0), 0)
                    ],
                    backgroundColor: ["rgba(59, 130, 246, 0.5)", "rgba(147, 51, 234, 0.5)"],
                    borderColor: ["#3b82f6", "#9333ea"],
                    borderWidth: 1,
                  }]
                }}
                options={{ responsive: true, scales: { y: { beginAtZero: true } } }}
              />
            </div>
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold mb-6">Évolution des abonnements</h3>
              <Line 
                data={{
                  labels: ["Sem 1", "Sem 2", "Sem 3", "Sem 4"],
                  datasets: [{
                    label: "Nouveaux Abonnés",
                    data: [12, 19, 15, 25], // Mock data, can be derived from allSubs
                    borderColor: "#3b82f6",
                    tension: 0.4,
                  }]
                }}
                options={{ responsive: true }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ icon, title, value, unit }) => (
  <div className="glass-card p-4 md:p-6 flex items-center gap-3 md:gap-4 border border-white/5">
    <div className="p-2.5 md:p-3 bg-white/5 rounded-xl shrink-0">{icon}</div>
    <div className="min-w-0">
      <div className="text-[10px] md:text-sm text-gray-400 uppercase tracking-wider truncate">{title}</div>
      <div className="text-lg md:text-2xl font-bold flex items-baseline gap-1">
        {value}
        {unit && <span className="text-[10px] md:text-xs font-normal text-gray-500">{unit}</span>}
      </div>
    </div>
  </div>
);

export default AdminDashboard;
