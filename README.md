# ShabaFAI - Système de Gestion de FAI

ShabaFAI est une application web moderne et robuste conçue pour simplifier la gestion des Fournisseurs d'Accès Internet (FAI). Elle offre une expérience fluide pour les utilisateurs souhaitant s'abonner et des outils de contrôle puissants pour les administrateurs.

## 🚀 Fonctionnalités Clés

### 👤 Pour les Utilisateurs
- **Souscription Intuitive** : Formulaire simplifié pour choisir son forfait (2.4GHz ou 5GHz) et renseigner ses informations techniques (Adresse MAC).
- **Tableau de Bord Personnel** : Suivi en temps réel de l'état de l'abonnement (En attente, Actif, Expiré).
- **Reçus PDF Professionnels** : Génération automatique de reçus après validation, incluant le nom du réseau (SSID), les détails du forfait et un design soigné.
- **Profil Utilisateur** : Gestion des informations personnelles et historique des transactions.

### 🛡️ Pour les Administrateurs
- **Gestion des Demandes** : Interface dédiée pour valider ou rejeter les nouvelles souscriptions avec un système de notifications.
- **Suivi des Abonnés** : Vue d'ensemble de tous les abonnements actifs avec recherche et filtrage.
- **Tableaux de Bord Statistiques** : Visualisation des revenus et de la croissance du parc d'abonnés via des graphiques interactifs (Chart.js).

### 👑 Pour le Super Admin
- **Contrôle des Utilisateurs** : Possibilité de promouvoir des utilisateurs au rang d'Admin, de suspendre (pause) ou de supprimer des comptes.
- **Gestion Avancée** : Nettoyage de la base de données (suppression d'abonnements) et configuration globale.
- **Sécurité Critique** : Les comptes suspendus sont immédiatement déconnectés en temps réel grâce à l'intégration `onSnapshot`.

## 🛠️ Architecture Technique

### Frontend
- **Framework** : React 19 avec Vite pour une rapidité de développement optimale.
- **Style** : Tailwind CSS pour un design "Glassmorphism" moderne et responsive.
- **Icônes** : Lucide React.
- **Animations** : Framer Motion.
- **Graphiques** : React-Chartjs-2.
- **PDF** : jsPDF pour la génération de documents côté client.

### Backend & Sécurité
- **Base de Données** : Firebase Firestore (NoSQL) pour une synchronisation en temps réel.
- **Authentification** : Firebase Auth avec gestion fine des rôles (User, Admin, SuperAdmin).
- **Sécurité** : Règles Firestore strictes pour protéger les données sensibles.
- **Temps Réel** : Utilisation intensive de `onSnapshot` pour refléter les changements de statut instantanément sans recharger la page.

## 📋 Logique de l'Application

1. **Authentification** : Chaque utilisateur est lié à un document dans la collection `users` qui définit son rôle et son statut.
2. **Flux d'Abonnement** :
   - L'utilisateur soumet une demande.
   - La demande apparaît dans l'onglet "Demandes" de l'Admin.
   - L'Admin valide la transaction (vérification du paiement).
   - L'abonnement devient actif et le reçu PDF est débloqué pour l'utilisateur.
3. **Gestion des Rôles** :
   - `user` : Accès au dashboard personnel.
   - `admin` : Accès à la gestion des abonnements et statistiques.
   - `superadmin` : Accès total, y compris la gestion des autres administrateurs.

## 📦 Installation

```bash
# Installation des dépendances client
cd client
npm install

# Configuration
# Editez client/src/config/firebase.js avec vos clés Firebase

# Lancement
npm run dev
```

## 🚀 Déploiement

Le projet est prêt pour un déploiement Firebase :
```bash
npm run build
firebase deploy
```

---
Développé avec ❤️ pour une gestion FAI simplifiée et efficace.
