import webpush from 'web-push';
import { getStore } from '@netlify/blobs';

webpush.setVapidDetails(
  'mailto:trozycki@gmail.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Keyed by UTC hour, tuned for a 4:45-5:30am gym/yoga start (Eastern Time, UTC-4/UTC-5 depending on DST)
const MESSAGES = {
  '09': { title: 'Pre-Training Fuel', body: "Gym day: small carb hit — banana or dates. Yoga day: fasted is fine, skip this." },
  '11': { title: 'Biggest Meal of the Day', body: 'Right after training. Eggs + oats + berries, or a shake + eggs.' },
  '14': { title: 'Second Meal', body: 'Protein + rice or quinoa + vegetables.' },
  '17': { title: 'Third Meal', body: 'Lighter — salmon or tuna + salad.' },
  '21': { title: 'Fourth Meal', body: 'Lean protein + vegetables. Keep it light.' },
  '00': { title: 'Wind-Down', body: 'Magnesium glycinate before bed. Done eating for the day.' },
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
  schedule: '0 9,11,14,17,21,0 * * *',
};
