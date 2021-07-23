import { Request, Response } from 'express';
import { authInfo, UserRequest } from '../helpers/authInfo';

export default (req: Request, res: Response) => {
  const ai: any = authInfo(req as UserRequest);

  let page = '';
  switch (ai.claims.session.identity.schema_id) {
    case 'admin':
      page = 'dashboard-admin';
      break;
    case 'tenant':
      page = 'dashboard-tenant';
      break;
    default:
      page = 'dashboard-user';
      break;
  }
  res.render(page, {
    session: ai.claims.session,
    url: req.hostname
  });
};
