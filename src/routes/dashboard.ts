import { Request, Response } from 'express';
import { authInfo, UserRequest } from '../helpers/authInfo';

export default (req: Request, res: Response) => {
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
      /// todo: this should be populate from backend
      context.services = [
        { name: 'skype', url: 'https://www.skype.com/' },
        { name: 'salesforce', url: 'https://www.salesforce.com' },
        { name: 'atlassian', url: 'https://www.atlassian.com' },
        { name: 'confluence', url: 'https://www.atlassian.com' },
        { name: 'jira', url: 'https://www.atlassian.com' },
        { name: 'microsoft', url: 'https://www.microsoft.com' },
        { name: 'github', url: 'https://www.github.com' },
        { name: 'docker', url: 'https://hub.docker.com' },
        { name: 'dropbox', url: 'https://www.dropbox.com' },
        { name: 'jenkins', url: 'https://www.jenkins.io' },
        { name: 'npm', url: 'https://www.npmjs.com' },
        { name: 'slack', url: 'https://www.slack.com' },
        { name: 'medium', url: 'https://www.medium.com' }
      ];
      context.tenant = { logo: 'https://pidatacenters.com/wp-content/uploads/2017/12/xPi-Logo-180x80.png,qv21.pagespeed.ic.jl8m2P42fh.webp' };
      page = 'dashboard-user';
      break;
  }
  res.render(page, context);
};
