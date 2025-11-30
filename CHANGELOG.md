# Changelog

All notable changes to the Shopki e-commerce platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-30

### Added
- **Initial Release**: Complete e-commerce platform with core features
- User authentication system (Email/password, Google OAuth)
- Product browsing, searching, filtering, and sorting
- Shopping cart with persistent storage (localStorage)
- Wishlist functionality
- Multi-step checkout process
- Order management and tracking
- User profile and address management
- Admin dashboard with:
  - Sales analytics and insights
  - Product management (add, edit, delete)
  - Category management
  - Order management
  - User management
- Vendor portal with:
  - Vendor dashboard
  - Product listing management
  - Order fulfillment
- Firebase integration (Auth, Firestore, Storage)
- Cloudinary image upload support
- Responsive design with Tailwind CSS
- React Router v6 for navigation
- Redux Toolkit for state management
- Toast notifications with React Toastify
- Form validation with Formik and Yup
- Protected routes for authenticated users
- Admin route protection

### Fixed
- Resolved React import issues in page components
- Fixed CartContext to provide correct cart count
- Fixed component export/import mismatches in App.jsx
- Added missing page components (CartPage, OrderSuccessPage)
- Created Footer component

### Known Issues
- Payment gateway integration pending (Stripe, PayPal, M-Pesa)
- Email notifications not yet configured
- Vendor approval workflow in progress
- Firebase credentials required in .env file

### Technical Details
- **React Version**: 18.2.0
- **Node.js**: v14+
- **Build Tool**: Create React App with react-scripts 5.0.1
- **Main Dependencies**:
  - react-router-dom v6.20.0
  - firebase v10.7.1
  - @reduxjs/toolkit v2.0.1
  - tailwindcss v3.4.0
  - react-toastify v9.1.3
  - formik v2.4.5
  - yup v1.3.3

### Installation & Setup
```bash
# Clone the repository
git clone https://github.com/imboss96/ecommerce.git
cd ecommerce

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Add your Firebase and Cloudinary credentials to .env

# Start development server
npm start
```

### Future Roadmap
- [ ] Payment gateway integration (Stripe, PayPal, M-Pesa)
- [ ] Email notification system
- [ ] Vendor approval and verification workflow
- [ ] Advanced product filtering and search
- [ ] Customer reviews and ratings system
- [ ] Inventory management
- [ ] Coupon and discount system
- [ ] Analytics and reporting dashboard
- [ ] Mobile app (React Native)
- [ ] Performance optimization
- [ ] Unit and integration tests
- [ ] API documentation

---

## Version Tags

- `v1.0.0` - Initial release (2025-11-30)

## How to Use This Changelog

When making changes:
1. Create a new version section at the top with the version number and date
2. Categorize changes as: Added, Changed, Deprecated, Removed, Fixed, Security
3. Include specific details about what was changed
4. Commit with message: `Release v1.x.x: Description`
5. Create a git tag: `git tag -a v1.x.x -m "Version 1.x.x: Description"`
6. Push tag: `git push origin v1.x.x`

## Version Format

This project uses [Semantic Versioning](https://semver.org/):
- **MAJOR** (v1.0.0): Breaking changes or major new features
- **MINOR** (v1.1.0): New features that are backward compatible
- **PATCH** (v1.0.1): Bug fixes that don't affect API

Example: v1.2.3
- 1 = Major version
- 2 = Minor version (features added)
- 3 = Patch version (bug fixes)
