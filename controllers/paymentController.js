import Stripe from 'stripe';
import PromoCode from '../models/promoModel.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Stripe with error handling
let stripe;
try {
    if (!process.env.STRIPE_SECRET_KEY) {
        console.error('STRIPE_SECRET_KEY is not configured in environment variables');
        process.exit(1);
    }
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    console.log('Stripe initialized successfully');
} catch (error) {
    console.error('Error initializing Stripe:', error);
    process.exit(1);
}

// Create payment intent
export const createPaymentIntent = async (req, res) => {
    try {
        console.log('Creating payment intent with data:', req.body);
        const { amount, promoCode, customerDetails } = req.body;

        if (!amount || amount <= 0) {
            console.error('Invalid amount:', amount);
            return res.status(400).json({
                success: false,
                message: 'Invalid amount'
            });
        }

        // Validate and apply promo code if provided
        let finalAmount = amount;
        let appliedPromoCode = null;

        if (promoCode) {
            try {
                const promoResult = await PromoCode.findOne({
                    code: promoCode.toUpperCase(),
                    isActive: true,
                    startDate: { $lte: new Date() },
                    endDate: { $gte: new Date() }
                });

                if (promoResult) {
                    let discount = 0;
                    if (promoResult.discountType === 'percentage') {
                        discount = (amount * promoResult.discountValue) / 100;
                        if (promoResult.maxDiscount) {
                            discount = Math.min(discount, promoResult.maxDiscount);
                        }
                    } else {
                        discount = Math.min(promoResult.discountValue, amount);
                    }

                    finalAmount = amount - discount;
                    appliedPromoCode = promoResult.code;

                    // Increment usage count
                    await PromoCode.findByIdAndUpdate(promoResult._id, {
                        $inc: { usedCount: 1 }
                    });
                }
            } catch (promoError) {
                console.error('Error processing promo code:', promoError);
                // Continue without promo code if there's an error
            }
        }

        console.log('Creating Stripe payment intent for amount:', finalAmount);

        // Create payment intent with Stripe
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(finalAmount * 100), // Convert to cents
            currency: 'usd',
            metadata: {
                originalAmount: amount,
                promoCode: appliedPromoCode,
                discount: amount - finalAmount,
                customerEmail: customerDetails?.email,
                customerName: `${customerDetails?.firstName} ${customerDetails?.lastName}`
            },
            receipt_email: customerDetails?.email,
            shipping: customerDetails ? {
                name: `${customerDetails.firstName} ${customerDetails.lastName}`,
                address: {
                    line1: customerDetails.street,
                    city: customerDetails.city,
                    state: customerDetails.state,
                    postal_code: customerDetails.zipCode,
                    country: customerDetails.country
                }
            } : undefined
        });

        console.log('Payment intent created successfully:', paymentIntent.id);

        res.json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            amount: finalAmount,
            originalAmount: amount,
            discount: amount - finalAmount,
            promoCode: appliedPromoCode
        });
    } catch (error) {
        console.error('Payment intent error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error creating payment intent',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Handle successful payment
export const handlePaymentSuccess = async (req, res) => {
    try {
        const { paymentIntentId, orderDetails } = req.body;

        if (!paymentIntentId) {
            return res.status(400).json({
                success: false,
                message: 'Payment intent ID is required'
            });
        }

        // Verify payment intent
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        
        if (paymentIntent.status !== 'succeeded') {
            return res.status(400).json({
                success: false,
                message: 'Payment not successful'
            });
        }

        // Here you would typically:
        // 1. Create an order in your database
        // 2. Clear the user's cart
        // 3. Send confirmation email
        // 4. Update inventory

        res.json({
            success: true,
            message: 'Payment successful',
            orderId: paymentIntentId // You would typically use your own order ID
        });
    } catch (error) {
        console.error('Payment success error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error processing payment success',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}; 