import webpush from 'web-push';
import { getStore } from '@netlify/blobs';

webpush.setVapidDetails(
  'mailto:trozycki@gmail.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Keyed by UTC hour (approximate — assumes Eastern Time, UTC-4/UTC-5 depending on DST)
const MESSAGES = {
  '12': { title: 'Morning Meal', body: 'Eggs/egg whites + oats + berries. Fuel up for the day.' },
  '15': { title: 'Pre-Workout Window', body: 'Protein + rice + vegetables, 60–90 min before training.' },
  '18': { title: 'Post-Workout Window', body: 'Whey isolate or Cocojune + hemp seeds + protein powder.' },
  '22': { title: 'Evening Meal', body: 'Lean protein + vegetables. Keep carbs light tonight.' },
  '01': { title: 'Wind-Down', body: 'Magnesium glycinate before bed. Skip heavy carbs this late.' },
};

export default async () => {
  const store = getStore('push-subscriptions');
  const subscription = await store.get('tom', { type: 'json' });
  if (!subscription) {
    return new Response('no subscription stored yet', { status: 200 });
  }

  const hourUTC = new Date().getUTCHours().toString().padStart(2, '0');
  const msg = MESSAGES[hourUTC];
  if (!msg) {
    return new Response('no reminder scheduled for this hour', { status: 200 });
  }

  try {
    await webpush.sendNotification(subscription, JSON.stringify(msg));
    return new Response('sent: ' + msg.title, { status: 200 });
  } catch (e) {
    console.error('push failed', e);
    return new Response('push failed: ' + String(e), { status: 200 });
  }
};

export const config = {
  schedule: '0 12,15,18,22,1 * * *',
};
