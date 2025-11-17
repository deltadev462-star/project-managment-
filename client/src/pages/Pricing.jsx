import React, { useEffect, useState } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const Pricing = () => {
  const { getToken } = useAuth();
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingPlanId, setProcessingPlanId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPricingData();
  }, []);

  const fetchPricingData = async () => {
    try {
      setError(null);
      const token = await getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      // Fetch pricing plans
      console.log('Fetching pricing plans from:', `${import.meta.env.VITE_BASEURL}/api/pricing/plans`);
      const plansResponse = await axios.get(
        `${import.meta.env.VITE_BASEURL}/api/pricing/plans`
      );
      console.log('Plans response:', plansResponse.data);
      // Ensure we have an array of plans
      setPlans(Array.isArray(plansResponse.data) ? plansResponse.data : []);

      // Fetch user's current subscription (only if user is authenticated)
      if (token) {
        try {
          const subResponse = await axios.get(
            `${import.meta.env.VITE_BASEURL}/api/pricing/subscription`,
            { headers }
          );
          setCurrentSubscription(subResponse.data);
        } catch (error) {
          // User might not have a subscription
          console.log('No subscription found');
        }
      }
    } catch (error) {
      console.error('Error fetching pricing data:', error);
      setError('Failed to load pricing plans. Please try again later.');
      toast.error('Failed to load pricing plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId) => {
    try {
      setProcessingPlanId(planId);
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };
      
      const response = await axios.post(
        `${import.meta.env.VITE_BASEURL}/api/pricing/checkout`,
        {
          planId,
          successUrl: `${window.location.origin}/dashboard?success=true`,
          cancelUrl: `${window.location.origin}/pricing?cancelled=true`
        },
        { headers }
      );
      
      if (response.data.checkoutUrl) {
        window.location.href = response.data.checkoutUrl;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error(error.response?.data?.error || 'Failed to start checkout');
      setProcessingPlanId(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
      return;
    }

    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };
      
      await axios.post(
        `${import.meta.env.VITE_BASEURL}/api/pricing/cancel`,
        {},
        { headers }
      );
      
      toast.success('Subscription cancelled successfully');
      fetchPricingData();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('Failed to cancel subscription');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-600 dark:text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => {
              setLoading(true);
              fetchPricingData();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-zinc-100 sm:text-4xl">
            Scale your projects with confidence
          </h2>
          <p className="mt-4 text-xl text-gray-600 dark:text-zinc-400">
            Choose the plan that's right for your team
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="mt-12 grid gap-8 lg:grid-cols-3 lg:gap-x-8">
          {plans.length === 0 ? (
            <div className="col-span-3 text-center py-8">
              <p className="text-gray-600 dark:text-zinc-400">Loading pricing plans...</p>
            </div>
          ) : (
            plans.map((plan) => {
            const isCurrentPlan = currentSubscription?.plan?.type === plan.type;
            const features = JSON.parse(plan.features || '[]');
            
            return (
              <div
                key={plan.id}
                className={`relative bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg shadow-lg overflow-hidden flex flex-col ${
                  isCurrentPlan ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''
                }`}
              >
                {isCurrentPlan && (
                  <div className="absolute top-0 right-0 bg-blue-500 dark:bg-blue-600 text-white px-3 py-1 text-sm rounded-bl-lg">
                    Current Plan
                  </div>
                )}
                
                <div className="px-6 py-8 flex-1 flex flex-col">
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold text-gray-900 dark:text-zinc-100">
                      {plan.name}
                    </h3>
                    <p className="mt-4 text-gray-600 dark:text-zinc-400">{plan.description}</p>
                    
                    <div className="mt-6">
                      <p className="text-4xl font-extrabold text-gray-900 dark:text-zinc-100">
                        ${plan.price}
                        {plan.interval && (
                          <span className="text-base font-normal text-gray-600 dark:text-zinc-400">
                            /{plan.interval}
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Features */}
                    <ul className="mt-8 space-y-4">
                      {features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="h-5 w-5 text-green-500 dark:text-green-400 flex-shrink-0" />
                          <span className="ml-3 text-gray-700 dark:text-zinc-300">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Limits */}
                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-zinc-700">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 mb-3">
                        Plan Limits
                      </h4>
                      <ul className="space-y-2 text-sm text-gray-600 dark:text-zinc-400">
                        <li>
                          {plan.maxProjects === 999999 ? 'Unlimited' : plan.maxProjects} Projects
                        </li>
                        <li>
                          {plan.maxWorkspaces === 999999 ? 'Unlimited' : plan.maxWorkspaces} Workspaces
                        </li>
                        <li>
                          {plan.maxTeamMembers === 999999 ? 'Unlimited' : plan.maxTeamMembers} Team Members
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Action Button - Moved to bottom */}
                  <div className="mt-8">
                    {plan.type === 'FREE' ? (
                      <button
                        disabled
                        className="w-full py-3 px-4 bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-500 rounded-lg cursor-not-allowed"
                      >
                        {isCurrentPlan ? 'Current Plan' : 'Free Plan'}
                      </button>
                    ) : isCurrentPlan ? (
                      <button
                        onClick={handleCancelSubscription}
                        className="w-full py-3 px-4 bg-red-600 dark:bg-red-500 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition"
                      >
                        Cancel Subscription
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSubscribe(plan.id)}
                        disabled={processingPlanId === plan.id || currentSubscription}
                        className={`w-full py-3 px-4 rounded-lg transition ${
                          processingPlanId === plan.id || currentSubscription
                            ? 'bg-gray-300 dark:bg-zinc-700 text-gray-500 dark:text-zinc-500 cursor-not-allowed'
                            : 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600'
                        }`}
                      >
                        {processingPlanId === plan.id ? (
                          <span className="flex items-center justify-center">
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </span>
                        ) : currentSubscription ? (
                          'Cancel current plan first'
                        ) : (
                          'Subscribe'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
          )}
        </div>

        {/* FAQ or additional info */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 dark:text-zinc-400">
            All plans include 14-day free trial. No credit card required.
          </p>
          <p className="mt-2 text-gray-600 dark:text-zinc-400">
            Need help choosing? <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">Contact our sales team</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Pricing;