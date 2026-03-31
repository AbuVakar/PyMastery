import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  CreditCard,
  Landmark,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wallet
} from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: number;
  billing: string;
  summary: string;
  features: string[];
  recommended?: boolean;
  discount?: number;
}

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const plans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 499,
    billing: 'month',
    summary: 'A focused plan for learners building momentum.',
    features: ['Core Python tracks', 'Weekly quizzes', 'Progress dashboard', 'Community access']
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 999,
    billing: 'month',
    summary: 'Best for learners preparing for interviews and placements.',
    recommended: true,
    features: ['Everything in Starter', 'AI tutor sessions', 'Mock interviews', 'Project-based learning', 'Priority support']
  },
  {
    id: 'teams',
    name: 'Teams',
    price: 1799,
    billing: 'month',
    summary: 'For serious learners who want mentorship and team features.',
    discount: 15,
    features: ['Everything in Pro', 'Mentor reviews', 'Shared study spaces', 'Team analytics', 'Dedicated support']
  }
];

const paymentMethods: PaymentMethod[] = [
  {
    id: 'card',
    name: 'Credit or Debit Card',
    description: 'Visa, Mastercard, RuPay, and American Express',
    icon: CreditCard
  },
  {
    id: 'upi',
    name: 'UPI',
    description: 'Google Pay, PhonePe, Paytm, and BHIM',
    icon: Smartphone
  },
  {
    id: 'netbanking',
    name: 'Net Banking',
    description: 'Fast checkout with major Indian banks',
    icon: Landmark
  },
  {
    id: 'wallet',
    name: 'Digital Wallet',
    description: 'Paytm Wallet, Amazon Pay, and more',
    icon: Wallet
  }
];

const formatCurrency = (value: number) => `INR ${value.toLocaleString('en-IN')}`;

const PaymentIntegration: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPlanId, setSelectedPlanId] = useState('pro');
  const [selectedMethodId, setSelectedMethodId] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [paymentReference] = useState(() => `PM-${Date.now()}`);
  const paymentTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (paymentTimeoutRef.current !== null) {
        window.clearTimeout(paymentTimeoutRef.current);
      }
    };
  }, []);

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === selectedPlanId) ?? plans[1],
    [selectedPlanId]
  );

  const pricing = useMemo(() => {
    const subtotal = selectedPlan.price;
    const discountAmount = selectedPlan.discount ? Math.round((subtotal * selectedPlan.discount) / 100) : 0;
    const taxableAmount = subtotal - discountAmount;
    const tax = Math.round(taxableAmount * 0.18);
    const total = taxableAmount + tax;

    return {
      subtotal,
      discountAmount,
      tax,
      total
    };
  }, [selectedPlan]);

  const handlePayment = () => {
    if (isProcessing) {
      return;
    }

    setIsProcessing(true);
    paymentTimeoutRef.current = window.setTimeout(() => {
      setIsProcessing(false);
      setShowSuccess(true);
      paymentTimeoutRef.current = null;
    }, 900);
  };

  if (showSuccess) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-100 px-4 py-12 dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-950">
        <div className="w-full max-w-lg rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-2xl dark:border-emerald-900/40 dark:bg-slate-900">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Subscription activated</h1>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            Your {selectedPlan.name} plan is ready. You can head back to the dashboard and continue learning.
          </p>

          <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-left dark:bg-slate-800">
            <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
              <span>Plan</span>
              <span className="font-medium text-slate-900 dark:text-white">{selectedPlan.name}</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
              <span>Total paid</span>
              <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(pricing.total)}</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
              <span>Reference</span>
              <span className="font-mono text-xs text-slate-900 dark:text-white">{paymentReference}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="mt-8 inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-emerald-500"
          >
            Go to dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 via-white to-emerald-50 px-4 py-10 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-10">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                <Sparkles className="mr-2 h-4 w-4" />
                Membership checkout
              </div>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 dark:text-white">Choose a plan that fits how you learn</h1>
              <p className="mt-3 text-lg text-slate-600 dark:text-slate-300">
                Clear pricing, flexible payment options, and a checkout layout that works on desktop and mobile.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300">
              <div className="flex items-center">
                <ShieldCheck className="mr-2 h-4 w-4" />
                Secure checkout with encrypted payment details
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => {
            const isSelected = plan.id === selectedPlanId;

            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlanId(plan.id)}
                className={`rounded-3xl border p-6 text-left transition-all ${
                  isSelected
                    ? 'border-emerald-400 bg-white shadow-xl ring-2 ring-emerald-200 dark:border-emerald-500 dark:bg-slate-900 dark:ring-emerald-900/40'
                    : 'border-slate-200 bg-white hover:border-emerald-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{plan.name}</h2>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{plan.summary}</p>
                  </div>
                  {plan.recommended && (
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                      Recommended
                    </span>
                  )}
                </div>

                <div className="mt-6">
                  <div className="text-3xl font-bold text-slate-900 dark:text-white">{formatCurrency(plan.price)}</div>
                  <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">per {plan.billing}</div>
                  {plan.discount && (
                    <div className="mt-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      Save {plan.discount}% on this plan
                    </div>
                  )}
                </div>

                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start text-sm text-slate-600 dark:text-slate-300">
                      <Check className="mr-3 mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div
                  className={`mt-6 rounded-2xl px-4 py-3 text-center text-sm font-semibold ${
                    isSelected
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                  }`}
                >
                  {isSelected ? 'Selected plan' : 'Select this plan'}
                </div>
              </button>
            );
          })}
        </section>

        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Payment method</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Pick the option that works best for you and complete the mock checkout below.
            </p>

            <div className="mt-6 grid gap-4">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                const isSelected = method.id === selectedMethodId;

                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setSelectedMethodId(method.id)}
                    className={`flex items-start gap-4 rounded-2xl border p-4 text-left transition-colors ${
                      isSelected
                        ? 'border-emerald-400 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-950/30'
                        : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-semibold text-slate-900 dark:text-white">{method.name}</h3>
                        <span
                          className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-500 text-white'
                              : 'border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{method.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm text-slate-600 dark:text-slate-300">
                Card or account name
                <input
                  type="text"
                  placeholder="Enter account holder name"
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </label>
              <label className="block text-sm text-slate-600 dark:text-slate-300">
                Reference
                <input
                  type="text"
                  placeholder={selectedMethodId === 'upi' ? 'yourname@bank' : 'Enter payment details'}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </label>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Order summary</h2>

              <div className="mt-6 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-lg font-semibold text-slate-900 dark:text-white">{selectedPlan.name} membership</div>
                    <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{selectedPlan.summary}</div>
                  </div>
                  <div className="text-right text-lg font-semibold text-slate-900 dark:text-white">{formatCurrency(selectedPlan.price)}</div>
                </div>
              </div>

              <div className="mt-6 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(pricing.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Discount</span>
                  <span>{pricing.discountAmount ? `- ${formatCurrency(pricing.discountAmount)}` : 'INR 0'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>GST</span>
                  <span>{formatCurrency(pricing.tax)}</span>
                </div>
              </div>

              <div className="mt-6 border-t border-slate-200 pt-6 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-slate-900 dark:text-white">Total due today</span>
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(pricing.total)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handlePayment}
                disabled={isProcessing}
                className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isProcessing ? 'Processing payment...' : `Pay ${formatCurrency(pricing.total)}`}
                {!isProcessing && <ArrowRight className="ml-2 h-4 w-4" />}
              </button>

              <div className="mt-4 flex items-center rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <ShieldCheck className="mr-2 h-4 w-4 text-emerald-500" />
                Mock payment form for UI verification. No real transaction is submitted.
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Included with every plan</h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-start">
                  <Check className="mr-3 mt-0.5 h-4 w-4 text-emerald-500" />
                  Responsive dashboard and mobile-friendly learning experience.
                </li>
                <li className="flex items-start">
                  <Check className="mr-3 mt-0.5 h-4 w-4 text-emerald-500" />
                  Flexible billing with simple upgrades later.
                </li>
                <li className="flex items-start">
                  <Check className="mr-3 mt-0.5 h-4 w-4 text-emerald-500" />
                  Progress history, quizzes, coding practice, and guided learning tools.
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PaymentIntegration;
