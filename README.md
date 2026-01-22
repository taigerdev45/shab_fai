# ShabaFAI - Gestion de Fournisseur d'Accès Internet

ShabaFAI est une application web moderne conçue pour simplifier la gestion des abonnements internet. Elle permet aux utilisateurs de souscrire à des forfaits, de suivre leur consommation et de générer des reçus de paiement de manière autonome. Côté administration, elle offre des outils robustes pour valider les demandes et gérer le parc d'abonnés.

## 🚀 Fonctionnalités Clés

### Pour les Utilisateurs
- **Tableau de bord intuitif** : Vue d'ensemble de l'abonnement actif et historique des transactions.
- **Gestion des abonnements** : Souscription simplifiée avec saisie des informations techniques (adresse MAC, type de réseau).
- **Génération de reçus PDF** : Création et téléchargement automatique de reçus professionnels après validation de l'abonnement (généré côté client pour plus de confidentialité).
- **Notifications en temps réel** : Suivi de l'état des demandes (en attente, approuvé, rejeté).

### Pour les Administrateurs
- **Validation des demandes** : Interface dédiée pour approuver ou rejeter les nouvelles souscriptions.
- **Gestion centralisée** : Accès rapide aux détails techniques des abonnés.
- **Sécurité multi-niveaux** : Accès restreint aux rôles Admin et SuperAdmin via Firebase Auth et Firestore Rules.

## 🛠️ Stack Technique

- **Frontend** : React 19, Vite, Tailwind CSS, Lucide React, Framer Motion.
- **Backend/Base de données** : Firebase Firestore (NoSQL).
- **Authentification** : Firebase Authentication.
- **Hébergement** : Firebase Hosting.
- **Génération PDF** : jsPDF.

## 📦 Installation et Configuration

### Prérequis
- Node.js (v18+)
- Compte Firebase

### Étapes d'installation

1. **Cloner le projet**
   ```bash
   git clone <URL_DU_DEPOT>
   cd shab_fai
   ```

2. **Installer les dépendances**
   ```bash
   # Pour le client
   cd client
   npm install
   
   # Pour les fonctions (optionnel)
   cd ../functions
   npm install
   ```

3. **Configuration Firebase**
   - Créez un projet sur la [console Firebase](https://console.firebase.google.com/).
   - Activez Firestore et l'Authentification (Email/Password).
   - Copiez vos clés de configuration dans `client/src/config/firebase.js`.

4. **Lancer en local**
   ```bash
   cd client
   npm run dev
   ```

## 🚀 Déploiement

Le projet est configuré pour un déploiement rapide sur Firebase :

```bash
# Construire l'application
cd client
npm run build

# Déployer sur Firebase
cd ..
firebase deploy --only "hosting,firestore"
```

## 📄 Licence

Ce projet est la propriété de l'équipe ShabaFAI. Tous droits réservés.

---
Développé avec ❤️ par l'équipe ShabaFAI.
