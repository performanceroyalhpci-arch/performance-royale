const FIRESTORE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const FIRESTORE_API_KEY = process.env.FIREBASE_API_KEY;
const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents`;

async function getOrders() {
  try {
    const response = await fetch(
      `${FIRESTORE_BASE_URL}/orders?key=${FIRESTORE_API_KEY}`,
      { method: 'GET' }
    );

    if (!response.ok) return [];

    const data = await response.json();
    const orders = [];

    if (data.documents) {
      data.documents.forEach(doc => {
        const fields = doc.fields || {};
        orders.push({
          id: doc.name.split('/').pop(),
          customerName: fields.customerName?.stringValue || '',
          customerPhone: fields.customerPhone?.stringValue || '',
          customerEmail: fields.customerEmail?.stringValue || '',
          items: fields.items?.arrayValue?.values?.map(v => ({
            productId: v.mapValue?.fields?.productId?.stringValue || '',
            productName: v.mapValue?.fields?.productName?.stringValue || '',
            quantity: parseInt(v.mapValue?.fields?.quantity?.integerValue || 1),
            price: parseInt(v.mapValue?.fields?.price?.integerValue || 0)
          })) || [],
          totalAmount: parseInt(fields.totalAmount?.integerValue || 0),
          deliveryAddress: fields.deliveryAddress?.stringValue || '',
          paymentMethod: fields.paymentMethod?.stringValue || '',
          status: fields.status?.stringValue || 'pending',
          notes: fields.notes?.stringValue || '',
          createdAt: fields.createdAt?.timestampValue || new Date().toISOString()
        });
      });
    }

    return orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
}

async function createOrder(order) {
  const fields = {
    customerName: { stringValue: order.customerName || '' },
    customerPhone: { stringValue: order.customerPhone || '' },
    customerEmail: { stringValue: order.customerEmail || '' },
    items: {
      arrayValue: {
        values: (order.items || []).map(item => ({
          mapValue: {
            fields: {
              productId: { stringValue: item.productId || '' },
              productName: { stringValue: item.productName || '' },
              quantity: { integerValue: String(item.quantity || 1) },
              price: { integerValue: String(item.price || 0) }
            }
          }
        }))
      }
    },
    totalAmount: { integerValue: String(order.totalAmount || 0) },
    deliveryAddress: { stringValue: order.deliveryAddress || '' },
    paymentMethod: { stringValue: order.paymentMethod || '' },
    status: { stringValue: order.status || 'pending' },
    notes: { stringValue: order.notes || '' },
    createdAt: { timestampValue: new Date().toISOString() }
  };

  try {
    const response = await fetch(
      `${FIRESTORE_BASE_URL}/orders?key=${FIRESTORE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields })
      }
    );

    if (!response.ok) throw new Error(`Failed: ${response.statusText}`);

    const data = await response.json();
    return {
      id: data.name.split('/').pop(),
      ...order
    };
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

async function updateOrder(orderId, order) {
  const fields = {
    customerName: { stringValue: order.customerName || '' },
    customerPhone: { stringValue: order.customerPhone || '' },
    customerEmail: { stringValue: order.customerEmail || '' },
    items: {
      arrayValue: {
        values: (order.items || []).map(item => ({
          mapValue: {
            fields: {
              productId: { stringValue: item.productId || '' },
              productName: { stringValue: item.productName || '' },
              quantity: { integerValue: String(item.quantity || 1) },
              price: { integerValue: String(item.price || 0) }
            }
          }
        }))
      }
    },
    totalAmount: { integerValue: String(order.totalAmount || 0) },
    deliveryAddress: { stringValue: order.deliveryAddress || '' },
    paymentMethod: { stringValue: order.paymentMethod || '' },
    status: { stringValue: order.status || 'pending' },
    notes: { stringValue: order.notes || '' }
  };

  try {
    const response = await fetch(
      `${FIRESTORE_BASE_URL}/orders/${orderId}?key=${FIRESTORE_API_KEY}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields })
      }
    );

    if (!response.ok) throw new Error(`Failed: ${response.statusText}`);
    return { id: orderId, ...order };
  } catch (error) {
    console.error('Error updating order:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  const method = req.method;
  const { orderId } = req.query;

  try {
    if (method === 'GET') {
      const orders = await getOrders();
      return res.status(200).json(orders);
    }

    if (method === 'POST') {
      const order = req.body;
      const created = await createOrder(order);
      return res.status(201).json(created);
    }

    if (method === 'PUT' && orderId) {
      const order = req.body;
      const updated = await updateOrder(orderId, order);
      return res.status(200).json(updated);
    }

    return res.status(400).json({ error: 'Invalid request' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
