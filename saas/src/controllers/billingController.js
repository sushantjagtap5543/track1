import prisma from '../utils/prisma.js';


const razorpay = (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) 
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    })
  : null;

const DEFAULT_PRICES = {
  MONTHLY: 200,
  HALFYEARLY: 1000,
  YEARLY: 2000
};

// Create a new order for a SPECIFIC VEHICLE
export const createOrder = async (req, res) => {
  const { planId, vehicleId } = req.body;

  try {
    if (!razorpay) {
      return res.status(503).json({ error: 'Payment gateway not configured.' });
    }

    // Check vehicle ownership
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, userId: req.user.userId, deletedAt: null }
    });

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found or unauthorized' });
    }

    // Fetch pricing from server attributes or defaults
    const server = await traccar.getServer();
    const basePrice = server.attributes[`billingPrice${planId}`] || DEFAULT_PRICES[planId] || 0;
    
    if (basePrice === 0) {
      return res.status(400).json({ error: 'Invalid plan selected.' });
    }

    const options = {
      amount: basePrice * 100, // INR paise
      currency: "INR",
      receipt: `receipt_${vehicle.imei}_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);

    // Track payment intent linked to vehicle
    await prisma.payment.create({
      data: {
        userId: req.user.userId,
        amount: basePrice,
        status: 'PENDING',
        transactionId: order.id
      }
    });

    res.json({ ...order, vehicleId, planId });
  } catch (error) {
    console.error('Order creation failed:', error);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
};

// Verify payment and update DEVICE billing
export const verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId, vehicleId } = req.body;

  try {
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      await prisma.payment.updateMany({
        where: { transactionId: razorpay_order_id },
        data: { status: 'FAILED' }
      });
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // 1. Update status
    await prisma.payment.updateMany({
      where: { transactionId: razorpay_order_id },
      data: { status: 'SUCCESS', paymentMethod: 'RAZORPAY' }
    });

    // 2. Fetch vehicle and calculate Dates
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) throw new Error('Vehicle not found after payment');

    const startDate = new Date();
    let nextDate = vehicle.nextBillingDate ? new Date(vehicle.nextBillingDate) : new Date();
    
    // If renewing early, add to current expiry; if expired, start from now
    if (nextDate < new Date()) nextDate = new Date();

    if (planId === 'MONTHLY') nextDate.setMonth(nextDate.getMonth() + 1);
    else if (planId === 'HALFYEARLY') nextDate.setMonth(nextDate.getMonth() + 6);
    else if (planId === 'YEARLY') nextDate.setFullYear(nextDate.getFullYear() + 1);

    // 3. Update Vehicle Master
    const updatedVehicle = await prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        subscriptionPlan: planId,
        subscriptionStart: vehicle.subscriptionStart || startDate,
        nextBillingDate: nextDate,
        paymentStatus: 'PAID',
        lastPaymentDate: new Date(),
        transactionId: razorpay_payment_id,
        billingCycleCount: { increment: 1 },
        planAmount: DEFAULT_PRICES[planId] || 0
      }
    });

    // 4. SYNC TO GOOGLE SHEETS (REAL-TIME)
    await googleSheetService.syncDevice(vehicleId);

    await logAudit({ 
      userId: req.user.userId, 
      action: 'DEVICE_PAYMENT_SUCCESS', 
      resource: 'Vehicle', 
      payload: { vehicleId, planId, nextBillingDate: nextDate }
    });

    res.json({ message: 'Device plan updated and synced successfully', success: true });
  } catch (error) {
    console.error('Verification failed:', error);
    res.status(500).json({ error: 'Verification error' });
  }
};

export const getSubscription = async (req, res) => {
  // Now we need per-device subscriptions
  const vehicles = await prisma.vehicle.findMany({
    where: { userId: req.user.userId, deletedAt: null }
  });
  res.json(vehicles.map(v => ({
    deviceId: v.id,
    imei: v.imei,
    plan: v.subscriptionPlan,
    expiresAt: v.nextBillingDate,
    status: v.paymentStatus
  })));
};

export const getPayments = async (req, res) => {
  const payments = await prisma.payment.findMany({
    where: { userId: req.user.userId },
    orderBy: { createdAt: 'desc' }
  });
  res.json(payments);
};
