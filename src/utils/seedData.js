// Location: src/utils/seedData.js
// Fixed version with all required export functions

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase/config';

const categories = [
  // Main Categories
  { name: 'Electronics', slug: 'electronics', icon: '📱', description: 'Phones, laptops, and gadgets' },
  { name: 'Fashion & Apparel', slug: 'fashion-apparel', icon: '👔', description: 'Clothing and fashion items' },
  { name: 'Home & Garden', slug: 'home-garden', icon: '🏠', description: 'Furniture and home decor' },
  { name: 'Sports & Outdoors', slug: 'sports-outdoors', icon: '⚽', description: 'Sports equipment and outdoor gear' },
  { name: 'Health & Beauty', slug: 'health-beauty', icon: '💄', description: 'Beauty and personal care' },
  { name: 'Books & Media', slug: 'books-media', icon: '📚', description: 'Books, audiobooks, and media' },
  { name: 'Toys & Games', slug: 'toys-games', icon: '🎮', description: 'Toys, games, and puzzles' },
  { name: 'Automotive', slug: 'automotive', icon: '🚗', description: 'Car parts and accessories' },
  { name: 'Grocery & Food', slug: 'grocery-food', icon: '🛒', description: 'Food and grocery items' },
  { name: 'Pet Supplies', slug: 'pet-supplies', icon: '🐾', description: 'Pet food and accessories' },
  { name: 'Baby & Kids', slug: 'baby-kids', icon: '👶', description: 'Baby and children products' },
  { name: 'Jewelry & Accessories', slug: 'jewelry-accessories', icon: '💎', description: 'Jewelry and fashion accessories' },
  { name: 'Office Supplies', slug: 'office-supplies', icon: '📎', description: 'Office and stationery items' },
  { name: 'Tools & Home Improvement', slug: 'tools-home-improvement', icon: '🔧', description: 'Tools and hardware' },
  { name: 'Arts & Crafts', slug: 'arts-crafts', icon: '🎨', description: 'Art supplies and craft materials' },
  { name: 'Music & Instruments', slug: 'music-instruments', icon: '🎸', description: 'Musical instruments and audio' },
  { name: 'Industrial & Scientific', slug: 'industrial-scientific', icon: '🔬', description: 'Industrial and scientific equipment' },
  { name: 'Collectibles & Antiques', slug: 'collectibles-antiques', icon: '🏺', description: 'Collectibles and antique items' },
  
  // Additional Specialized Categories
  { name: 'Furniture', slug: 'furniture', icon: '🛋️', description: 'Furniture for every room' },
  { name: 'Appliances', slug: 'appliances', icon: '🔌', description: 'Home and kitchen appliances' },
  { name: 'Outdoor & Camping', slug: 'outdoor-camping', icon: '⛺', description: 'Camping and outdoor equipment' },
  { name: 'Fitness & Exercise Equipment', slug: 'fitness-exercise', icon: '💪', description: 'Gym and fitness equipment' },
  { name: 'Video Games & Consoles', slug: 'video-games-consoles', icon: '🎯', description: 'Video games and gaming consoles' },
  { name: 'Cell Phones & Accessories', slug: 'cell-phones-accessories', icon: '📲', description: 'Phone and mobile accessories' },
  { name: 'Cameras & Photography', slug: 'cameras-photography', icon: '📷', description: 'Cameras and photography gear' },
  { name: 'Software & Digital Downloads', slug: 'software-digital', icon: '💾', description: 'Software and digital products' },
  { name: 'Movies & TV Shows', slug: 'movies-tv-shows', icon: '🎬', description: 'Movies and television content' },
  { name: 'Shoes & Footwear', slug: 'shoes-footwear', icon: '👟', description: 'Shoes and footwear' },
  { name: 'Watches', slug: 'watches', icon: '⌚', description: 'Watches and timepieces' },
  { name: 'Luggage & Travel Gear', slug: 'luggage-travel', icon: '✈️', description: 'Travel bags and luggage' },
  { name: 'Party Supplies & Events', slug: 'party-supplies', icon: '🎉', description: 'Party and event supplies' },
  { name: 'Seasonal & Holiday Items', slug: 'seasonal-holiday', icon: '🎄', description: 'Seasonal and holiday products' },
  { name: 'Gift Cards', slug: 'gift-cards', icon: '🎁', description: 'Digital and physical gift cards' },
  
  // Niche Categories
  { name: 'Handmade & Artisan Goods', slug: 'handmade-artisan', icon: '🖐️', description: 'Handmade and artisan products' },
  { name: 'Vintage & Used Items', slug: 'vintage-used', icon: '♻️', description: 'Vintage and pre-owned items' },
  { name: 'Sustainable & Eco-Friendly Products', slug: 'sustainable-eco', icon: '🌱', description: 'Eco-friendly and sustainable products' },
  { name: 'Smart Home & IoT Devices', slug: 'smart-home-iot', icon: '🏠', description: 'Smart home and IoT devices' },
  { name: 'Medical Supplies & Equipment', slug: 'medical-supplies', icon: '⚕️', description: 'Medical and healthcare equipment' },
  { name: 'Professional Services', slug: 'professional-services', icon: '👨‍💼', description: 'Professional services and consulting' },
  { name: 'Subscriptions & Memberships', slug: 'subscriptions-memberships', icon: '📋', description: 'Subscription boxes and memberships' }
];

const sampleProducts = [
  {
    name: 'Samsung Galaxy S23',
    description: 'Latest Samsung flagship smartphone with amazing camera and performance.',
    price: 89999,
    originalPrice: 119999,
    category: 'electronics',
    categoryId: 'electronics',
    stock: 50,
    images: [
      'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600',
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600'
    ],
    rating: 4.5,
    reviewCount: 156,
    featured: true,
    discount: 25,
    features: [
      '6.1" Dynamic AMOLED Display',
      '50MP Triple Camera',
      '8GB RAM, 256GB Storage',
      '5000mAh Battery'
    ],
    specifications: {
      'Brand': 'Samsung',
      'Model': 'Galaxy S23',
      'Display': '6.1 inches',
      'Processor': 'Snapdragon 8 Gen 2',
      'RAM': '8GB',
      'Storage': '256GB'
    },
    keywords: ['samsung', 'galaxy', 's23', 'phone', 'smartphone', 'electronics']
  },
  {
    name: 'Apple iPhone 14 Pro',
    description: 'Premium iPhone with Dynamic Island and pro camera system.',
    price: 145000,
    originalPrice: 165000,
    category: 'electronics',
    categoryId: 'electronics',
    stock: 30,
    images: [
      'https://images.unsplash.com/photo-1678652197831-2d180705cd2c?w=600',
      'https://images.unsplash.com/photo-1678685888221-c82c4e3e5109?w=600'
    ],
    rating: 4.8,
    reviewCount: 234,
    featured: true,
    discount: 12,
    features: [
      'Dynamic Island',
      '48MP Pro Camera System',
      'A16 Bionic Chip',
      'All-day battery life'
    ],
    specifications: {
      'Brand': 'Apple',
      'Model': 'iPhone 14 Pro',
      'Display': '6.1 inches',
      'Processor': 'A16 Bionic',
      'RAM': '6GB',
      'Storage': '256GB'
    },
    keywords: ['apple', 'iphone', '14', 'pro', 'phone', 'smartphone', 'electronics']
  },
  {
    name: 'Sony WH-1000XM5',
    description: 'Industry-leading noise canceling wireless headphones.',
    price: 32999,
    originalPrice: 39999,
    category: 'electronics',
    categoryId: 'electronics',
    stock: 75,
    images: [
      'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=600',
      'https://images.unsplash.com/photo-1545127398-14699f92334b?w=600'
    ],
    rating: 4.7,
    reviewCount: 189,
    featured: false,
    discount: 18,
    features: [
      'Industry-leading noise cancellation',
      '30 hours battery life',
      'Premium sound quality',
      'Multipoint connection'
    ],
    keywords: ['sony', 'headphones', 'wireless', 'noise', 'canceling', 'electronics']
  },
  {
    name: 'Nike Air Max 270',
    description: 'Comfortable running shoes with Max Air cushioning.',
    price: 12499,
    originalPrice: 15999,
    category: 'sports',
    categoryId: 'sports',
    stock: 120,
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600',
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600'
    ],
    rating: 4.6,
    reviewCount: 342,
    featured: true,
    discount: 22,
    features: [
      'Max Air cushioning',
      'Breathable mesh upper',
      'Durable rubber outsole',
      'Lightweight design'
    ],
    keywords: ['nike', 'air', 'max', 'shoes', 'running', 'sports', 'sneakers']
  },
  {
    name: 'Levi\'s 501 Original Jeans',
    description: 'Classic straight fit jeans, the original since 1873.',
    price: 5999,
    originalPrice: 7999,
    category: 'fashion',
    categoryId: 'fashion',
    stock: 200,
    images: [
      'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600',
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600'
    ],
    rating: 4.4,
    reviewCount: 567,
    featured: false,
    discount: 25,
    features: [
      'Classic straight fit',
      '100% cotton denim',
      'Button fly',
      'Sits at waist'
    ],
    keywords: ['levis', '501', 'jeans', 'denim', 'fashion', 'pants']
  },
  {
    name: 'Dell XPS 13 Laptop',
    description: '13.4" FHD+ laptop with Intel Core i7 and 16GB RAM.',
    price: 125000,
    originalPrice: 145000,
    category: 'electronics',
    categoryId: 'electronics',
    stock: 25,
    images: [
      'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=600',
      'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600'
    ],
    rating: 4.7,
    reviewCount: 145,
    featured: true,
    discount: 14,
    features: [
      '13.4" FHD+ Display',
      'Intel Core i7',
      '16GB RAM, 512GB SSD',
      'All-day battery'
    ],
    specifications: {
      'Brand': 'Dell',
      'Model': 'XPS 13',
      'Display': '13.4 inches FHD+',
      'Processor': 'Intel Core i7',
      'RAM': '16GB',
      'Storage': '512GB SSD'
    },
    keywords: ['dell', 'xps', '13', 'laptop', 'computer', 'electronics']
  },
  {
    name: 'Instant Pot Duo',
    description: '7-in-1 electric pressure cooker for quick meals.',
    price: 8999,
    originalPrice: 11999,
    category: 'home',
    categoryId: 'home',
    stock: 85,
    images: [
      'https://images.unsplash.com/photo-1585515320310-259814833e62?w=600'
    ],
    rating: 4.6,
    reviewCount: 892,
    featured: false,
    discount: 25,
    features: [
      '7-in-1 functionality',
      '6 quart capacity',
      '14 smart programs',
      'Stainless steel interior'
    ],
    keywords: ['instant', 'pot', 'cooker', 'pressure', 'kitchen', 'home']
  },
  {
    name: 'Fitbit Charge 5',
    description: 'Advanced fitness tracker with built-in GPS.',
    price: 14999,
    originalPrice: 17999,
    category: 'sports',
    categoryId: 'sports',
    stock: 95,
    images: [
      'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600'
    ],
    rating: 4.5,
    reviewCount: 234,
    featured: true,
    discount: 17,
    features: [
      'Built-in GPS',
      'Heart rate monitoring',
      '7-day battery life',
      'Stress management'
    ],
    keywords: ['fitbit', 'charge', 'fitness', 'tracker', 'sports', 'health']
  },
  {
    name: 'Adidas Ultraboost 22',
    description: 'Premium running shoes with Boost cushioning technology.',
    price: 16999,
    originalPrice: 19999,
    category: 'sports',
    categoryId: 'sports',
    stock: 65,
    images: [
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600'
    ],
    rating: 4.7,
    reviewCount: 287,
    featured: false,
    discount: 15,
    features: [
      'Boost cushioning',
      'Primeknit upper',
      'Continental rubber outsole',
      'Responsive feel'
    ],
    keywords: ['adidas', 'ultraboost', 'running', 'shoes', 'sports']
  },
  {
    name: 'Canon EOS R6',
    description: 'Full-frame mirrorless camera with 20MP sensor.',
    price: 245000,
    originalPrice: 279000,
    category: 'electronics',
    categoryId: 'electronics',
    stock: 15,
    images: [
      'https://images.unsplash.com/photo-1606980707168-c21d2641e6a5?w=600'
    ],
    rating: 4.9,
    reviewCount: 98,
    featured: true,
    discount: 12,
    features: [
      '20MP Full-Frame Sensor',
      '4K 60fps Video',
      'In-body Image Stabilization',
      'Dual Card Slots'
    ],
    keywords: ['canon', 'eos', 'r6', 'camera', 'photography', 'electronics']
  },
  {
    name: 'Zara Leather Jacket',
    description: 'Premium genuine leather jacket with modern cut.',
    price: 18999,
    originalPrice: 24999,
    category: 'fashion',
    categoryId: 'fashion',
    stock: 45,
    images: [
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600'
    ],
    rating: 4.5,
    reviewCount: 156,
    featured: false,
    discount: 24,
    features: [
      'Genuine leather',
      'Slim fit design',
      'Multiple pockets',
      'Soft interior lining'
    ],
    keywords: ['zara', 'leather', 'jacket', 'fashion', 'clothing']
  },
  {
    name: 'Dyson V15 Detect',
    description: 'Cordless vacuum with laser dust detection.',
    price: 54999,
    originalPrice: 64999,
    category: 'home',
    categoryId: 'home',
    stock: 35,
    images: [
      'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=600'
    ],
    rating: 4.8,
    reviewCount: 423,
    featured: true,
    discount: 15,
    features: [
      'Laser dust detection',
      '60 minutes runtime',
      'HEPA filtration',
      'LCD screen display'
    ],
    keywords: ['dyson', 'vacuum', 'cordless', 'home', 'cleaning']
  },
  {
    name: 'Nintendo Switch OLED',
    description: 'Gaming console with vibrant 7-inch OLED screen.',
    price: 34999,
    originalPrice: 39999,
    category: 'electronics',
    categoryId: 'electronics',
    stock: 60,
    images: [
      'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=600'
    ],
    rating: 4.7,
    reviewCount: 567,
    featured: true,
    discount: 13,
    features: [
      '7-inch OLED screen',
      'Enhanced audio',
      '64GB internal storage',
      'Adjustable stand'
    ],
    keywords: ['nintendo', 'switch', 'oled', 'gaming', 'console', 'electronics']
  },
  {
    name: 'The Ordinary Niacinamide Serum',
    description: 'High-strength vitamin and zinc serum for clear skin.',
    price: 1299,
    originalPrice: 1599,
    category: 'beauty',
    categoryId: 'beauty',
    stock: 250,
    images: [
      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600'
    ],
    rating: 4.6,
    reviewCount: 1234,
    featured: false,
    discount: 19,
    features: [
      '10% Niacinamide',
      '1% Zinc',
      'Reduces blemishes',
      'Oil control'
    ],
    keywords: ['ordinary', 'niacinamide', 'serum', 'skincare', 'beauty']
  },
  {
    name: 'Atomic Habits Book',
    description: 'Bestselling book on building good habits by James Clear.',
    price: 1499,
    originalPrice: 1999,
    category: 'books',
    categoryId: 'books',
    stock: 180,
    images: [
      'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600'
    ],
    rating: 4.8,
    reviewCount: 3421,
    featured: true,
    discount: 25,
    features: [
      'Paperback edition',
      '320 pages',
      'Self-help genre',
      'International bestseller'
    ],
    keywords: ['atomic', 'habits', 'book', 'self-help', 'james clear']
  },
  {
    name: 'IKEA POÄNG Armchair',
    description: 'Comfortable armchair with layer-glued bent birch frame.',
    price: 7999,
    originalPrice: 9999,
    category: 'home',
    categoryId: 'home',
    stock: 55,
    images: [
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600'
    ],
    rating: 4.5,
    reviewCount: 678,
    featured: false,
    discount: 20,
    features: [
      'Layer-glued bent wood',
      'Removable cover',
      'Ergonomic design',
      'Easy to assemble'
    ],
    keywords: ['ikea', 'poang', 'armchair', 'furniture', 'home']
  },
  {
    name: 'Yoga Mat Premium',
    description: 'Non-slip exercise mat perfect for yoga and fitness.',
    price: 2499,
    originalPrice: 3499,
    category: 'sports',
    categoryId: 'sports',
    stock: 150,
    images: [
      'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600'
    ],
    rating: 4.4,
    reviewCount: 432,
    featured: false,
    discount: 29,
    features: [
      'Non-slip surface',
      '6mm thickness',
      'Eco-friendly material',
      'Carrying strap included'
    ],
    keywords: ['yoga', 'mat', 'exercise', 'fitness', 'sports']
  },
  {
    name: 'H&M Cotton T-Shirt Pack',
    description: 'Pack of 3 basic cotton t-shirts in assorted colors.',
    price: 1999,
    originalPrice: 2999,
    category: 'fashion',
    categoryId: 'fashion',
    stock: 300,
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600'
    ],
    rating: 4.3,
    reviewCount: 891,
    featured: false,
    discount: 33,
    features: [
      'Pack of 3',
      '100% cotton',
      'Regular fit',
      'Machine washable'
    ],
    keywords: ['hm', 'tshirt', 'cotton', 'fashion', 'basics']
  }
];

// Seed only categories
export const seedCategories = async () => {
  try {
    console.log('📁 Seeding categories...');
    
    let addedCount = 0;
    for (const category of categories) {
      await addDoc(collection(db, 'categories'), {
        ...category,
        createdAt: serverTimestamp()
      });
      addedCount++;
    }
    
    console.log(`✅ ${addedCount} categories seeded!`);
    return {
      success: true,
      message: `Successfully added ${addedCount} categories to the database.`
    };
    
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Seed only products
export const seedProducts = async () => {
  try {
    console.log('📦 Seeding products...');
    
    let addedCount = 0;
    for (const product of sampleProducts) {
      await addDoc(collection(db, 'products'), {
        ...product,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      addedCount++;
    }
    
    console.log(`✅ ${addedCount} products seeded!`);
    return {
      success: true,
      message: `Successfully added ${addedCount} products to the database.`
    };
    
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Seed all data (categories + products)
export const seedAllData = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Seed Categories first
    const categoriesResult = await seedCategories();
    if (!categoriesResult.success) {
      throw new Error('Failed to seed categories: ' + categoriesResult.error);
    }

    // Then seed Products
    const productsResult = await seedProducts();
    if (!productsResult.success) {
      throw new Error('Failed to seed products: ' + productsResult.error);
    }

    console.log('🎉 Database seeding completed successfully!');
    return {
      success: true,
      message: `Successfully seeded ${categories.length} categories and ${sampleProducts.length} products!`
    };
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Legacy function for backwards compatibility
export const seedDatabase = seedAllData;