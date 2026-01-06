import React, { useState, useEffect } from 'react';
import { FiFilter, FiSearch, FiArrowRight, FiX } from 'react-icons/fi';
import { useSearchParams } from 'react-router-dom';
import { getProducts } from '../services/firebase/firestoreHelpers';
import ProductCard from '../components/products/ProductCard/ProductCard';
import Breadcrumb from '../components/common/Breadcrumb/Breadcrumb';
import Loader from '../components/common/Loader/Spinner';

export const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [sortBy, setSortBy] = useState('newest');
  const [categories, setCategories] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  // Fetch all products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { products: productsData, error } = await getProducts();
        
        if (!error && productsData) {
          setProducts(productsData);
          
          // Extract unique categories
          const uniqueCategories = [...new Set(productsData.map(p => p.category))];
          setCategories(uniqueCategories);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Listen to URL parameter changes
  useEffect(() => {
    const searchFromUrl = searchParams.get('search') ? decodeURIComponent(searchParams.get('search')) : '';
    const categoryFromUrl = searchParams.get('category') || 'all';
    
    setSearchTerm(searchFromUrl);
    setSelectedCategory(categoryFromUrl);
  }, [searchParams]);

  // Filter and sort products
  useEffect(() => {
    let filtered = [...products];

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(product =>
        product.name?.toLowerCase().includes(term) ||
        product.description?.toLowerCase().includes(term)
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Filter by price range
    filtered = filtered.filter(product => 
      product.price >= priceRange[0] && product.price <= priceRange[1]
    );

    // Sort products
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, selectedCategory, sortBy, priceRange]);

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-gray-50 w-full overflow-x-hidden">
      <div className="w-full px-2 sm:px-4 py-3 sm:py-4">
        <div className="flex gap-3 md:gap-4">
          {/* Desktop Sidebar Filter */}
          <div className="hidden md:block w-56 flex-shrink-0">
            <div className="bg-white rounded shadow-sm p-3 space-y-4 sticky top-20">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <FiFilter /> Filters
              </h3>

              {/* Search */}
              <div>
                <label className="block text-sm font-semibold mb-2">Search</label>
                <div className="relative">
                  <FiSearch className="absolute left-3 top-3 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-semibold mb-3">Sort By</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="sort"
                      value="newest"
                      checked={sortBy === 'newest'}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="cursor-pointer w-4 h-4"
                    />
                    <span className="text-sm">Newest</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="sort"
                      value="price-low"
                      checked={sortBy === 'price-low'}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="cursor-pointer w-4 h-4"
                    />
                    <span className="text-sm">Price: Low to High</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="sort"
                      value="price-high"
                      checked={sortBy === 'price-high'}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="cursor-pointer w-4 h-4"
                    />
                    <span className="text-sm">Price: High to Low</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="sort"
                      value="rating"
                      checked={sortBy === 'rating'}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="cursor-pointer w-4 h-4"
                    />
                    <span className="text-sm">Highest Rated</span>
                  </label>
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-semibold mb-3">Category</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      value="all"
                      checked={selectedCategory === 'all'}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="cursor-pointer w-4 h-4"
                    />
                    <span className="text-sm">All Categories</span>
                  </label>
                  {categories.map((category) => (
                    <label key={category} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="category"
                        value={category}
                        checked={selectedCategory === category}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="cursor-pointer w-4 h-4"
                      />
                      <span className="text-sm capitalize">{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-semibold mb-3">Price Range</label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="100000"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>KSh {priceRange[0].toLocaleString()}</span>
                    <span>KSh {priceRange[1].toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Clear Filters */}
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setSortBy('newest');
                  setPriceRange([0, 100000]);
                }}
                className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-semibold text-sm"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="flex items-center justify-between gap-3 mb-6 md:hidden">
              {/* Mobile Filters Button */}
              <button
                onClick={() => setShowMobileFilter(!showMobileFilter)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition font-semibold text-sm"
              >
                <FiFilter size={18} /> Filters
              </button>
              {/* Mobile Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
              >
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>

        {/* Mobile Filter Modal */}
        {showMobileFilter && (
          <div className="fixed inset-0 z-50 md:hidden">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black bg-opacity-50"
              onClick={() => setShowMobileFilter(false)}
            />
            
            {/* Filter Panel */}
            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-4 py-4 flex justify-between items-center rounded-t-2xl">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <FiFilter /> Filters
                </h3>
                <button
                  onClick={() => setShowMobileFilter(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <FiX size={20} />
                </button>
              </div>

              <div className="p-4 space-y-6">
                {/* Search */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Search</label>
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-3 text-gray-400" size={16} />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-semibold mb-3">Sort By</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="sort"
                        value="newest"
                        checked={sortBy === 'newest'}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="cursor-pointer w-4 h-4"
                      />
                      <span className="text-sm">Newest</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="sort"
                        value="price-low"
                        checked={sortBy === 'price-low'}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="cursor-pointer w-4 h-4"
                      />
                      <span className="text-sm">Price: Low to High</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="sort"
                        value="price-high"
                        checked={sortBy === 'price-high'}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="cursor-pointer w-4 h-4"
                      />
                      <span className="text-sm">Price: High to Low</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="sort"
                        value="rating"
                        checked={sortBy === 'rating'}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="cursor-pointer w-4 h-4"
                      />
                      <span className="text-sm">Highest Rated</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-3">Category</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="category"
                        value="all"
                        checked={selectedCategory === 'all'}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="cursor-pointer w-4 h-4"
                      />
                      <span className="text-sm">All Categories</span>
                    </label>
                    {categories.map((category) => (
                      <label key={category} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="category"
                          value={category}
                          checked={selectedCategory === category}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="cursor-pointer w-4 h-4"
                        />
                        <span className="text-sm capitalize">{category}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-semibold mb-3">Price Range</label>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="100000"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>KSh {priceRange[0].toLocaleString()}</span>
                      <span>KSh {priceRange[1].toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Clear Filters */}
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                    setSortBy('newest');
                    setPriceRange([0, 100000]);
                    setShowMobileFilter(false);
                  }}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-semibold text-sm"
                >
                  Clear Filters
                </button>

                {/* Apply Button */}
                <button
                  onClick={() => setShowMobileFilter(false)}
                  className="w-full px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-semibold text-sm"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Products Grid - Full Width Jumia Style */}
        <div className="w-full">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 w-full">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="bg-white p-6 sm:p-12 text-center">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                No products found
              </h3>
              <p className="text-gray-600 text-xs sm:text-sm mb-4 sm:mb-6">
                Try adjusting your search or filters to find what you're looking for
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setSortBy('newest');
                  setPriceRange([0, 100000]);
                }}
                className="inline-flex items-center gap-2 bg-orange-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded hover:bg-orange-600 transition font-semibold text-xs sm:text-sm"
              >
                Clear Filters <FiArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;