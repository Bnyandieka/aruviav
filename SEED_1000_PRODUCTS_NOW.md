# 🚀 Quick Fix: Seed 1000 Products Now

## Browser Console Method (Fastest)

Copy and paste this entire code into your browser console (F12 > Console tab):

```javascript
(async function seedProducts() {
  const { getFirestore, collection, writeBatch, doc } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
  const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js');
  
  const config = {
    apiKey: "AIzaSyCP9oMp9GhpfLJIeRzT029hxE4VuRXabpw",
    authDomain: "aruviah-7c395.firebaseapp.com",
    projectId: "aruviah-7c395",
    storageBucket: "aruviah-7c395.firebasestorage.app",
    messagingSenderId: "59625618979",
    appId: "1:59625618979:web:5ce3fe28eb574d45c63b96",
  };
  
  const app = initializeApp(config);
  const db = getFirestore(app);
  
  const CATEGORIES = ['electronics', 'fashion', 'beauty', 'home', 'sports', 'books'];
  const TEMPLATES = {
    electronics: ['Smartphone', 'Laptop', 'Tablet', 'Smartwatch', 'Headphones', 'Camera'],
    fashion: ['T-Shirt', 'Jeans', 'Jacket', 'Dress', 'Sneakers', 'Hoodie'],
    beauty: ['Skincare Set', 'Makeup Kit', 'Perfume', 'Haircare', 'Body Care'],
    home: ['Pillow', 'Blanket', 'Lamp', 'Rug', 'Sofa'],
    sports: ['Running Shoes', 'Yoga Mat', 'Dumbbell Set', 'Bicycle', 'Tennis Racket'],
    books: ['Fiction Novel', 'Self-Help', 'Tech Manual', 'Business Book', 'Biography']
  };
  
  const IMAGES = [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8',
    'https://images.unsplash.com/photo-1511707267537-b85faf00021e',
    'https://images.pexels.com/photos/699122/pexels-photo-699122.jpeg',
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
    'https://images.unsplash.com/photo-1596462502278-af3c41e6ce5e'
  ];
  
  console.log('🌱 Starting massive product seed (1000 products)...');
  let total = 0;
  const BATCH_SIZE = 50;
  
  function generateProduct() {
    const cat = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    const template = TEMPLATES[cat][Math.floor(Math.random() * TEMPLATES[cat].length)];
    const image = IMAGES[Math.floor(Math.random() * IMAGES.length)];
    const price = Math.floor(Math.random() * 50000 + 1000);
    
    return {
      name: `${template} #${Math.floor(Math.random() * 9999)}`,
      description: `Premium ${template} with excellent quality and features`,
      price: Math.floor(price * 0.8),
      originalPrice: price,
      category: cat,
      categoryId: cat,
      stock: Math.floor(Math.random() * 500) + 10,
      images: [image],
      image: image,
      rating: parseFloat((Math.random() * 2 + 3).toFixed(1)),
      reviewCount: Math.floor(Math.random() * 500),
      featured: Math.random() > 0.8,
      discount: Math.floor(Math.random() * 30),
      keywords: [template.toLowerCase(), cat],
      sold: Math.floor(Math.random() * 200),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
  
  for (let batch = 0; batch < 20; batch++) {
    const b = writeBatch(db);
    for (let i = 0; i < 50; i++) {
      const product = generateProduct();
      const docRef = doc(collection(db, 'products'));
      b.set(docRef, product);
    }
    await b.commit();
    total += 50;
    console.log(`✅ Created ${total}/1000 products (${Math.round(total/10)}%)`);
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log('🎉 SUCCESS! Created 1000 products!');
})();
```

**Steps:**
1. Go to your app in browser
2. Press `F12` to open DevTools
3. Click on "Console" tab
4. Paste the code above
5. Press Enter
6. Wait 30-60 seconds for completion
