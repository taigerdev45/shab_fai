import { useState, useEffect } from "react";
import { db } from "../config/firebase";
import { collection, query, onSnapshot, doc, updateDoc, getDoc, orderBy, where } from "firebase/firestore";
import { Check, X, Settings, TrendingUp, Users, DollarSign, RefreshCw } from "lucide-react";
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

    // Pricing
    const fetchPricing = async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "pricing"));
        if (snap.exists()) setPricing(snap.data());
      } catch (err) {
        console.error("Pricing fetch error:", err);
      }
    };
    fetchPricing();

    return () => { unsubPending(); unsubAll(); unsubUsers(); };
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
        endDate.setDate(startDate.getDate() + 30); // 30 jours par défaut

        // 3. Mettre à jour Firestore
        await updateDoc(subRef, {
          status: "ACTIF",
          startDate,
          endDate
        });

        alert("Demande approuvée ! Le reçu sera disponible pour l'utilisateur.");
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
      await updateDoc(doc(db, "settings", "pricing"), pricing);
      alert("Tarifs mis à jour !");
    } catch {
      alert("Erreur lors de la mise à jour.");
    }
  };

  if (!isAdmin) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="space-y-8">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon={<DollarSign className="text-green-400" />} title="Revenus Totaux" value={`${stats.totalRevenue} CFA`} />
        <StatCard icon={<Users className="text-blue-400" />} title="Abonnés Actifs" value={stats.activeUsers} />
        <StatCard icon={<TrendingUp className="text-purple-400" />} title="Total Demandes" value={stats.totalSubs} />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-4 mb-8">
        {[
          { id: "requests", label: "Demandes", icon: RefreshCw },
          { id: "users", label: "Abonnés", icon: Users },
          { id: "stats", label: "Statistiques", icon: TrendingUp },
          { id: "pricing", label: "Tarification", icon: Settings },
          isSuperAdmin && { id: "admin_management", label: "Gestion Admins", icon: Users },
        ].filter(Boolean).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${
              tab === t.id 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50" 
                : "bg-gray-800/50 text-gray-400 hover:bg-gray-800"
            }`}
          >
            <t.icon size={18} />
            {t.label}
            {t.id === "requests" && pendingSubs.length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {pendingSubs.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-6">
        {tab === "requests" && (
          <div className="glass-card p-6">
            <h3 className="text-xl font-bold mb-6">Demandes en attente</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-gray-400 text-sm border-b border-white/10">
                    <th className="pb-3">Client</th>
                    <th className="pb-3">Réseau</th>
                    <th className="pb-3">Paiement</th>
                    <th className="pb-3">Référence</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {pendingSubs.map(sub => (
                    <tr key={sub.id} className="hover:bg-white/5">
                      <td className="py-4">
                        <div className="font-medium">{sub.fullName}</div>
                        <div className="text-xs text-gray-500">{sub.phone}</div>
                      </td>
                      <td className="py-4 text-sm">{sub.networkType}</td>
                      <td className="py-4 text-sm">{sub.paymentMethod}</td>
                      <td className="py-4 font-mono text-xs">{sub.transactionRef}</td>
                      <td className="py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleAction(sub.id, "APPROVE")}
                            className="p-2 bg-green-500/20 text-green-500 rounded-lg hover:bg-green-500/30 transition-colors"
                            title="Valider"
                          >
                            <Check size={18} />
                          </button>
                          <button 
                            onClick={() => handleAction(sub.id, "REJECT")}
                            className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30 transition-colors"
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
                      <td colSpan="5" className="py-10 text-center text-gray-500">Aucune demande en attente.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "admin_management" && isSuperAdmin && (
          <div className="glass-card p-6">
            <h3 className="text-xl font-bold mb-6">Gestion des Administrateurs</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-gray-400 text-sm border-b border-white/10">
                    <th className="pb-3">Utilisateur</th>
                    <th className="pb-3">Email</th>
                    <th className="pb-3">Rôle Actuel</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {allUsers.filter(u => u.role !== "superadmin").map((u) => (
                    <tr key={u.id} className="hover:bg-white/5">
                      <td className="py-4 font-medium">{u.fullName}</td>
                      <td className="py-4 text-sm text-gray-400">{u.email}</td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          u.role === "admin" ? "bg-purple-500/20 text-purple-400" : "bg-gray-500/20 text-gray-400"
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <button 
                          onClick={() => toggleAdminRole(u.id, u.role)}
                          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                            u.role === "admin" 
                              ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" 
                              : "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                          }`}
                        >
                          {u.role === "admin" ? "Retirer Admin" : "Nommer Admin"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "users" && (
          <div className="glass-card p-6">
            <h3 className="text-xl font-bold mb-6">Liste des abonnés</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-gray-400 text-sm border-b border-white/10">
                    <th className="pb-3">Client</th>
                    <th className="pb-3">MAC Address</th>
                    <th className="pb-3">Réseau</th>
                    <th className="pb-3">Période</th>
                    <th className="pb-3">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {allSubs.map(sub => (
                    <tr key={sub.id} className="hover:bg-white/5">
                      <td className="py-4">
                        <div className="font-medium">{sub.fullName}</div>
                        <div className="text-xs text-gray-500">{sub.phone}</div>
                      </td>
                      <td className="py-4 font-mono text-xs">{sub.macAddress}</td>
                      <td className="py-4 text-sm">{sub.networkType}</td>
                      <td className="py-4 text-xs">
                        {sub.startDate && typeof sub.startDate.toDate === 'function' && sub.endDate && typeof sub.endDate.toDate === 'function' 
                          ? `${sub.startDate.toDate().toLocaleDateString()} - ${sub.endDate.toDate().toLocaleDateString()}` 
                          : "Période non définie"}
                      </td>
                      <td className="py-4">
                        <span className={`status-${(sub.status || "inconnu").toLowerCase()}`}>
                          {sub.status || "INCONNU"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "pricing" && (
          <div className="glass-card p-8 max-w-lg mx-auto">
            <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
              <Settings className="text-blue-400" />
              Configuration des tarifs
            </h3>
            <form onSubmit={updatePricing} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Tarif 2.4 GHz (CFA)</label>
                <input 
                  type="number" 
                  className="input-shaba w-full" 
                  value={pricing?.["2.4GHz"] || 0}
                  onChange={(e) => setPricing({...pricing, "2.4GHz": parseInt(e.target.value) || 0})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Tarif 5 GHz (CFA)</label>
                <input 
                  type="number" 
                  className="input-shaba w-full" 
                  value={pricing?.["5GHz"] || 0}
                  onChange={(e) => setPricing({...pricing, "5GHz": parseInt(e.target.value) || 0})}
                />
              </div>
              <button type="submit" className="btn-primary w-full">
                Enregistrer les modifications
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

const StatCard = ({ icon, title, value }) => (
  <div className="glass-card p-6 flex items-center gap-4">
    <div className="p-3 bg-white/5 rounded-xl">{icon}</div>
    <div>
      <div className="text-sm text-gray-400">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  </div>
);

export default AdminDashboard;
