/**
 * help-center-card controller
 */

import { factories } from '@strapi/strapi'
import { Context } from 'koa';

export default factories.createCoreController('api::help-center-card.help-center-card', ({ strapi }) => ({
  // GET /api/help-center-cards/public - public endpoint for help center cards
  async findPublic(ctx: Context) {
    const { sort, pagination, filters } = ctx.query as any;
    
    const entries = await strapi.entityService.findMany('api::help-center-card.help-center-card', {
      sort: sort || { order: 'asc' },
      pagination: pagination || { pageSize: 100 },
      filters: filters || {},
      publicationState: 'live', // Only published entries
    });

    ctx.body = { data: entries };
  },
}));
