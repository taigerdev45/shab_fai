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
- **Gestion Avancée** : Nettoyage de la base de données (suppression d'abonnements) et configuration globale (tarifs, SSID, mots de passe Wi-Fi).
- **Sécurité Critique** : Les comptes suspendus sont immédiatement déconnectés en temps réel.

## 🛠️ Architecture Technique

### 🎨 Frontend & UI/UX
- **Framework** : [React 19](https://react.dev/) avec [Vite](https://vitejs.dev/) pour une performance et une réactivité maximales.
- **Design System** : [Tailwind CSS](https://tailwindcss.com/) utilisant des techniques de **Glassmorphism** pour une interface moderne et épurée.
- **Animations** : [Framer Motion](https://www.framer.com/motion/) pour des transitions fluides entre les pages et les onglets.
- **Visualisation de Données** : [Chart.js](https://www.chartjs.org/) via `react-chartjs-2` pour des rapports statistiques dynamiques (Revenus par réseau, Évolution des abonnements).
- **Icônes** : [Lucide React](https://lucide.dev/) pour une iconographie cohérente et légère.

### ⚙️ Backend & Infrastructure (Firebase)
- **Base de Données (Cloud Firestore)** : 
  - Structure NoSQL optimisée pour la lecture/écriture rapide.
  - Utilisation de **Real-time Listeners (`onSnapshot`)** pour une mise à jour instantanée des interfaces sans rechargement.
- **Authentification (Firebase Auth)** : 
  - Gestion sécurisée des sessions utilisateurs.
  - Implémentation de **Questions de Sécurité** pour la récupération de compte et la protection des données sensibles.
- **Sécurité (Firestore Rules)** : Règles granulaires interdisant l'accès non autorisé aux données privées et restreignant les actions d'administration aux rôles qualifiés.

### 📄 Génération de Documents
- **jsPDF** : Logique de génération de PDF complexe côté client incluant :
  - Traitement d'images (logos avec gestion de l'opacité).
  - Mise en page dynamique (coordonnées dynamiques, styles de police variés).
  - Graphismes vectoriels (lignes, cercles) pour un rendu professionnel.

## 📋 Logique Métier & Sécurité

### 🔐 Role-Based Access Control (RBAC)
L'application implémente une logique de contrôle d'accès stricte :
1. **User** : Accès limité à son propre dashboard et profil.
2. **Admin** : Peut gérer les abonnements, voir les statistiques et configurer les tarifs de base.
3. **Super Admin** : Contrôle total, y compris la promotion d'autres admins et la gestion du statut des comptes (Actif/Suspendu).

### 🔄 Synchronisation & Performance (Caching)
L'application intègre un système de mise en cache multi-niveaux pour une performance optimale :
1. **Firestore Persistent Cache** : Les données sont stockées localement sur le disque (IndexedDB). Cela permet :
   - Un chargement quasi instantané des tableaux de bord.
   - Une consultation des données même en cas de coupure internet temporaire.
   - Une réduction drastique de la consommation de bande passante.
2. **Workbox & Service Workers (PWA)** : Mise en cache intelligente des ressources statiques (fonts, images, scripts) via des stratégies `CacheFirst`.
3. **Real-time Listeners** : Surveillance du statut du compte. Si un Super Admin suspend un compte, l'application détecte instantanément ce changement via un listener Firestore dans le `AuthContext`, déclenchant une déconnexion forcée et immédiate de l'utilisateur concerné.

### 📱 Progressive Web App (PWA)
Le projet intègre `vite-plugin-pwa`, permettant une installation de l'application sur mobile et desktop pour une expérience proche d'une application native (icônes personnalisées, écran de démarrage).

## 📦 Installation & Développement

L'application utilise les **npm workspaces** pour gérer le client, le serveur et les fonctions depuis la racine.

```bash
# Installation de toutes les dépendances (root, client, server, functions)
npm install

# Lancement du client en mode développement
npm run client:dev

# Construction du client pour la production
npm run build

# Lancement du serveur (si utilisé)
npm run server:start
```

### Configuration Firebase
Renseignez vos clés dans `client/src/config/firebase.js`.

---
Développé avec ❤️ par l'équipe ShabaFAI pour une gestion FAI simplifiée et ultra-performante.
