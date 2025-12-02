import express from 'express';
import { createPaymentIntent, handlePaymentSuccess } from '../controllers/paymentController.js';

const router = express.Router();

// Test endpoint to verify Stripe configuration
router.get('/test-config', (req, res) => {
    try {
        if (!process.env.STRIPE_SECRET_KEY) {
            return res.status(500).json({
                success: false,
                message: 'Stripe secret key is not configured'
            });
        }
        res.json({
            success: true,
            message: 'Stripe is properly configured',
            publishableKey: process.env.STRIPE_PUBLISHABLE_KEY ? 'Configured' : 'Not configured'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error checking Stripe configuration'
        });
    }
});

router.post('/create-payment-intent', createPaymentIntent);
router.post('/payment-success', handlePaymentSuccess);

export default router; 