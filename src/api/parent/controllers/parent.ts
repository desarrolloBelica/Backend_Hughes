import { factories } from '@strapi/strapi';
import bcrypt from 'bcryptjs';
import { Context } from 'koa';

const sanitize = (parent: any) => {
  if (!parent) return parent;
  const { password, ...safe } = parent;
  return safe;
};

export default factories.createCoreController('api::parent.parent', ({ strapi }) => ({

  async register(ctx: Context) {
    const { fullName, email, password } = (ctx.request.body as any) || {};
    if (!fullName || !email || !password) return ctx.badRequest('Faltan campos');

    const existing = await strapi.entityService.findMany('api::parent.parent', {
      filters: { email: email.toLowerCase().trim() }, limit: 1,
    });
    if (existing.length) return ctx.conflict('Email ya registrado');

    const parent = await strapi.entityService.create('api::parent.parent', {
      data: { fullName, email, password },
      populate: { students: true },
    });

    const jwt = await strapi.service('plugin::users-permissions.jwt').issue({ id: parent.id, role: 'parent' });
    ctx.body = { jwt, parent: sanitize(parent) };
  },

  async login(ctx: Context) {
    const { email, password } = (ctx.request.body as any) || {};
    if (!email || !password) return ctx.badRequest('Faltan credenciales');

    const [parent] = await strapi.entityService.findMany('api::parent.parent', {
      filters: { email: email.toLowerCase().trim() }, limit: 1,
    });
    if (!parent) return ctx.unauthorized('Credenciales inválidas');

    const ok = await bcrypt.compare(password, parent.password || '');
    if (!ok) return ctx.unauthorized('Credenciales inválidas');

    const jwt = await strapi.service('plugin::users-permissions.jwt').issue({ id: parent.id, role: 'parent' });
    ctx.body = { jwt, parent: sanitize(parent) };
  },

  async me(ctx: Context) {
    const token = (ctx.request.header.authorization || '').replace('Bearer ', '');
    if (!token) return ctx.unauthorized('No autorizado');

    let payload: any;
    try {
      payload = await strapi.service('plugin::users-permissions.jwt').verify(token);
    } catch {
      return ctx.unauthorized('Token inválido');
    }

    const parent = await strapi.entityService.findOne('api::parent.parent', payload.id, {
      populate: { 
        students: {
          populate: ['section', 'art_group'] // Carga las relaciones para los horarios
        } 
      },
    });
    
    if (!parent) return ctx.notFound('No encontrado');

    ctx.body = { parent: sanitize(parent) };
  },

}));
