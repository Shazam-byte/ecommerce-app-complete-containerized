import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { api } from "../services/api";
import { Order } from "../types";
import { Check, CreditCard, Home, ShieldCheck, ShoppingCart, Loader2, PartyPopper } from "lucide-react";
import { motion } from "motion/react";

export const CheckoutPage: React.FC = () => {
  const { cartItems, cartTotal, clearCartItems } = useCart();
  const navigate = useNavigate();

  // Checkout Wizard steps (1 = Address, 2 = Review/Simulate, 3 = Confirmation)
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Completed order receipt
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Address fields
  const [fullName, setFullName] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [country, setCountry] = useState("United States");

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!fullName || !addressLine || !city || !zipCode || !country) {
      setErrorMsg("All address parameters must be filled out.");
      return;
    }
    setStep(2);
  };

  const handlePlaceOrder = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    const fullAddressString = `${fullName}, ${addressLine}, ${city}, ${zipCode}, ${country}`;

    try {
      const response = await api.post("/api/orders", {
        shippingAddress: fullAddressString,
      });

      setCompletedOrder(response.order);
      
      // Empty frontend cart locally (matches server state)
      await clearCartItems();

      // Proceed to congratulations step
      setStep(3);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to catalog order checkout.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const taxAmount = cartTotal * 0.08;
  const grandTotal = cartTotal + taxAmount;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      
      {/* Step Stepper Header */}
      <div className="mb-8 flex items-center justify-between border-b border-bento-border/50 pb-5">
        <h1 className="font-sans text-2xl font-black tracking-tight text-bento-text-bright">Checkout</h1>
        
        {/* Step dots list */}
        <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-wider">
          <span className={`px-3 py-1.5 rounded-lg border transition duration-300 ${step >= 1 ? "bg-bento-accent text-bento-bg border-bento-accent font-black shadow-[0_0_12px_rgba(163,230,53,0.35)]" : "bg-bento-bg text-bento-text-muted border-bento-border"}`}>1. Shipping</span>
          <span className="text-bento-border/60">/</span>
          <span className={`px-3 py-1.5 rounded-lg border transition duration-300 ${step >= 2 ? "bg-bento-accent text-bento-bg border-bento-accent font-black shadow-[0_0_12px_rgba(163,230,53,0.35)]" : "bg-bento-bg text-bento-text-muted border-bento-border"}`}>2. Payment</span>
          <span className="text-bento-border/60">/</span>
          <span className={`px-3 py-1.5 rounded-lg border transition duration-300 ${step >= 3 ? "bg-bento-accent text-bento-bg border-bento-accent font-black shadow-[0_0_12px_rgba(163,230,53,0.35)]" : "bg-bento-bg text-bento-text-muted border-bento-border"}`}>3. Success</span>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 rounded-xl bg-red-950/80 p-4 text-xs font-semibold text-red-400 border border-red-800/60">
          {errorMsg}
        </div>
      )}

      {/* STEP 1: Shipping Address Formulation */}
      {step === 1 && (
        <form onSubmit={handleNextStep} className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Address fields column */}
          <div className="md:col-span-2 rounded-[24px] border border-bento-border bg-bento-card p-6 space-y-4">
            <span className="font-sans text-xs font-black tracking-widest text-[#a3e635] uppercase flex items-center border-b border-bento-border/50 pb-3">
              <Home className="mr-2 h-4 w-4 text-bento-accent" />
              Delivery Shipping Destination
            </span>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-bento-text-muted mb-1.5">Recipient Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Jane Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="block w-full rounded-xl border border-bento-border bg-bento-bg p-3 text-xs text-bento-text-bright placeholder-bento-text-muted focus:border-bento-accent focus:outline-none focus:ring-1 focus:ring-bento-accent"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-bento-text-muted mb-1.5">Street Address</label>
                <input
                  type="text"
                  required
                  placeholder="123 Cloud Run Way, Suite 3000"
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  className="block w-full rounded-xl border border-bento-border bg-bento-bg p-3 text-xs text-bento-text-bright placeholder-bento-text-muted focus:border-bento-accent focus:outline-none focus:ring-1 focus:ring-bento-accent"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-bento-text-muted mb-1.5">City / Township</label>
                <input
                  type="text"
                  required
                  placeholder="Seattle"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="block w-full rounded-xl border border-bento-border bg-bento-bg p-3 text-xs text-bento-text-bright placeholder-bento-text-muted focus:border-bento-accent focus:outline-none focus:ring-1 focus:ring-bento-accent"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-bento-text-muted mb-1.5">ZIP / Postal Code</label>
                <input
                  type="text"
                  required
                  placeholder="98101"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  className="block w-full rounded-xl border border-bento-border bg-bento-bg p-3 text-xs text-bento-text-bright placeholder-bento-text-muted focus:border-bento-accent focus:outline-none focus:ring-1 focus:ring-bento-accent"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-bento-text-muted mb-1.5">Country</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="block w-full rounded-xl border border-bento-border bg-bento-bg p-3 text-xs text-bento-text-bright focus:border-bento-accent focus:outline-none focus:ring-1 focus:ring-bento-accent"
                >
                  <option value="United States">United States</option>
                  <option value="Canada">Canada</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Germany">Germany</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="mt-6 flex w-full items-center justify-center rounded-xl bg-bento-accent py-3 text-xs font-bold text-bento-bg hover:bg-bento-accent-hover transition cursor-pointer"
            >
              Continue to Review Order
            </button>
          </div>

          {/* Quick billing total column */}
          <div className="md:col-span-1 border border-bento-border rounded-[24px] p-5 bg-[#0e0e0e]/95 max-h-56 space-y-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-bento-text-muted flex items-center">
              <ShoppingCart className="mr-1.5 h-4 w-4 text-bento-accent" />
              Invoice Summary
            </span>
            <div className="space-y-2 text-xs border-b border-bento-border/40 pb-3 text-bento-text-muted">
              <div className="flex justify-between">
                <span>Cart Subtotal</span>
                <span className="font-mono font-bold text-bento-text-bright">${cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax Estimated</span>
                <span className="font-mono font-bold text-bento-text-bright">${taxAmount.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex justify-between text-xs font-black text-bento-text-bright">
              <span>Invoice Total</span>
              <span className="font-mono text-sm text-[#a3e635]">${grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </form>
      )}

      {/* STEP 2: Review Order & Simulate Payment */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="rounded-[24px] border border-bento-border bg-bento-card p-6 space-y-6">
            
            {/* Delivery address review */}
            <div>
              <span className="block text-[10px] font-black uppercase tracking-widest text-bento-text-muted mb-1">Shipping Address Endpoint</span>
              <p className="text-sm font-bold text-bento-text-bright">
                {fullName}, {addressLine}, {city}, {zipCode}, {country}
              </p>
            </div>

            {/* Simulated Payment Banner */}
            <div className="rounded-xl border border-emerald-800/40 bg-emerald-950/85 p-4 font-sans text-xs text-emerald-400 space-y-2">
              <div className="flex items-center font-black uppercase tracking-widest text-[9px] shadow-xs">
                <ShieldCheck className="mr-1.5 h-4 w-4 text-[#a3e635]" />
                <span>Secure Demo Gateway</span>
              </div>
              <p className="leading-relaxed">
                AWS deployment simulation active. This check-out will bypass credit gateways and flag the order as <b>"PAID"</b> inside PostgreSQL. There are no actual charges incurred.
              </p>
            </div>

            {/* Shopping Basket Items Checklist */}
            <div className="space-y-3">
              <span className="block text-[10px] font-black uppercase tracking-widest text-bento-text-muted">Line Items Review</span>
              <div className="divide-y divide-bento-border/30">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between py-3.5 text-xs">
                    <div>
                      <p className="font-bold text-bento-text-bright">{item.product_name}</p>
                      <span className="text-bento-text-muted">Quantity: {item.quantity}</span>
                    </div>
                    <span className="font-mono font-bold text-bento-text-bright">
                      ${(Number(item.product_price) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sub-total summary block */}
            <div className="border-t border-bento-border/50 pt-4 flex justify-between font-mono text-sm font-black text-bento-text-bright">
              <span>Grand Total</span>
              <span className="text-[#a3e635]">${grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Place controls */}
          <div className="flex gap-4">
            <button
              onClick={() => setStep(1)}
              className="w-1/3 rounded-xl border border-bento-border bg-[#101010] py-3 text-xs font-bold text-bento-text-muted transition hover:bg-[#151515] hover:text-bento-text-bright cursor-pointer"
            >
              Back to Address
            </button>
            <button
              onClick={handlePlaceOrder}
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center space-x-2 rounded-xl bg-bento-accent border border-transparent py-3 text-xs font-black text-bento-bg transition hover:bg-bento-accent-hover disabled:bg-[#151515] disabled:text-bento-text-muted cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-bento-bg" />
                  <span>Processing Payment...</span>
                </>
              ) : (
                <>
                  <CreditCard className="h-4.5 w-4.5" />
                  <span>Simulate Payment & Place Order</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Order Confirmation success landing page */}
      {step === 3 && completedOrder && (
        <div className="rounded-[24px] border border-bento-border bg-bento-card p-8 text-center space-y-6 max-w-xl mx-auto shadow-[0_0_50px_rgba(163,230,53,0.03)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-950/85 text-[#a3e635] border border-emerald-800/40">
            <PartyPopper className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h2 className="font-sans text-3xl font-black tracking-tight text-bento-text-bright">
              Thank you!
            </h2>
            <p className="text-xs text-bento-text-muted">
              Your simulated payment succeeded. The order has been written to AWS Relational Database.
            </p>
          </div>

          {/* Receipt detail parameters */}
          <div className="bg-[#090909] border border-bento-border/50 rounded-2xl p-5 text-xs text-left text-bento-text-muted space-y-3">
            <div className="flex justify-between border-b border-bento-border/30 pb-2">
              <span className="font-bold text-bento-text-muted">Order Reference</span>
              <span className="font-mono font-bold text-bento-text-bright uppercase">{completedOrder.order_number}</span>
            </div>
            <div className="flex justify-between border-b border-bento-border/30 pb-2">
              <span className="font-bold text-bento-text-muted">Payment Status</span>
              <span className="rounded bg-emerald-950/80 px-2 py-0.5 text-[9px] font-black text-emerald-400 border border-emerald-800/60 uppercase tracking-widest">Paid</span>
            </div>
            <div className="flex justify-between border-b border-bento-border/30 pb-2">
              <span className="font-bold text-bento-text-muted">Bill Total</span>
              <span className="font-mono font-bold text-[#a3e635]">${completedOrder.total_amount ? Number(completedOrder.total_amount).toFixed(2) : grandTotal.toFixed(2)}</span>
            </div>
            <div>
              <span className="font-bold text-bento-text-muted block mb-1">Shipping Destination</span>
              <p className="font-medium text-bento-text-bright leading-relaxed">{completedOrder.shipping_address}</p>
            </div>
          </div>

          {/* Navigation link elements */}
          <div className="flex gap-4 pt-3 justify-center text-xs">
            <Link
              to="/"
              className="rounded-xl bg-bento-accent px-5 py-2.5 font-bold text-bento-bg transition hover:bg-bento-accent-hover"
            >
              Continue Shopping
            </Link>
            <Link
              to="/orders"
              className="rounded-xl border border-bento-border bg-[#151515] px-5 py-2.5 font-bold text-bento-text-muted transition hover:bg-[#202020] hover:text-bento-text-bright"
            >
              My Order History
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
