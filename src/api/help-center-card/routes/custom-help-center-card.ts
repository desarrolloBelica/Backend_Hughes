export default {
  routes: [
    {
      method: 'GET',
      path: '/help-center-cards/public',
      handler: 'help-center-card.findPublic',
      config: {
        auth: false, // Public endpoint, no authentication required
        policies: [],
      },
    },
  ],
};
