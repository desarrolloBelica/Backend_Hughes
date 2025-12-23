/**
 * custom donation routes
 */

export default {
  routes: [
    {
      method: 'POST',
      path: '/donations/checkout',
      handler: 'donation.createCheckoutSession',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/donations/confirm',
      handler: 'donation.confirm',
      config: {
        auth: false,
      },
    },
  ],
}
