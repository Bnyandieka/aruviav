// Location: src/components/common/Header/Header.jsx

import React, { useState } from 'react';
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
import { signOutUser } from '../../../services/firebase/auth';
import './Header.css';

const Header = () => {
  const { user, isAdmin } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${searchQuery}`);
      setSearchQuery('');
    }
  };

  const handleSignOut = async () => {
    await signOutUser();
    navigate('/');
  };

  return (
    <header className="header">
      {/* Top Bar */}
      <div className="top-bar bg-orange-500 text-white py-2">
        <div className="container mx-auto px-4 flex justify-between items-center text-sm">
          <div>Free shipping on orders over KSh 5,000</div>
          <div className="flex gap-4">
            <Link to="/help" className="hover:underline">Help</Link>
            <Link to="/contact" className="hover:underline">Contact</Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="main-header bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link to="/" className="logo text-2xl font-bold text-orange-500">
              SHOPKI
            </Link>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="search-form flex-1 max-w-2xl hidden md:flex">
              <input
                type="text"
                placeholder="Search for products, brands and categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:border-orange-500"
              />
              <button
                type="submit"
                className="search-button bg-orange-500 text-white px-6 py-2 rounded-r-lg hover:bg-orange-600"
              >
                <FiSearch size={20} />
              </button>
            </form>

            {/* Icons */}
            <div className="flex items-center gap-4">
              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 hover:text-orange-500"
                >
                  <FiUser size={24} />
                  <span className="hidden lg:inline">
                    {user ? 'Account' : 'Sign In'}
                  </span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                    {user ? (
                      <>
                        <Link
                          to="/profile"
                          className="block px-4 py-2 hover:bg-gray-100"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          My Account
                        </Link>
                        <Link
                          to="/orders"
                          className="block px-4 py-2 hover:bg-gray-100"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          Orders
                        </Link>
                        <Link
                          to="/wishlist"
                          className="block px-4 py-2 hover:bg-gray-100"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          Wishlist
                        </Link>
                        {isAdmin && (
                          <>
                            <hr className="my-2" />
                            <Link
                              to="/admin"
                              className="block px-4 py-2 hover:bg-gray-100 text-orange-600 font-semibold"
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
                          className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                        >
                          Sign Out
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/login"
                          className="block px-4 py-2 hover:bg-gray-100"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          Sign In
                        </Link>
                        <Link
                          to="/signup"
                          className="block px-4 py-2 hover:bg-gray-100"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          Create Account
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Wishlist */}
              <Link to="/wishlist" className="hover:text-orange-500 hidden md:block">
                <FiHeart size={24} />
              </Link>

              {/* Cart */}
              <Link to="/cart" className="relative hover:text-orange-500">
                <FiShoppingCart size={24} />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden"
              >
                {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Search */}
          <form onSubmit={handleSearch} className="mt-4 md:hidden flex">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:border-orange-500"
            />
            <button
              type="submit"
              className="bg-orange-500 text-white px-6 py-2 rounded-r-lg"
            >
              <FiSearch size={20} />
            </button>
          </form>
        </div>
      </div>

      {/* Navigation */}
      <nav className="nav-bar bg-gray-100 hidden md:block">
        <div className="container mx-auto px-4">
          <ul className="flex gap-6 py-3">
            <li>
              <Link to="/products?category=electronics" className="hover:text-orange-500">
                Electronics
              </Link>
            </li>
            <li>
              <Link to="/products?category=fashion" className="hover:text-orange-500">
                Fashion
              </Link>
            </li>
            <li>
              <Link to="/products?category=home" className="hover:text-orange-500">
                Home & Garden
              </Link>
            </li>
            <li>
              <Link to="/products?category=sports" className="hover:text-orange-500">
                Sports
              </Link>
            </li>
            <li>
              <Link to="/products?category=beauty" className="hover:text-orange-500">
                Health & Beauty
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu md:hidden bg-white border-t">
          <div className="container mx-auto px-4 py-4">
            <ul className="space-y-4">
              <li>
                <Link
                  to="/products?category=electronics"
                  className="block hover:text-orange-500"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Electronics
                </Link>
              </li>
              <li>
                <Link
                  to="/products?category=fashion"
                  className="block hover:text-orange-500"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Fashion
                </Link>
              </li>
              <li>
                <Link
                  to="/products?category=home"
                  className="block hover:text-orange-500"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home & Garden
                </Link>
              </li>
              <li>
                <Link
                  to="/products?category=sports"
                  className="block hover:text-orange-500"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sports
                </Link>
              </li>
              <li>
                <Link
                  to="/products?category=beauty"
                  className="block hover:text-orange-500"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Health & Beauty
                </Link>
              </li>
            </ul>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;