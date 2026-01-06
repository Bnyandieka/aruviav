// Location: src/components/common/Header/Header.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FiShoppingCart, 
  FiHeart, 
  FiUser, 
  FiSearch,
  FiMenu,
  FiX
} from 'react-icons/fi';
import { useAuth } from '../../../context/AuthContext';
import { useCart } from '../../../context/CartContext';
import { useLogoSettings } from '../../../hooks/useLogoSettings';
import { signOutUser } from '../../../services/firebase/auth';
import { getProducts } from '../../../services/firebase/firestoreHelpers';
import { CATEGORIES } from '../../../utils/constants';
import NotificationBell from './NotificationBell';
import './Header.css';

const Header = () => {
  const { user, userData, isAdmin } = useAuth();
  const { cartCount } = useCart();
  const { logo } = useLogoSettings();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Fetch all products on mount
  useEffect(() => {
    const fetchProducts = async () => {
      const { products } = await getProducts();
      if (products) setAllProducts(products);
    };
    fetchProducts();
  }, []);

  // Real-time search suggestions
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const term = searchQuery.toLowerCase();
      const filtered = allProducts
        .filter(product =>
          product.name?.toLowerCase().includes(term) ||
          product.description?.toLowerCase().includes(term)
        )
        .slice(0, 8); // Show top 8 results
      setSearchSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, allProducts]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${searchQuery}`);
      setSearchQuery('');
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (productName) => {
    navigate(`/products?search=${encodeURIComponent(productName)}`);
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const handleCategoryClick = (categoryId) => {
    navigate(`/products?category=${categoryId}`, { replace: true });
    // Smooth scroll to top
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
  };

  const handleSignOut = async () => {
    await signOutUser();
    navigate('/');
  };

  return (
    <header className="header sticky top-0 z-40 bg-white">
      {/* Main Header */}
      <div className="main-header bg-white shadow">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Logo */}
            <Link to="/" className="logo flex-shrink-0">
              <img src={logo || '/logo.png'} alt="Store Logo" style={{ height: '40px', sm: '50px', width: 'auto' }} />
            </Link>

            {/* Search Bar - Hidden on small screens */}
            <div className="search-form flex-1 max-w-2xl hidden md:flex relative">
              <form onSubmit={handleSearch} className="flex w-full">
                <input
                  type="text"
                  placeholder="Search for products, brands and categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.trim() && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="search-input flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-l-lg focus:outline-none focus:border-orange-500"
                />
                <button
                  type="submit"
                  className="search-button bg-orange-500 text-white px-4 sm:px-6 py-2 rounded-r-lg hover:bg-orange-600 transition"
                >
                  <FiSearch size={20} />
                </button>
              </form>

              {/* Search Suggestions Dropdown */}
              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 overflow-y-auto" style={{ maxHeight: '120px' }}>
                  {searchSuggestions.length > 0 ? (
                    searchSuggestions.slice(0, 3).map((product) => (
                      <div
                        key={product.id}
                        onClick={() => handleSuggestionClick(product.name)}
                        className="px-3 py-1 hover:bg-orange-50 cursor-pointer border-b last:border-b-0 flex items-center gap-2"
                      >
                        <img
                          src={product.images?.[0] || 'https://via.placeholder.com/40'}
                          alt={product.name}
                          className="w-5 h-5 object-cover rounded flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 truncate">{product.name}</p>
                          <p className="text-xs text-orange-500">KSh {product.price?.toLocaleString()}</p>
                        </div>
                      </div>
                    ))
                  ) : searchQuery.trim() ? (
                    <div className="px-3 py-2 text-center">
                      <p className="text-gray-600 text-xs font-medium">No products found</p>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* Icons */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Notification Bell - Hide on very small screens */}
              <div className="hidden sm:block">
                <NotificationBell />
              </div>

              {/* Wishlist */}
              <Link to="/wishlist" className="hover:text-orange-500 hidden md:block p-2 hover:bg-gray-100 rounded transition">
                <FiHeart size={20} />
              </Link>

              {/* Cart */}
              <Link to="/cart" className="relative hover:text-orange-500 p-2 hover:bg-gray-100 rounded transition">
                <FiShoppingCart size={20} />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-1 sm:gap-2 hover:text-orange-500 p-2 hover:bg-gray-100 rounded transition text-sm sm:text-base"
                >
                  <FiUser size={20} />
                  <span className="hidden lg:inline">
                    {user ? 'Account' : 'Sign In'}
                  </span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-40 sm:w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                    {user ? (
                      <>
                        <Link
                          to="/profile"
                          className="block px-3 sm:px-4 py-2 hover:bg-gray-100 text-sm"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          My Account
                        </Link>
                        <Link
                          to="/orders"
                          className="block px-3 sm:px-4 py-2 hover:bg-gray-100 text-sm"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          Orders
                        </Link>
                        <Link
                          to="/wishlist"
                          className="block px-3 sm:px-4 py-2 hover:bg-gray-100 text-sm md:hidden"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          Wishlist
                        </Link>
                        {userData?.isVendor && (
                          <>
                            <hr className="my-2" />
                            <Link
                              to="/vendor/dashboard"
                              className="block px-3 sm:px-4 py-2 hover:bg-gray-100 text-green-600 font-semibold text-sm"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              🏪 Vendor Dashboard
                            </Link>
                          </>
                        )}
                        {isAdmin && (
                          <>
                            <hr className="my-2" />
                            <Link
                              to="/admin"
                              className="block px-3 sm:px-4 py-2 hover:bg-gray-100 text-orange-600 font-semibold text-sm"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              Admin Dashboard
                            </Link>
                          </>
                        )}
                        <hr className="my-2" />
                        <button
                          onClick={() => {
                            handleSignOut();
                            setUserMenuOpen(false);
                          }}
                          className="block w-full text-left px-3 sm:px-4 py-2 hover:bg-gray-100 text-red-600 text-sm"
                        >
                          Sign Out
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/login"
                          className="block px-3 sm:px-4 py-2 hover:bg-gray-100 text-sm"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          Sign In
                        </Link>
                        <Link
                          to="/signup"
                          className="block px-3 sm:px-4 py-2 hover:bg-gray-100 text-sm"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          Create Account
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 hover:bg-gray-100 rounded transition"
              >
                {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Search */}
          <form onSubmit={handleSearch} className="mt-3 md:hidden flex gap-2">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
            />
            <button
              type="submit"
              className="bg-orange-500 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-orange-600 transition flex-shrink-0"
            >
              <FiSearch size={18} />
            </button>
          </form>
        </div>
      </div>

      {/* Navigation */}
      <nav className="nav-bar bg-gray-100 hidden md:block overflow-visible relative z-40">
        <div className="container mx-auto px-3 sm:px-4">
          <ul className="flex gap-2 sm:gap-6 py-2 sm:py-3 text-sm sm:text-base whitespace-nowrap md:whitespace-normal overflow-x-auto md:overflow-x-visible">
            <li>
              <button type="button" onClick={() => handleCategoryClick('electronics')} className="hover:text-orange-500 inline-block py-1 pointer-events-auto bg-none border-none cursor-pointer font-inherit text-inherit">
                Electronics
              </button>
            </li>
            <li>
              <button type="button" onClick={() => handleCategoryClick('fashion-apparel')} className="hover:text-orange-500 inline-block py-1 pointer-events-auto bg-none border-none cursor-pointer font-inherit text-inherit">
                Fashion & Apparel
              </button>
            </li>
            <li>
              <button type="button" onClick={() => handleCategoryClick('home-garden')} className="hover:text-orange-500 inline-block py-1 pointer-events-auto bg-none border-none cursor-pointer font-inherit text-inherit">
                Home & Garden
              </button>
            </li>
            <li>
              <button type="button" onClick={() => handleCategoryClick('sports-outdoors')} className="hover:text-orange-500 inline-block py-1 pointer-events-auto bg-none border-none cursor-pointer font-inherit text-inherit">
                Sports & Outdoors
              </button>
            </li>
            <li>
              <button type="button" onClick={() => handleCategoryClick('health-beauty')} className="hover:text-orange-500 inline-block py-1 pointer-events-auto bg-none border-none cursor-pointer font-inherit text-inherit">
                Health & Beauty
              </button>
            </li>
            <li className="relative group">
              <button type="button" className="hover:text-orange-500 flex items-center gap-1 py-1 pointer-events-auto bg-none border-none cursor-pointer font-inherit text-inherit">
                More Categories ▼
              </button>
              <div className="absolute left-0 mt-0 w-40 sm:w-48 bg-white rounded-md shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 top-full pointer-events-none group-hover:pointer-events-auto overflow-y-auto" style={{ maxHeight: '300px' }}>
                {CATEGORIES.slice(5).map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleCategoryClick(category.id)}
                    className="w-full text-left block px-3 sm:px-4 py-2 text-gray-700 hover:bg-orange-500 hover:text-white first:rounded-t-md last:rounded-b-md text-sm bg-none border-none cursor-pointer"
                  >
                    {category.name}
                  </button>
                ))}}
              </div>
            </li>
          </ul>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu md:hidden bg-white border-t max-h-screen overflow-y-auto">
          <div className="container mx-auto px-3 sm:px-4 py-4">
            <ul className="space-y-2">
              <li className="font-semibold text-gray-700 pb-2 border-b text-sm">Categories</li>
              {CATEGORIES.map((category) => (
                <li key={category.id}>
                  <Link
                    to={`/products?category=${category.id}`}
                    className="block hover:text-orange-500 py-2 text-sm"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {category.icon} {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;