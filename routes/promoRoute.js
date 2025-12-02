import express from 'express';
import { createPromoCode, validatePromoCode, getActivePromoCodes } from '../controllers/promoController.js';

const router = express.Router();

// Admin routes
router.post('/create', createPromoCode);
router.get('/active', getActivePromoCodes);

// User routes
router.post('/validate', validatePromoCode);

export default router; 