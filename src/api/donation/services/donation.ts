/**
 * donation service
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::donation.donation', ({ strapi }) => ({
  async find(params: any) {
    // Obtener resultados usando el método padre
    const { results, pagination } = await super.find(params);
    
    // Transformar pagination para asegurar que todos los valores son números
    const safePagination = {
      page: typeof pagination.page === 'object' ? Number(pagination.page.count || pagination.page) : Number(pagination.page),
      pageSize: typeof pagination.pageSize === 'object' ? Number(pagination.pageSize.count || pagination.pageSize) : Number(pagination.pageSize),
      pageCount: typeof pagination.pageCount === 'object' ? Number(pagination.pageCount.count || pagination.pageCount) : Number(pagination.pageCount),
      total: typeof pagination.total === 'object' && pagination.total !== null ? Number(pagination.total.count || 0) : Number(pagination.total || 0)
    };
    
    // Transformar los resultados para asegurar serialización correcta
    const transformedResults = results.map((item: any) => {
      const transformed = { ...item };
      
      // Asegurar que amount es un número
      if (typeof transformed.amount === 'object') {
        transformed.amount = Number(transformed.amount.count || transformed.amount);
      }
      
      // Si hay campos que son objetos con count, convertirlos
      Object.keys(transformed).forEach(key => {
        if (transformed[key] && typeof transformed[key] === 'object' && 'count' in transformed[key]) {
          transformed[key] = Number(transformed[key].count);
        }
      });
      
      return transformed;
    });
    
    return {
      results: transformedResults,
      pagination: safePagination
    };
  }
}));
