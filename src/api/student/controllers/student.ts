import { factories } from '@strapi/strapi';
import bcrypt from 'bcryptjs';
import { Context } from 'koa';

const sanitize = (u: any) => {
  if (!u) return u;
  const { password, ...safe } = u;
  return safe;
};

export default factories.createCoreController('api::student.student', ({ strapi }) => ({

  // POST /api/students/register
  async register(ctx: Context) {
    const { firstName, lastName, email, password, section } = (ctx.request.body as any) || {};
    if (!firstName || !lastName || !email || !password) {
      return ctx.badRequest('Faltan campos: firstName, lastName, email, password');
    }

    const existing = await strapi.entityService.findMany('api::student.student', {
      filters: { email: String(email).toLowerCase().trim() },
      limit: 1,
    });
    if (existing.length) return ctx.conflict('Email ya registrado');

    const student = await strapi.entityService.create('api::student.student', {
      data: {
        firstName, lastName,
        email: String(email).toLowerCase().trim(),
        password,
        ...(section ? { section } : {}), // respeta tu relación si te llega
      },
    });

    const jwt = await strapi.service('plugin::users-permissions.jwt').issue({ id: student.id, role: 'student' });
    ctx.body = { jwt, student: sanitize(student) };
  },

  // POST /api/students/login
  async login(ctx: Context) {
    const { email, password } = (ctx.request.body as any) || {};
    if (!email || !password) return ctx.badRequest('Faltan credenciales');

    const [student] = await strapi.entityService.findMany('api::student.student', {
      filters: { email: String(email).toLowerCase().trim() },
      limit: 1,
    });
    if (!student) return ctx.unauthorized('Credenciales inválidas');

    const ok = await bcrypt.compare(password, student.password || '');
    if (!ok) return ctx.unauthorized('Credenciales inválidas');

    const jwt = await strapi.service('plugin::users-permissions.jwt').issue({ id: student.id, role: 'student' });
    ctx.body = { jwt, student: sanitize(student) };
  },

  // GET /api/students/me
  async me(ctx: Context) {
    const token = (ctx.request.header.authorization || '').replace('Bearer ', '');
    if (!token) return ctx.unauthorized('No autorizado');

    let payload: any;
    try {
      payload = await strapi.service('plugin::users-permissions.jwt').verify(token);
    } catch {
      return ctx.unauthorized('Token inválido');
    }

    // Parse populate from query params (e.g., ?populate=section,art_group,grade)
    const populateParam = ctx.query.populate;
    let populateObj: Record<string, boolean> = { section: true, parents: true };
    
    if (populateParam) {
      const fields = Array.isArray(populateParam) 
        ? populateParam.flatMap(p => String(p).split(','))
        : String(populateParam).split(',');
      
      populateObj = {};
      for (const field of fields) {
        const trimmed = field.trim();
        if (trimmed) {
          populateObj[trimmed] = true;
        }
      }
    }

    const student = await strapi.entityService.findOne('api::student.student', payload.id, {
      populate: populateObj,
    });
    if (!student) return ctx.notFound('No encontrado');

    ctx.body = { student: sanitize(student) };
  },

}));
