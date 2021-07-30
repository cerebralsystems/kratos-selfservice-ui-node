import { NextFunction, Request, Response } from 'express';
import { authInfo, UserRequest } from '../helpers/authInfo';
import { AdminApi, Configuration, Identity } from '@ory/kratos-client';
import config from '../config';
import * as path from 'path';
var fs = require('fs');
var manifestFilePath = path.join(__dirname, '../../public/manifest.json');

const kratos = new AdminApi(new Configuration({ basePath: config.kratos.admin }));

export default async (req: Request, res: Response) => {
  const tenant : any = (await kratos.getIdentity(req.query.id as string)).data;

  res.set('content-type', 'application/json');
  if (tenant.traits.branding) {
    // do customization of manifest for the tenant
    res.render('manifest', { tenant: tenant, layout: false }, (e, content) => {
      res.send(content);
    });
  } else {
    // stream default Cerebral manifest
    var readable = fs.createReadStream(manifestFilePath);
    readable.pipe(res);
  }
};
