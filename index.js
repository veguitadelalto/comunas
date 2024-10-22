const express = require('express');
require('dotenv').config();
const crypto = require('crypto');
const app = express();
const port = process.env.PORT || 3000;

// Configura tu clave secreta de Shopify (la obtendrás desde la configuración de tu app en Shopify)
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET;

// Lista de comunas permitidas
const comunasPermitidas = ['La Reina', 'Las Condes', 'Ñuñoa', 'Providencia', 'Vitacura', 'Peñalolén', 'La Florida', 'Macul', 'Puente Alto'];

// Middleware para verificar la firma del webhook
app.use(express.json({ verify: (req, res, buf) => {
    const hmac = req.get('X-Shopify-Hmac-Sha256');
    const generatedHash = crypto.createHmac('sha256', SHOPIFY_API_SECRET).update(buf).digest('base64');
    if (generatedHash !== hmac) {
        res.status(401).send('Firma no válida');
    }
}}));

// Endpoint del webhook para validar comunas
app.post('/webhook/checkout_update', (req, res) => {
    const checkoutData = req.body;

    // Extraer la comuna ingresada por el cliente en el checkout
    const userComuna = checkoutData.shipping_address.city;

    // Validar si la comuna es permitida
    if (comunasPermitidas.includes(userComuna)) {
        res.status(200).send('Comuna válida');
    } else {
        res.status(400).json({ error: 'Lo sentimos, no realizamos entregas a esta comuna.' });
    }
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en el puerto ${port}`);
});