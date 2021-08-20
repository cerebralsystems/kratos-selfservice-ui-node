import { Request, Response } from 'express';
import fetch from 'node-fetch';
import { Identity, V0alpha1Api, Configuration, AdminUpdateIdentityBody, IdentityState } from '@ory/kratos-client';
import { authInfo, UserRequest } from '../helpers/authInfo';
import * as path from 'path';
import services from './../servicelist.json';
import config from '../config';
import neurons from './../neuronlist.json';

const fsp = require('fs').promises;
const pacPath: string = path.join(process.env.PERSIST_FILES_PATH as string, 'pac');
const kratos = new V0alpha1Api(new Configuration({ basePath: config.kratos.admin }));

// generates a new pac file with passed for the latest details
export const generatePacFile = async (req: Request, user: Identity) : Promise<string[]> => {
  const traits: any = user.traits;
  const tenant: any = (await kratos.adminGetIdentity(traits.system.tenants[0])).data;

  // if the tenant has a pac file defined, use it
  var templatePacFile = path.join(pacPath, tenant.id + '.pac');

  try {
    await fsp.stat(templatePacFile);
  } catch (err) {
    // tenant has no pac file - fallback to cerebral default pac template
    templatePacFile = 'cerebral.pac.hbs';
    console.log('Tenant has no pac template');
  }

  // build a list of services enabled by tenant
  const svcs: string[] = [];
  for (const s of tenant.traits.services) {
    const custom : boolean = s.name === 'custom';
    for (const supported of s.supported) {
      const urls: string[] = custom ? supported : (services as any)[s.name].sites[supported];

      for (const url of urls) {
        // no duplicates please
        if (!svcs.includes(url)) { svcs.push(url); }
      }
    }
  }

  // render the pac file and save it using the template
  req.app.render(templatePacFile, { tenant: tenant, neuron: traits.system.neuron, services: svcs, layout: false }, (e, content) => {
    console.log('Writing user pac file');
    try {
      fsp.writeFile(path.join(pacPath, user.id + '.pac'), content);
    } catch (err) {
      console.error('Failed to write pac file');
    }
  });
  return svcs;
};

// update service list at the tenant level
export const updateServices = async (req: Request, res: Response) => {
  const ai = authInfo(req as UserRequest);
  const tenant: Identity = ai.claims.session.identity;

  // bailout if not logged in as a tenant
  if (tenant.schema_id !== 'tenant') { return; }

  const traits: any = tenant.traits;
  traits.services = req.body.services;
  const updateIdentity: AdminUpdateIdentityBody = { schema_id: tenant.schema_id, traits: traits, state: IdentityState.Active };
  const updateIdentityResponse = await kratos.adminUpdateIdentity(ai.claims.session.identity.id, updateIdentity);

  /// todo: find a better way to retrieve and update only relavant users
  /// as the number of users and tenant scale, this needs to move to a offline task (workflow systems or kafka)
  console.log('Updating all tenant identities');
  let index = 0;
  const pageSize: number = 100;
  while (true) {
    const identities: Identity[] = (await kratos.adminListIdentities(pageSize, index++)).data;
    identities.forEach(identity => {
      const traits: any = identity.traits;
      if (identity.schema_id === 'default' &&
        traits.system.neuron &&
        traits.system.tenants.includes(tenant.id) // if the user belongs to this tenant
      ) { updateUserData(req, tenant.id, identity); }
    });
    if (identities.length < pageSize) { break; }
  }

  res.sendStatus(200);
};

// re-generates all user related artifacts such as pac files, flows, etc.
export const updateUserData = async (req: Request, tenantId: string, user: Identity) => {
  const svcs: string[] = await generatePacFile(req, user);
  const traits: any = user.traits;
  const updateIdentity: AdminUpdateIdentityBody = { traits: traits, state: user.state ?? IdentityState.Active };

  try {
    console.log('Updating identity');
    const updateIdentityResponse = await kratos.adminUpdateIdentity(user.id, updateIdentity);
    user = updateIdentityResponse.data;
    console.log('Updated identity');
  } catch (err) {
    console.error('Failed to update identity: ' + err);
  }

  try {
  // Call flow manager with the user id, first mile, sourceIp, hostnames and service list
    console.log('Updating flow manager');
    const res: JSON = await (await fetch(process.env.FLOW_MANAGER_URL! + 'flows', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: user.id,
        tenantId: tenantId,
        sourceIp: traits.system.ip4,
        firstMiles: neurons.find(n => n.name === traits.system.neuron)?.hostNames,
        services: svcs
      })
    }))
      .json();
    console.log('Updated flow manager.');
  } catch (err) {
    console.warn('Failed to update flow manager.');
  }
};
