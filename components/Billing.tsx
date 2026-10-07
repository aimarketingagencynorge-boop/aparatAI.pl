
import React from 'react';
import { Check, Zap, Crown, Shield, Star, Sparkles } from 'lucide-react';
import { UserAccount, UserPlan } from '../types';

interface BillingProps {
  user: UserAccount;
  onUpgrade: (plan: UserPlan, credits: number) => Promise<void>;
  t: any;
}

const Billing: React.FC<BillingProps> = ({ user, onUpgrade, t }) => {
  const plans = [
    {
      id: 'starter' as UserPlan,
      name: t.billing.starter,
      price: '99 PLN',
      credits: 100,
      features: ['100 HD Shots', 'Standard Scenography', 'Social Media Export', 'Email Support'],
      icon: Star,
      color: 'text-amber-500',
    },
    {
      id: 'pro' as UserPlan,
      name: t.billing.pro,
      price: '299 PLN',
      credits: 500,
      popular: true,
      features: ['500 4K Renders', 'Full Brand Kit Access', 'Neural Lighting Pro', 'No Watermark', 'Priority Queue'],
      icon: Crown,
      color: 'text-blue-500',
    },
    {
      id: 'enterprise' as UserPlan,
      name: t.billing.enterprise,
      price: '999 PLN',
      credits: 2000,
      features: ['2000 Renders / mo', 'Full API Access', 'Custom Brand Models', 'Dedicated Studio Manager', 'White-labeling'],
      icon: Shield,
      color: 'text-purple-500',
    }
  ];

  const handlePurchase = async (plan: UserPlan, credits: number) => {
    // Mock Stripe flow
    const confirm = window.confirm(`Confirm purchase of ${plan.toUpperCase()} for ${credits} credits?`);
    if (confirm) {
      await onUpgrade(plan, credits);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-12 bg-zinc-950">
      <div className="max-w-6xl mx-auto space-y-12 pb-20">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900 rounded-full border border-zinc-800 mb-2">
            <Sparkles className="w-3 h-3 text-blue-500" />
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Current Plan: {user.plan.toUpperCase()}</span>
          </div>
          <h2 className="text-4xl font-bold text-zinc-100 tracking-tight italic uppercase leading-none">{t.billing.title}</h2>
          <p className="text-zinc-500 max-w-xl mx-auto font-medium text-sm">{t.billing.desc}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, i) => (
            <div key={i} className={`relative p-8 rounded-[2.5rem] border transition-all flex flex-col ${plan.popular ? 'bg-zinc-900 border-blue-500/50 scale-105 z-10 shadow-2xl shadow-blue-500/10' : 'bg-zinc-900/50 border-zinc-800'}`}>
              {plan.popular && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[9px] font-black uppercase px-4 py-1.5 rounded-full tracking-widest shadow-xl">MOST POPULAR</div>}
              
              <div className="flex items-center gap-3 mb-6">
                <plan.icon className={`w-6 h-6 ${plan.color}`} />
                <h3 className="text-xl font-bold uppercase italic tracking-tighter">{plan.name}</h3>
              </div>
              <div className="mb-8 flex flex-col">
                <span className="text-4xl font-black text-zinc-100 italic">{plan.price}</span>
                <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-1">/ {plan.credits} master shots</span>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                {plan.features.map((feat, j) => (
                  <li key={j} className="flex items-start gap-3 text-[10px] text-zinc-400 font-bold uppercase tracking-tight">
                    <Check className="w-4 h-4 text-green-500 mt-0.5" />
                    {feat}
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => handlePurchase(plan.id, plan.credits)}
                disabled={user.plan === plan.id}
                className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${user.plan === plan.id ? 'bg-zinc-800 text-zinc-600 cursor-default' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-500/20 active:scale-95'}`}
              >
                {user.plan === plan.id ? 'CURRENT PLAN' : t.billing.choosePlan}
              </button>
            </div>
          ))}
        </div>

        {/* TOP UP PACK */}
        <div className="p-10 rounded-[3rem] bg-zinc-900/50 border border-zinc-900 flex flex-col md:flex-row items-center justify-between gap-8 transition-colors hover:border-zinc-800">
           <div className="flex items-center gap-8">
              <div className="w-16 h-16 rounded-[1.5rem] bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                 <Zap className="w-8 h-8 text-blue-500" />
              </div>
              <div className="space-y-1">
                <h4 className="text-2xl font-black uppercase italic tracking-tighter">{t.billing.extraPack}</h4>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Instant boost of +20 High-Res Renders.</p>
              </div>
           </div>
           <div className="flex items-center gap-6">
              <span className="text-2xl font-black italic text-zinc-300">49 PLN</span>
              <button 
                onClick={() => handlePurchase(user.plan, 20)}
                className="px-12 py-4 rounded-2xl bg-zinc-100 hover:bg-white text-zinc-950 font-black text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95"
              >
                {t.billing.buyPack}
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Billing;
