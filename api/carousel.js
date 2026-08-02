const FIRESTORE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const FIRESTORE_API_KEY = process.env.FIREBASE_API_KEY;
const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents`;

async function getCarousel() {
  try {
    const response = await fetch(
      `${FIRESTORE_BASE_URL}/carousel?key=${FIRESTORE_API_KEY}`,
      { method: 'GET' }
    );

    if (!response.ok) return [];

    const data = await response.json();
    const images = [];

    if (data.documents) {
      data.documents.forEach(doc => {
        const fields = doc.fields || {};
        images.push({
          id: doc.name.split('/').pop(),
          url: fields.url?.stringValue || '',
          title: fields.title?.stringValue || '',
          order: parseInt(fields.order?.integerValue || 0)
        });
      });
    }

    return images.sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error('Error fetching carousel:', error);
    return [];
  }
}

async function addCarouselImage(image) {
  const fields = {
    url: { stringValue: image.url || '' },
    title: { stringValue: image.title || '' },
    order: { integerValue: String(image.order || 0) }
  };

  try {
    const response = await fetch(
      `${FIRESTORE_BASE_URL}/carousel?key=${FIRESTORE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields })
      }
    );

    if (!response.ok) throw new Error(`Failed: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error('Error adding image:', error);
    throw error;
  }
}

async function deleteCarouselImage(imageId) {
  try {
    const response = await fetch(
      `${FIRESTORE_BASE_URL}/carousel/${imageId}?key=${FIRESTORE_API_KEY}`,
      { method: 'DELETE' }
    );

    if (!response.ok) throw new Error(`Failed: ${response.statusText}`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  const method = req.method;
  const { imageId } = req.query;

  try {
    if (method === 'GET') {
      const images = await getCarousel();
      return res.status(200).json(images);
    }

    if (method === 'POST') {
      const image = req.body;
      const result = await addCarouselImage(image);
      return res.status(201).json(result);
    }

    if (method === 'DELETE' && imageId) {
      const result = await deleteCarouselImage(imageId);
      return res.status(200).json(result);
    }

    return res.status(400).json({ error: 'Invalid request' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
