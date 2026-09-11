// TaxBuddy Payment Gateway Checkout & WhatsApp Auth UI Handler
const TaxUI = {
  // Trigger Razorpay Payment Checkout Modal
  triggerRazorpayPayment: async (amount, planType, taxpayerName, onSuccessCallback) => {
    try {
      const orderRes = await TaxAPI.createPaymentOrder(amount, planType, taxpayerName);
      if (orderRes.success) {
        // Open simulated payment modal
        const confirmPayment = confirm(`💳 Razorpay Checkout\n\nPlan: ${planType}\nAmount: ₹${amount}\n\nClick OK to simulate successful card/UPI payment.`);
        if (confirmPayment) {
          const verifyRes = await TaxAPI.verifyPaymentSignature({
            orderId: orderRes.orderId,
            paymentId: `pay_${Date.now()}_razor`,
            amount,
            planType,
            taxpayerName
          });
          if (verifyRes.success) {
            alert(verifyRes.message);
            if (onSuccessCallback) onSuccessCallback(verifyRes.data);
          }
        }
      }
    } catch (err) {
      alert("Payment checkout failed. Please retry.");
    }
  },

  // Trigger WhatsApp Login Modal
  triggerWhatsAppLogin: async () => {
    const mobile = prompt("📱 Enter Mobile Number for WhatsApp Login OTP:", "+91 98765 43210");
    if (mobile) {
      const res = await TaxAPI.sendWhatsAppOTP(mobile);
      if (res.success) {
        const otp = prompt(`📲 ${res.message}\n\nEnter 6-digit WhatsApp OTP:`, "123456");
        if (otp) {
          const verifyRes = await TaxAPI.verifyWhatsAppOTP(mobile, otp);
          if (verifyRes.success) {
            alert(`✅ Welcome back, ${verifyRes.user.name}! Authenticated via WhatsApp.`);
            window.location.href = 'dashboard.html';
          } else {
            alert(verifyRes.message);
          }
        }
      }
    }
  }
};
