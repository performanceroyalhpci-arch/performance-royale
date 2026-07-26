const FIRESTORE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const FIRESTORE_API_KEY = process.env.FIREBASE_API_KEY;
const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents`;

async function getProducts() {
  try {
    const response = await fetch(
      `${FIRESTORE_BASE_URL}/products?key=${FIRESTORE_API_KEY}`,
      { method: 'GET' }
    );
    
    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const products = [];

    if (data.documents) {
      data.documents.forEach(doc => {
        const fields = doc.fields || {};
        products.push({
          id: doc.name.split('/').pop(),
          name: fields.name?.stringValue || '',
          slug: fields.slug?.stringValue || '',
          tagline: fields.tagline?.stringValue || '',
          price: parseInt(fields.price?.integerValue || 0),
          oldPrice: fields.oldPrice?.integerValue ? parseInt(fields.oldPrice.integerValue) : null,
          description: fields.description?.stringValue || '',
          usage: fields.usage?.stringValue || '',
          badge: fields.badge?.stringValue || '',
          minQty: fields.minQty?.integerValue ? parseInt(fields.minQty.integerValue) : undefined,
          benefits: fields.benefits?.arrayValue?.values?.map(v => v.stringValue) || [],
          ingredients: fields.ingredients?.arrayValue?.values?.map(v => v.stringValue) || [],
          image: fields.image?.stringValue || '',
          gallery: fields.gallery?.arrayValue?.values?.map(v => v.stringValue) || [],
          promo: fields.promo?.booleanValue || false
        });
      });
    }

    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

async function createProduct(product) {
  const fields = {
    name: { stringValue: product.name || '' },
    slug: { stringValue: product.slug || '' },
    tagline: { stringValue: product.tagline || '' },
    price: { integerValue: String(product.price || 0) },
    description: { stringValue: product.description || '' },
    usage: { stringValue: product.usage || '' },
    badge: { stringValue: product.badge || '' },
    image: { stringValue: product.image || '' },
    promo: { booleanValue: product.p
