# Shopki - E-commerce Platform

A production-ready e-commerce platform built with React, Firebase, and Tailwind CSS. Shopki provides a complete shopping experience with user authentication, product management, cart functionality, checkout process, and an admin dashboard.

## 🌟 Features

### Customer Features
- **User Authentication** - Email/password, Google OAuth, and phone-based login
- **Product Browsing** - Search, filter, and sort products by category, price, and ratings
- **Shopping Cart** - Add/remove items, update quantities, persistent cart storage
- **Wishlist** - Save favorite products for later
- **Checkout** - Multi-step checkout with shipping and payment options
- **Order Management** - Track orders, view order history, manage returns
- **User Profile** - Edit profile information, manage addresses, view purchase history

### Admin Features
- **Dashboard** - Real-time sales analytics and order insights
- **Product Management** - Add, edit, delete products with image uploads
- **Category Management** - Create and manage product categories
- **Order Management** - View and process customer orders
- **User Management** - Manage customer accounts and permissions

### Vendor Features
- **Vendor Dashboard** - Manage shop profile and analytics
- **Product Listing** - Upload and manage vendor products
- **Order Fulfillment** - Process and track vendor orders

## 🛠️ Tech Stack

- **Frontend**: React 18, React Router v6
- **State Management**: Redux Toolkit, Context API
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Image Hosting**: Cloudinary
- **Styling**: Tailwind CSS
- **Icons**: React Icons (FiIcon, BiIcon)
- **Forms**: Formik + Yup validation
- **Notifications**: React Toastify
- **UI Components**: Custom components + Swiper carousel

## 📁 Project Structure

```
shopki/
├── src/
│   ├── components/
│   │   ├── admin/          # Admin dashboard components
│   │   ├── auth/           # Authentication components
│   │   ├── cart/           # Shopping cart components
│   │   ├── checkout/       # Checkout flow components
│   │   ├── common/         # Reusable components (Header, Footer, etc.)
│   │   ├── home/           # Home page components
│   │   ├── products/       # Product display components
│   │   ├── user/           # User profile components
│   │   └── vendor/         # Vendor dashboard components
│   ├── pages/              # Full page components
│   ├── context/            # React Context (Auth, Cart, Theme, etc.)
│   ├── hooks/              # Custom React hooks
│   ├── services/           # External service integrations
│   │   ├── firebase/       # Firebase configuration and helpers
│   │   ├── api/            # API endpoints
│   │   ├── cloudinary/     # Image upload
│   │   └── payment/        # Payment gateways (Stripe, PayPal, M-Pesa)
│   ├── store/              # Redux store configuration
│   ├── routes/             # Route protection and configuration
│   └── utils/              # Utility functions and helpers
├── public/                 # Static files
└── package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Firebase account
- Cloudinary account (for image uploads)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/shopki.git
cd shopki
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

4. Add your Firebase and Cloudinary credentials to `.env`:
```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

5. Start the development server:
```bash
npm start
```

The app will open at `http://localhost:3000`

## 📦 Available Scripts

```bash
# Start development server
npm start

# Build for production
npm build

# Run tests
npm test

# Eject webpack config (not reversible)
npm eject
```

## 🔑 Key Components

### Authentication (`src/context/AuthContext.jsx`)
Manages user authentication state, login/logout, user data persistence

### Shopping Cart (`src/context/CartContext.jsx`)
Manages cart items, quantities, total calculations, and localStorage sync

### Protected Routes (`src/routes/ProtectedRoute.jsx`)
Wraps pages that require authentication

### Admin Dashboard (`src/pages/admin/AdminDashboard.jsx`)
Full admin interface for product, category, and order management

## 🎨 Styling

The project uses **Tailwind CSS** for styling with custom configurations in `tailwind.config.js`. Color scheme follows an orange/blue theme for primary actions and neutral grays for backgrounds.

## 🔐 Security Features

- Firebase Authentication (secure user management)
- Protected routes for authenticated users
- Admin role validation
- Secure payment processing with Stripe/PayPal

## 🐛 Known Issues & TODOs

- Firebase environment variables need to be set for full functionality
- Payment gateway integration (Stripe, PayPal, M-Pesa) pending implementation
- Email notifications not yet configured
- Vendor approval workflow in progress

## 📝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the MIT License.

## 📞 Support

For issues, feature requests, or questions, please open an issue on GitHub or contact the development team.

## 🙏 Acknowledgments

- React community for excellent documentation
- Firebase for backend services
- Tailwind CSS for styling utilities
- All contributors and testers

---

**Version**: 1.0.0  
**Last Updated**: November 2025  
**Status**: In Development
