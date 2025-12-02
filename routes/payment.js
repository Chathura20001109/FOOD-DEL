router.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency, customerDetails } = req.body;
    console.log('Creating payment intent with data:', { amount, currency, customerDetails });

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    // Add retry logic for Stripe connection
    let retries = 3;
    let lastError = null;

    while (retries > 0) {
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents
          currency: currency || 'usd',
          customer: customerDetails.email,
          metadata: {
            firstName: customerDetails.firstName,
            lastName: customerDetails.lastName,
            email: customerDetails.email,
            phone: customerDetails.phone
          }
        });

        console.log('Payment intent created successfully:', paymentIntent.id);
        return res.json({ clientSecret: paymentIntent.client_secret });
      } catch (error) {
        lastError = error;
        console.error(`Payment intent error (attempt ${4 - retries}/3):`, error);
        
        if (error.type === 'StripeConnectionError') {
          retries--;
          if (retries > 0) {
            // Wait for 1 second before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
        }
        
        // If it's not a connection error or we're out of retries, throw the error
        throw error;
      }
    }

    // If we get here, all retries failed
    throw lastError;
  } catch (error) {
    console.error('Payment intent error:', error);
    res.status(500).json({ 
      message: 'Failed to create payment intent',
      error: error.message,
      type: error.type
    });
  }
}); 