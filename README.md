# ShabaFAI - ISP Management System

ShabaFAI is a modern and robust web application designed to simplify the management of Internet Service Providers (ISPs). It offers a seamless experience for users wishing to subscribe and powerful control tools for administrators.

## Key Features

### For Users
- **Intuitive Subscription**: Simplified form to choose a plan (2.4GHz or 5GHz) and provide technical information (MAC Address).
- **Personal Dashboard**: Real-time tracking of subscription status (Pending, Active, Expired).
- **Professional PDF Receipts**: Automatic generation of receipts after validation, including network name (SSID), plan details, and a polished design.
- **User Profile**: Management of personal information and transaction history.

### For Administrators
- **Request Management**: Dedicated interface to validate or reject new subscriptions with a notification system.
- **Subscriber Tracking**: Overview of all active subscriptions with search and filtering.
- **Statistical Dashboards**: Visualization of revenue and subscriber growth via interactive charts (Chart.js).

### For Super Admin
- **User Control**: Ability to promote users to Admin rank, suspend (pause), or delete accounts.
- **Advanced Management**: Database cleanup (subscription deletion) and global configuration (rates, SSID, Wi-Fi passwords).
- **Critical Security**: Suspended accounts are immediately disconnected in real-time.

## Technical Architecture

### Frontend & UI/UX
- **Framework**: [React 19](https://react.dev/) with [Vite](https://vitejs.dev/) for maximum performance and responsiveness.
- **Design System**: [Tailwind CSS](https://tailwindcss.com/) using **Glassmorphism** techniques for a modern and clean interface.
- **Animations**: [Framer Motion](https://www.framer.com/motion/) for smooth transitions between pages and tabs.
- **Data Visualization**: [Chart.js](https://www.chartjs.org/) via `react-chartjs-2` for dynamic statistical reports (Revenue by network, Subscription trends).
- **Icons**: [Lucide React](https://lucide.dev/) for consistent and lightweight iconography.

### Backend & Infrastructure (Firebase)
- **Database (Cloud Firestore)**: 
  - Optimized NoSQL structure for fast read/write.
  - Use of **Real-time Listeners (`onSnapshot`)** for instant interface updates without reloading.
- **Authentication (Firebase Auth)**: 
  - Secure management of user sessions.
  - Implementation of **Security Questions** for account recovery and sensitive data protection.
- **Security (Firestore Rules)**: Granular rules prohibiting unauthorized access to private data and restricting administrative actions to qualified roles.

### Document Generation
- **jsPDF**: Complex client-side PDF generation logic including:
  - Image processing (logos with opacity management).
  - Dynamic layout (dynamic coordinates, varied font styles).
  - Vector graphics (lines, circles) for a professional rendering.

## Business Logic & Security

### Role-Based Access Control (RBAC)
The application implements a strict access control logic:
1. **User**: Access limited to their own dashboard and profile.
2. **Admin**: Can manage subscriptions, view statistics, and configure basic rates.
3. **Super Admin**: Total control, including promoting other admins and managing account status (Active/Suspended).

### Synchronization & Performance (Caching)
The application integrates a multi-level caching system for optimal performance:
1. **Firestore Persistent Cache**: Data is stored locally on disk (IndexedDB). This allows:
   - Near-instant dashboard loading.
   - Data consultation even in case of temporary internet outage.
   - Drastic reduction in bandwidth consumption.
2. **Workbox & Service Workers (PWA)**: Intelligent caching of static resources (fonts, images, scripts) via `CacheFirst` strategies.
3. **Real-time Listeners**: Account status monitoring. If a Super Admin suspends an account, the application instantly detects this change via a Firestore listener in the `AuthContext`, triggering a forced and immediate logout of the concerned user.

### Progressive Web App (PWA)
The project integrates `vite-plugin-pwa`, allowing the application to be installed on mobile and desktop for an experience close to a native application (custom icons, splash screen).

## Installation & Development

The application uses **npm workspaces** to manage the client, server, and functions from the root.

```bash
# Install all dependencies (root, client, server, functions)
npm install

# Launch the client in development mode
npm run client:dev

# Build the client for production
npm run build

# Launch the server (if used)
npm run server:start
```

ShabaFAI for simplified and ultra-high-performance ISP management.
