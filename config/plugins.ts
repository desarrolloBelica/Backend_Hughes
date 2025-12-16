// crea/edita este archivo
module.exports = () => ({
  upload: {
    config: {
      provider: 'local',
      // sizeLimit debe estar al nivel de upload.config (no en providerOptions)
      sizeLimit: 25 * 1024 * 1024, // 25 MB por archivo
      providerOptions: {
        // opciones específicas del provider local (vacío por ahora)
      },
      // Desactiva formatos responsivos para aliviar a sharp (puedes reactivar luego)
      breakpoints: {},
    },
  },
});

