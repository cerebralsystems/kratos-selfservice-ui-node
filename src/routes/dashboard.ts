import { Request, Response } from 'express';
import { authInfo, UserRequest } from '../helpers/authInfo';
import { AdminApi, Configuration, Identity } from '@ory/kratos-client';
import config from '../config';
import services from './../servicelist.json';

const kratos = new AdminApi(new Configuration({ basePath: config.kratos.admin }));

export default async (req: Request, res: Response) => {
  const ai: any = authInfo(req as UserRequest);

  let page : string = '';
  const context : any = {
    session: ai.claims.session,
    url: req.hostname
  };
  switch (ai.claims.session.identity.schema_id) {
    case 'admin':
      page = 'dashboard-admin';
      break;
    case 'tenant':
      page = 'dashboard-tenant';
      break;
    default:
      context.tenant = (await kratos.getIdentity(ai.claims.session.identity.traits.system.tenants[0])).data;
      context.logo = context.tenant.traits.branding ? context.tenant.id : 'favicon';
      /// todo: this should be populate from backend
      context.services = services.filter(entry => context.tenant.traits.services.includes(entry.name) ||
        context.tenant.traits.services.includes(entry.url));
      page = 'dashboard-user';
      break;
  }
  res.render(page, context);
};
