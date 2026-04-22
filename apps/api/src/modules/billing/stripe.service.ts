import { config } from '@/core/config.js';
import Stripe from 'stripe';

export const stripe = new Stripe(config.STRIPE_SECRET_KEY);
