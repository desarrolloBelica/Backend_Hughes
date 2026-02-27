// src/index.ts  (Strapi 5.22)
export default {
  async bootstrap({ strapi }) {
    // Actívalo con la variable de entorno SEED_ALL_PERMISSIONS=true
    if (process.env.SEED_ALL_PERMISSIONS !== 'true') return;

    const roleService = strapi.service('plugin::users-permissions.role');

    // UIDs de tus content-types (kebab-case)
    const UIDS = [
      'api::art-group.art-group',
      'api::art-timetable-entry.art-timetable-entry',
      'api::donation.donation',
      'api::event.event',
      'api::event-recap.event-recap',
      'api::grade.grade',
      'api::leave-request.leave-request',
      'api::newspaper.newspaper',
      'api::parent.parent',
      'api::period.period',
      'api::resource.resource',
      'api::seat-reservation.seat-reservation',
      'api::section.section',
      'api::student.student',
      'api::subject.subject',
      'api::teacher.teacher',
      'api::testimonial.testimonial',
      'api::textbook.textbook',
      'api::timetable-entry.timetable-entry',
    ];

    // TODAS las acciones
    const ACTIONS = ['find', 'findOne', 'create', 'update', 'delete'];

    const buildPermissions = () => {
      const p: Record<string, Record<string, boolean>> = {};
      for (const uid of UIDS) {
        p[uid] = Object.fromEntries(ACTIONS.map((a) => [a, true]));
      }
      return p;
    };

    const permissions = buildPermissions();

    // Normalmente: 1 = Public, 2 = Authenticated
    // Si en tu BD no coincide, ajusta los IDs o busca por name via query.
    const publicRole = await roleService.findOne(1);
    const authenticatedRole = await roleService.findOne(2);

    if (publicRole) {
      await roleService.updateRole(publicRole.id, { permissions });
      strapi.log.info('✔ Public: permisos completos establecidos.');
    } else {
      strapi.log.warn('No se encontró el rol Public (id=1).');
    }

    if (authenticatedRole) {
      await roleService.updateRole(authenticatedRole.id, { permissions });
      strapi.log.info('✔ Authenticated: permisos completos establecidos.');
    } else {
      strapi.log.warn('No se encontró el rol Authenticated (id=2).');
    }

    strapi.log.info('✅ Seeding de permisos terminado.');
  },
};