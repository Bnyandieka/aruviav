// src/services/firebase/flashSalesHelper.js
// Flash Sales Algorithm and Management

import { 
  collection, 
  query, 
  where, 
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from './config';

/**
 * Flash Sale Algorithm
 * 
 * Criteria for automatic flash sale selection:
 * 1. Product must have high inventory (stock > 20)
 * 2. Product must not be on current flash sale
 * 3. Prefer products with high rating (4+ stars)
 * 4. Prefer products with many reviews (20+)
 * 5. Prefer higher discounts (20%+ discount)
 * 6. Prefer popular categories
 * 7. Randomize to avoid same products every time
 */

const ALGORITHM_CONFIG = {
  minStock: 20,
  minRating: 4,
  minReviews: 20,
  minDiscountPercent: 20,
  popularCategories: [
    'electronics',
    'fashion',
    'home',
    'sports',
    'beauty',
    'appliances'
  ],
  flashSaleDurationHours: 24,
  maxProductsPerFlashSale: 10
};

/**
 * Calculate flash sale score for a product
 * Higher score = better candidate for flash sale
 */
const calculateFlashSaleScore = (product) => {
  let score = 0;

  // Stock availability bonus (0-25 points)
  const stockBonus = Math.min((product.stock / 100) * 25, 25);
  score += stockBonus;

  // Rating bonus (0-25 points)
  const rating = product.rating || 0;
  if (rating >= 4) {
    score += 25;
  } else if (rating >= 3) {
    score += 15;
  } else if (rating >= 2) {
    score += 5;
  }

  // Review count bonus (0-20 points)
  const reviewCount = product.reviewCount || 0;
  const reviewBonus = Math.min((reviewCount / 100) * 20, 20);
  score += reviewBonus;

  // Discount bonus (0-20 points)
  if (product.originalPrice && product.price) {
    const discountPercent = ((product.originalPrice - product.price) / product.originalPrice) * 100;
    if (discountPercent >= 30) {
      score += 20;
    } else if (discountPercent >= 20) {
      score += 15;
    } else if (discountPercent >= 10) {
      score += 10;
    }
  }

  // Category popularity bonus (0-10 points)
  if (ALGORITHM_CONFIG.popularCategories.includes(product.category)) {
    score += 10;
  }

  return score;
};

/**
 * Get products eligible for flash sale
 */
export const getFlashSaleEligibleProducts = async () => {
  try {
    // Get all products
    const productsRef = collection(db, 'products');
    const querySnapshot = await getDocs(productsRef);
    
    const products = [];
    querySnapshot.forEach((doc) => {
      products.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Get current flash sales
    const flashSalesRef = collection(db, 'flashSales');
    const flashSalesSnapshot = await getDocs(flashSalesRef);
    
    const activeFlashSaleIds = new Set();
    flashSalesSnapshot.forEach((doc) => {
      const flashSale = doc.data();
      if (flashSale.isActive && flashSale.endTime > new Date()) {
        flashSale.productIds?.forEach(id => activeFlashSaleIds.add(id));
      }
    });

    // Filter eligible products
    const eligibleProducts = products
      .filter(p => {
        // Must have sufficient stock
        if (p.stock < ALGORITHM_CONFIG.minStock) return false;
        
        // Must not be in active flash sale
        if (activeFlashSaleIds.has(p.id)) return false;
        
        // Must have discount
        if (!p.originalPrice || p.price >= p.originalPrice) return false;
        
        return true;
      })
      .map(p => ({
        ...p,
        score: calculateFlashSaleScore(p)
      }))
      .sort((a, b) => b.score - a.score);

    console.log(`✅ Found ${eligibleProducts.length} products eligible for flash sale`);
    return { products: eligibleProducts, error: null };

  } catch (error) {
    console.error('❌ Error getting flash sale eligible products:', error);
    return { products: [], error: error.message };
  }
};

/**
 * Create automatic flash sale from eligible products
 */
export const createAutoFlashSale = async (name = 'Auto Flash Sale', count = 10) => {
  try {
    const { products: eligibleProducts, error } = await getFlashSaleEligibleProducts();
    
    if (error) {
      return { success: false, error };
    }

    // Select top products
    const selectedProducts = eligibleProducts.slice(0, count);
    
    if (selectedProducts.length === 0) {
      return { success: false, error: 'No eligible products for flash sale' };
    }

    // Create flash sale document
    const flashSaleRef = collection(db, 'flashSales');
    const now = new Date();
    const endTime = new Date(now.getTime() + ALGORITHM_CONFIG.flashSaleDurationHours * 60 * 60 * 1000);

    const flashSaleData = {
      name,
      description: `Automatic flash sale with ${selectedProducts.length} products`,
      isActive: true,
      startTime: now,
      endTime,
      productIds: selectedProducts.map(p => p.id),
      products: selectedProducts.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        originalPrice: p.originalPrice,
        discount: Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100),
        image: p.images?.[0] || '',
        score: p.score
      })),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      source: 'automatic'
    };

    const docRef = await addDoc(flashSaleRef, flashSaleData);
    
    console.log('✅ Auto flash sale created:', docRef.id);
    return { 
      success: true, 
      flashSaleId: docRef.id,
      productCount: selectedProducts.length,
      products: selectedProducts
    };

  } catch (error) {
    console.error('❌ Error creating auto flash sale:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create manual flash sale (admin selects specific products)
 */
export const createManualFlashSale = async (name, description, productIds, duration = 24) => {
  try {
    const flashSaleRef = collection(db, 'flashSales');
    const now = new Date();
    const endTime = new Date(now.getTime() + duration * 60 * 60 * 1000);

    const flashSaleData = {
      name,
      description,
      isActive: true,
      startTime: now,
      endTime,
      productIds,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      source: 'manual'
    };

    const docRef = await addDoc(flashSaleRef, flashSaleData);
    
    console.log('✅ Manual flash sale created:', docRef.id);
    return { success: true, flashSaleId: docRef.id };

  } catch (error) {
    console.error('❌ Error creating manual flash sale:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all flash sales
 */
export const getAllFlashSales = async (activeOnly = false) => {
  try {
    const flashSalesRef = collection(db, 'flashSales');
    let q = flashSalesRef;

    if (activeOnly) {
      q = query(flashSalesRef, where('isActive', '==', true));
    }

    const querySnapshot = await getDocs(q);
    const flashSales = [];

    querySnapshot.forEach((doc) => {
      flashSales.push({
        id: doc.id,
        ...doc.data()
      });
    });

    console.log(`✅ Retrieved ${flashSales.length} flash sales`);
    return { flashSales, error: null };

  } catch (error) {
    console.error('❌ Error getting flash sales:', error);
    return { flashSales: [], error: error.message };
  }
};

/**
 * Get active flash sales with products
 */
export const getActiveFlashSalesWithProducts = async () => {
  try {
    const now = new Date();
    const { flashSales, error } = await getAllFlashSales(true);

    if (error) {
      return { flashSales: [], error };
    }

    // Filter by end time
    const activeFlashSales = flashSales
      .filter(fs => fs.endTime > now)
      .map(fs => ({
        ...fs,
        timeRemaining: Math.max(0, fs.endTime - now)
      }));

    return { flashSales: activeFlashSales, error: null };

  } catch (error) {
    console.error('❌ Error getting active flash sales:', error);
    return { flashSales: [], error: error.message };
  }
};

/**
 * Update flash sale
 */
export const updateFlashSale = async (flashSaleId, updates) => {
  try {
    const docRef = doc(db, 'flashSales', flashSaleId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });

    console.log('✅ Flash sale updated:', flashSaleId);
    return { success: true, error: null };

  } catch (error) {
    console.error('❌ Error updating flash sale:', error);
    return { success: false, error: error.message };
  }
};

/**
 * End flash sale
 */
export const endFlashSale = async (flashSaleId) => {
  try {
    return await updateFlashSale(flashSaleId, { isActive: false });
  } catch (error) {
    console.error('❌ Error ending flash sale:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete flash sale
 */
export const deleteFlashSale = async (flashSaleId) => {
  try {
    await deleteDoc(doc(db, 'flashSales', flashSaleId));
    console.log('✅ Flash sale deleted:', flashSaleId);
    return { success: true, error: null };

  } catch (error) {
    console.error('❌ Error deleting flash sale:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get flash sale algorithm stats and recommendations
 */
export const getFlashSaleStats = async () => {
  try {
    const { products: allProducts } = await getFlashSaleEligibleProducts();
    const { flashSales: activeSales } = await getAllFlashSales(true);

    let totalProductsInSales = 0;
    let totalSaleValue = 0;

    activeSales.forEach(sale => {
      totalProductsInSales += sale.productIds?.length || 0;
      sale.products?.forEach(p => {
        totalSaleValue += (p.originalPrice - p.price) * 10; // Estimate based on average sales
      });
    });

    return {
      success: true,
      stats: {
        eligibleProducts: allProducts.length,
        activeFlashSales: activeSales.length,
        totalProductsInSales,
        totalEstimatedSavings: totalSaleValue,
        topCandidates: allProducts.slice(0, 5)
      }
    };

  } catch (error) {
    console.error('❌ Error getting flash sale stats:', error);
    return { success: false, error: error.message };
  }
};

export default {
  calculateFlashSaleScore,
  createAutoFlashSale,
  createManualFlashSale,
  getFlashSaleEligibleProducts,
  getAllFlashSales,
  getActiveFlashSalesWithProducts,
  updateFlashSale,
  endFlashSale,
  deleteFlashSale,
  getFlashSaleStats
};
