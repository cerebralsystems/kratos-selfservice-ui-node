import { Request, Response } from 'express';
import { authInfo, UserRequest } from '../helpers/authInfo';
import { V0alpha1Api, Configuration, Identity } from '@ory/kratos-client';
import config from '../config';
import services from './../servicelist.json';

const kratos = new V0alpha1Api(new Configuration({ basePath: config.kratos.admin }));

export default async (req: Request, res: Response) => {
  const ai: any = authInfo(req as UserRequest);
  const identity: any = ai.claims.session.identity;

  let page : string = '';
  const context : any = {
    session: ai.claims.session,
    token: ai,
    url: req.hostname
  };
  switch (identity.schema_id) {
    case 'admin':
      page = 'dashboard-admin';
      context.admin = true;
      /// todo: add support for pagination
      const identities: Identity[] = (await kratos.adminListIdentities(100, 0)).data;
      context.tenants = identities
        .filter((tenant : Identity) => tenant.schema_id === 'tenant')
        .map((tenant : Identity) => tenant);
      break;
    case 'tenant':
      page = 'dashboard-tenant';
      context.admin = true;
      context.services = Object.keys(services).map((k : string) => {
        return {
          name: k,
          url: (services as any)[k].url,
          checked: identity.traits.services.find((s: any) => s.name === k) !== undefined
        };
      });
      break;
    default:
      page = 'dashboard-user';
      context.tenant = (await kratos.adminGetIdentity(identity.traits.system.tenants[0])).data;
      context.logo = context.tenant.traits.branding ? context.tenant.id : 'favicon';
      /// todo: this should be populated from backend
      context.services = context.tenant.traits.services.map((s : any) => {
        return { name: s.name, url: (services as any)[s.name].url };
      });
      break;
  }
  res.render(page, context);
};
