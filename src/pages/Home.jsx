// src/pages/Home.jsx

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FiArrowRight, 
  FiTruck, 
  FiShield, 
  FiCreditCard, 
  FiHeadphones,
  FiUser,
  FiLogIn,
  FiShoppingCart,
  FiHeart
} from 'react-icons/fi';
import { getProducts, getCategories } from '../services/firebase/firestoreHelpers';
import ProductCard from '../components/products/ProductCard/ProductCard';
import SkeletonCard from '../components/common/Loader/Skeleton';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import AuthModal from '../components/auth/AuthModal.jsx';

const Home = () => {
  const navigate = useNavigate();
  const { user, userData, isAuthenticated } = useAuth();
  const { cartCount } = useCart();
  
  // State management
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [topDeals, setTopDeals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState('login');

  // Fetch all data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch products and categories in parallel
        const [productsData, categoriesData] = await Promise.all([
          getProducts(24), // Fetch more products
          getCategories()
        ]);

        if (!productsData.error && productsData.products) {
          const products = productsData.products;
          
          // Split products into different sections
          setFeaturedProducts(products.slice(0, 8));
          setNewArrivals(products.slice(8, 16));
          setTopDeals(products.slice(16, 24));
        } else {
          console.error('Error fetching products:', productsData.error);
          setError(productsData.error);
        }

        if (!categoriesData.error) {
          setCategories(categoriesData.categories);
        } else {
          console.error('Error fetching categories:', categoriesData.error);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const openAuthModal = (view = 'login') => {
    setAuthModalView(view);
    setAuthModalOpen(true);
  };

  const handleProfileClick = () => {
    if (isAuthenticated) {
      navigate('/profile');
    } else {
      openAuthModal('login');
    }
  };

  const handleCartClick = () => {
    navigate('/cart');
  };

  return (
    <div className="home-page bg-gray-50">
      {/* Top Bar with Auth & Cart */}
      <div className="bg-gray-900 text-white py-2">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-4">
              <span className="text-gray-300">📞 Call us: +254 748661149</span>
              <span className="hidden md:inline text-gray-300">|</span>
              <span className="hidden md:inline text-gray-300">✉️ support@shopki.com</span>
            </div>
            <div className="flex items-center gap-4">
              {/* Cart Icon - Always visible */}
              <button
                onClick={handleCartClick}
                className="flex items-center gap-2 hover:text-orange-400 transition relative"
              >
                <FiShoppingCart className="text-lg" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
                <span className="hidden sm:inline">Cart</span>
              </button>

              <span className="text-gray-600">|</span>

              {/* User Auth Section */}
              {isAuthenticated ? (
                <button
                  onClick={handleProfileClick}
                  className="flex items-center gap-2 hover:text-orange-400 transition"
                >
                  <FiUser />
                  <span>Hi, {userData?.displayName?.split(' ')[0] || 'User'}</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => openAuthModal('login')}
                    className="flex items-center gap-1 hover:text-orange-400 transition"
                  >
                    <FiLogIn className="text-xs" />
                    Login
                  </button>
                  <span>|</span>
                  <button
                    onClick={() => openAuthModal('signup')}
                    className="hover:text-orange-400 transition"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section with Promo Banner */}
      <section className="hero-section py-8 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Hero Banner */}
            <div className="lg:col-span-3">
              <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 text-white rounded-lg p-8 md:p-12 h-full flex flex-col justify-center">
                <div className="max-w-xl">
                  <p className="text-sm uppercase tracking-wide mb-2 text-orange-100">Limited Time Offer</p>
                  <h1 className="text-4xl md:text-5xl font-bold mb-4">
                    Super Sale
                    <span className="block text-3xl md:text-4xl mt-2">Up to 50% Off</span>
                  </h1>
                  <p className="text-lg md:text-xl mb-6 text-orange-50">
                    On all electronics, fashion, and home appliances
                  </p>
                  <Link
                    to="/products"
                    className="inline-flex items-center gap-2 bg-white text-orange-600 px-8 py-4 rounded-lg font-bold hover:bg-gray-100 transition shadow-lg"
                  >
                    Shop Now <FiArrowRight />
                  </Link>
                </div>
              </div>
            </div>

            {/* Side Promotional Cards */}
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-lg p-6 cursor-pointer hover:shadow-lg transition">
                <p className="text-sm font-semibold mb-1">⚡ Flash Sale</p>
                <h3 className="text-xl font-bold mb-2">Electronics</h3>
                <p className="text-sm text-purple-100">Up to 40% off</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-lg p-6 cursor-pointer hover:shadow-lg transition">
                <p className="text-sm font-semibold mb-1">🎁 Special Offer</p>
                <h3 className="text-xl font-bold mb-2">Fashion</h3>
                <p className="text-sm text-blue-100">Buy 2 Get 1 Free</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features py-6 bg-white border-y">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <FiTruck className="text-orange-500 text-3xl flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-sm">Free Delivery</h3>
                <p className="text-gray-600 text-xs">Orders over KSh 5,000</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FiShield className="text-orange-500 text-3xl flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-sm">Secure Payment</h3>
                <p className="text-gray-600 text-xs">100% Protected</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FiCreditCard className="text-orange-500 text-3xl flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-sm">Easy Returns</h3>
                <p className="text-gray-600 text-xs">7-Day Policy</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FiHeadphones className="text-orange-500 text-3xl flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-sm">24/7 Support</h3>
                <p className="text-gray-600 text-xs">Customer Service</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories py-8 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold">Shop by Category</h2>
            <Link to="/products" className="text-orange-500 hover:text-orange-600 flex items-center gap-2 font-semibold">
              View All <FiArrowRight />
            </Link>
          </div>
          
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
            {loading ? (
              Array(6).fill(0).map((_, index) => (
                <div key={index} className="bg-gray-100 rounded-lg p-4 h-32 animate-pulse" />
              ))
            ) : categories.length > 0 ? (
              categories.slice(0, 6).map((category) => (
                <Link
                  key={category.id}
                  to={`/products?category=${category.slug || category.name.toLowerCase()}`}
                  className="bg-white border border-gray-200 rounded-lg p-4 text-center hover:shadow-lg hover:border-orange-500 transition group"
                >
                  {category.image ? (
                    <img 
                      src={category.image} 
                      alt={category.name}
                      className="w-12 h-12 md:w-16 md:h-16 object-cover rounded-lg mx-auto mb-2 group-hover:scale-110 transition"
                    />
                  ) : (
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-orange-100 rounded-lg mx-auto mb-2 flex items-center justify-center group-hover:bg-orange-200 transition">
                      <span className="text-xl md:text-2xl">📦</span>
                    </div>
                  )}
                  <h3 className="font-semibold text-sm md:text-base">{category.name}</h3>
                </Link>
              ))
            ) : (
              ['Electronics', 'Fashion', 'Home', 'Sports', 'Beauty', 'Books'].map((category) => (
                <Link
                  key={category}
                  to={`/products?category=${category.toLowerCase()}`}
                  className="bg-white border border-gray-200 rounded-lg p-4 text-center hover:shadow-lg hover:border-orange-500 transition group"
                >
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-orange-100 rounded-lg mx-auto mb-2 flex items-center justify-center group-hover:bg-orange-200 transition">
                    <span className="text-xl md:text-2xl">📦</span>
                  </div>
                  <h3 className="font-semibold text-sm md:text-base">{category}</h3>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Flash Deals Section */}
      <section className="flash-deals py-8 bg-gradient-to-r from-red-50 to-orange-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                ⚡ Flash Deals
              </h2>
              <p className="text-gray-600 text-sm mt-1">Limited time offers - Grab them before they're gone!</p>
            </div>
            <Link to="/products?deals=flash" className="text-orange-500 hover:text-orange-600 flex items-center gap-2 font-semibold">
              View All <FiArrowRight />
            </Link>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              Error loading deals. Please try again later.
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            {loading ? (
              Array(6).fill(0).map((_, index) => <SkeletonCard key={index} />)
            ) : topDeals.length > 0 ? (
              topDeals.slice(0, 6).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500">No flash deals available</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="featured-products py-8 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">Top Selling Products</h2>
              <p className="text-gray-600 text-sm mt-1">Most popular items this week</p>
            </div>
            <Link to="/products" className="text-orange-500 hover:text-orange-600 flex items-center gap-2 font-semibold">
              View All <FiArrowRight />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {loading ? (
              Array(10).fill(0).map((_, index) => <SkeletonCard key={index} />)
            ) : featuredProducts.length > 0 ? (
              featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500 text-lg mb-4">No products available yet.</p>
                <p className="text-gray-400">Check back soon for amazing deals!</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* New Arrivals Section */}
      {newArrivals.length > 0 && (
        <section className="new-arrivals py-8 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold">New Arrivals</h2>
                <p className="text-gray-600 text-sm mt-1">Fresh products just for you</p>
              </div>
              <Link to="/products?filter=new" className="text-orange-500 hover:text-orange-600 flex items-center gap-2 font-semibold">
                View All <FiArrowRight />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
              {newArrivals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Guest Shopping Banner */}
      {!isAuthenticated && cartCount > 0 && (
        <section className="guest-banner py-6 bg-blue-50 border-t border-b border-blue-200">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <h3 className="text-lg font-bold text-blue-900">
                  🛒 You have {cartCount} {cartCount === 1 ? 'item' : 'items'} in your cart
                </h3>
                <p className="text-blue-700 text-sm mt-1">
                  Sign in to save your cart and enjoy faster checkout
                </p>
              </div>
              <button
                onClick={() => openAuthModal('login')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold whitespace-nowrap"
              >
                Sign In Now
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Call to Action - Sign Up */}
      {!isAuthenticated && cartCount === 0 && (
        <section className="cta py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl p-8 md:p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Join Shopki Today!</h2>
              <p className="text-lg md:text-xl mb-6 text-orange-50">
                Create an account to unlock exclusive deals, faster checkout, and personalized recommendations
              </p>
              <button
                onClick={() => openAuthModal('signup')}
                className="inline-flex items-center gap-2 bg-white text-orange-600 px-8 py-4 rounded-lg font-bold hover:bg-gray-100 transition shadow-lg"
              >
                Sign Up Now - It's Free! <FiArrowRight />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Newsletter Section */}
      <section className="newsletter py-8 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Stay Updated with Our Newsletter</h2>
            <p className="text-gray-300 mb-6">Get the latest updates on new products, exclusive deals, and special offers!</p>
            <form className="flex flex-col sm:flex-row gap-3" onSubmit={(e) => {
              e.preventDefault();
              alert('Newsletter subscription coming soon!');
            }}>
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 px-4 py-3 rounded-lg border-none focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                required
              />
              <button
                type="submit"
                className="bg-orange-500 text-white px-8 py-3 rounded-lg hover:bg-orange-600 transition font-semibold whitespace-nowrap"
              >
                Subscribe Now
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultView={authModalView}
      />
    </div>
  );
};

export default Home;