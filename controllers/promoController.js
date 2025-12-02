import PromoCode from '../models/promoModel.js';

// Create a new promo code (Admin only)
export const createPromoCode = async (req, res) => {
    try {
        const {
            code,
            discountType,
            discountValue,
            minPurchase,
            maxDiscount,
            startDate,
            endDate,
            usageLimit
        } = req.body;

        // Validate dates
        if (new Date(startDate) >= new Date(endDate)) {
            return res.status(400).json({
                success: false,
                message: 'End date must be after start date'
            });
        }

        const promoCode = new PromoCode({
            code: code.toUpperCase(),
            discountType,
            discountValue,
            minPurchase,
            maxDiscount,
            startDate,
            endDate,
            usageLimit
        });

        await promoCode.save();
        res.status(201).json({
            success: true,
            message: 'Promo code created successfully',
            promoCode
        });
    } catch (error) {
        console.error('Error creating promo code:', error);
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Promo code already exists'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error creating promo code'
        });
    }
};

// Validate and apply promo code
export const validatePromoCode = async (req, res) => {
    try {
        const { code, cartTotal } = req.body;

        const promoCode = await PromoCode.findOne({
            code: code.toUpperCase(),
            isActive: true,
            startDate: { $lte: new Date() },
            endDate: { $gte: new Date() }
        });

        if (!promoCode) {
            return res.status(404).json({
                success: false,
                message: 'Invalid or expired promo code'
            });
        }

        // Check minimum purchase requirement
        if (cartTotal < promoCode.minPurchase) {
            return res.status(400).json({
                success: false,
                message: `Minimum purchase amount of ${promoCode.minPurchase} required`
            });
        }

        // Check usage limit
        if (promoCode.usageLimit && promoCode.usedCount >= promoCode.usageLimit) {
            return res.status(400).json({
                success: false,
                message: 'Promo code usage limit reached'
            });
        }

        // Calculate discount
        let discount = 0;
        if (promoCode.discountType === 'percentage') {
            discount = (cartTotal * promoCode.discountValue) / 100;
            if (promoCode.maxDiscount) {
                discount = Math.min(discount, promoCode.maxDiscount);
            }
        } else {
            discount = Math.min(promoCode.discountValue, cartTotal);
        }

        const finalAmount = cartTotal - discount;

        res.json({
            success: true,
            discount,
            finalAmount,
            promoCode: {
                code: promoCode.code,
                discountType: promoCode.discountType,
                discountValue: promoCode.discountValue
            }
        });
    } catch (error) {
        console.error('Error validating promo code:', error);
        res.status(500).json({
            success: false,
            message: 'Error validating promo code'
        });
    }
};

// Get all active promo codes
export const getActivePromoCodes = async (req, res) => {
    try {
        const promoCodes = await PromoCode.find({
            isActive: true,
            startDate: { $lte: new Date() },
            endDate: { $gte: new Date() }
        }).select('code discountType discountValue minPurchase maxDiscount');

        res.json({
            success: true,
            promoCodes
        });
    } catch (error) {
        console.error('Error fetching promo codes:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching promo codes'
        });
    }
}; 