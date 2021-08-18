import { Request, Response } from 'express';
import { V0alpha1Api, Configuration, Identity } from '@ory/kratos-client';
import config from '../config';
import * as path from 'path';
const fsp = require('fs').promises;
const manifestFilePath = path.join(__dirname, '../../public/manifest.json');

const kratos = new V0alpha1Api(new Configuration({ basePath: config.kratos.admin }));

export default async (req: Request, res: Response) => {
  const tenant : any = (await kratos.adminGetIdentity(req.query.id as string)).data;

  res.set('content-type', 'application/json');
  if (tenant.traits.branding) {
    // do customization of manifest for the tenant
    res.render('manifest', { tenant: tenant, layout: false }, (e, content) => {
      res.send(content);
    });
  } else {
    // stream default Cerebral manifest
    var readable = fsp.createReadStream(manifestFilePath);
    readable.pipe(res);
  }
};
