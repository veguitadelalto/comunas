const express = require('express');
require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');
const app = express();
const port = process.env.PORT || 3000;

const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET;
const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL; 
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN; 

// Lista de comunas permitidas
const comunasPermitidas = ['La Reina', 'Las Condes', 'Ñuñoa', 'Providencia', 'Vitacura', 'Peñalolén', 'La Florida', 'Macul', 'Puente Alto'];

// Middleware para verificar la firma del webhook (Shopify HMAC)
app.use(express.json({ verify: (req, res, buf) => {
    const hmac = req.get('X-Shopify-Hmac-Sha256');
    const generatedHash = crypto.createHmac('sha256', SHOPIFY_API_SECRET).update(buf).digest('base64');
    if (generatedHash !== hmac) {
        res.status(401).send('Firma no válida');
    }
}}));

// Endpoint para validar las comunas en el checkout
app.post('/webhook/checkout_update', async (req, res) => {
    const checkoutData = req.body;

    // Extraer la comuna ingresada por el cliente
    const userComuna = checkoutData.shipping_address.city;

    // Validar si la comuna es permitida
    if (comunasPermitidas.includes(userComuna)) {
        // Si la comuna es permitida, validamos la dirección en Shopify
        const checkoutToken = checkoutData.id;  // El token del checkout

        try {
            // Hacemos una solicitud a la API de Shopify para validar la dirección
            const response = await axios.post(
                `https://${SHOPIFY_STORE_URL}/admin/api/2024-01/checkouts/${checkoutToken}/shipping_address.json`,
                {
                    shipping_address: {
                        address1: checkoutData.shipping_address.address1,
                        city: userComuna,
                        province: checkoutData.shipping_address.province,
                        zip: checkoutData.shipping_address.zip,
                        country: checkoutData.shipping_address.country
                    }
                },
                {
                    headers: {
                        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
                        'Content-Type': 'application/json'
                    }
                }
            );
            // Si todo va bien, respondemos con un éxito
            res.status(200).send('Comuna y dirección válidas');
        } catch (error) {
            console.error('Error validando la dirección en Shopify:', error.response?.data || error.message);
            res.status(400).send('Error validando la dirección');
        }
    } else {
        // Si la comuna no es permitida, respondemos con un error
        res.status(400).json({ error: 'Lo sentimos, no realizamos entregas a esta comuna.' });
    }
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en el puerto ${port}`);
});
