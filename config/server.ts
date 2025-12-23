module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  app: {
    keys: env.array('APP_KEYS'),
  },
  transfer: {
    remote: {
      enabled: true, 
    },
  },
  url: env('PUBLIC_URL', 'https://hughes-registrator.onrender.com/'), // URL de tu app en Render
  proxy: true,
  cors: {
    origin: [
      'https://hughesinfo.vercel.app/', // Tu dominio de Vercel
      'http://localhost:3000', // Para desarrollo local
    ],
  },
});
