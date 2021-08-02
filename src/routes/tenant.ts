import { Request, Response } from 'express';
import { Identity, AdminApi, Configuration, UpdateIdentity } from '@ory/kratos-client';
import { authInfo, UserRequest } from '../helpers/authInfo';
import * as path from 'path';
import services from './../servicelist.json';
import config from '../config';

const fsp = require('fs').promises;
const pacPath = path.join(__dirname, '../../public/pac/');
const kratos = new AdminApi(new Configuration({ basePath: config.kratos.admin }));

/* Generates a new pac file with passed neuron */
export const generatePacFile = async (req: Request, identity: any) : Promise<string[]> => {
  // Generate new PAC file here
  const tenant : any = (await kratos.getIdentity(identity.traits.system.tenants[0])).data;
  var templatePacFile = path.join(pacPath, tenant.id + '.pac');

  try {
    await fsp.stat(templatePacFile);
  } catch (err) {
    templatePacFile = path.join(__dirname, '../views/cerebral.pac.hbs');
  }

  const svcs: string[] = [];
  for (const s of tenant.traits.services) {
    const custom : boolean = s.name === 'custom';
    for (const supported of s.supported) {
      const url = custom ? supported : (services as any)[s.name].sites[supported];
      if (!svcs.includes(url)) { svcs.push(url); }
    }
  }

  req.app.render(templatePacFile, { tenant: tenant, neuron: identity.traits.system.neuron, services: svcs, layout: false }, (e, content) => {
    console.log('Writing user pac file');
    fsp.writeFile(path.join(pacPath, identity.id + '.pac'), content);
  });
  return svcs;
};

export const updateServices = async (req: Request, res: Response) => {
  const ai = authInfo(req as UserRequest);
  const tenant: any = ai.claims.session.identity;
  const traits: any = tenant.traits;
  traits.services = req.body.services;
  const updateIdentity: UpdateIdentity = { traits };
  const updateIdentityResponse = await kratos.updateIdentity(ai.claims.session.identity.id, updateIdentity);

  let index = 0;
  while (true) {
    const identities: Identity[] = (await kratos.listIdentities(100, index++)).data;
    if (identities.length === 0) { break; }
    identities.forEach(identity => {
      const traits: any = identity.traits;
      if (identity.schema_id === 'default' && traits.system.neuron) { updateUserData(req, identity); }
    });
  }

  res.sendStatus(200);
};

export const updateUserData = async (req: Request, identity:Identity) => {
  const svcs: string[] = await generatePacFile(req, identity);
  const traits: any = identity.traits;
  const updateIdentity: UpdateIdentity = { traits };
  const updateIdentityResponse = await kratos.updateIdentity(identity.id, updateIdentity);
  identity = updateIdentityResponse.data;

  // Call flow manager with the user id with first mile ip here

  const res: JSON = await (await fetch(process.env.FLOW_MANAGER_URL! + 'flows', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ id: identity.id, firstMile: traits.system.neuron.ip, services: svcs })
  }))
    .json();
};
