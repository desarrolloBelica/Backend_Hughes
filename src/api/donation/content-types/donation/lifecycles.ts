export default {
  // Asegurar que los datos estén correctamente formateados
  beforeCreate(event) {
    const { data } = event.params;
    
    // Convertir donator a ID si es un objeto
    if (data.donator && typeof data.donator === 'object' && data.donator.id) {
      data.donator = data.donator.id;
    }
  },
  
  beforeUpdate(event) {
    const { data } = event.params;
    
    // Convertir donator a ID si es un objeto
    if (data.donator && typeof data.donator === 'object' && data.donator.id) {
      data.donator = data.donator.id;
    }
  }
};
