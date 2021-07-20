import { Request, Response } from 'express';
import { AdminApi, Configuration, UpdateIdentity } from '@ory/kratos-client';
import fetch from 'node-fetch';
import config from '../config';
import { authInfo, UserRequest } from '../helpers/authInfo';

const kratos = new AdminApi(new Configuration({ basePath: config.kratos.admin }));
const ValidateIPaddress = (ipAddress: string) => ipAddress.match(/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/);

export default async (req: Request, res: Response) => {
  const ai = authInfo(req as UserRequest);

  let ip: string | undefined = req.connection.remoteAddress?.split(':').slice(-1)[0];
  if (ip !== undefined && ai.claims.session.identity.schema_id === 'default') {
    if (Array.isArray(ip)) {
      ip = ip[0] as string;
    }

    if (ValidateIPaddress(ip)) {
      updateLocationByIP(req.body.location.coords, ip, ai);
    } else {
      throw new Error('IP Address could not be parsed');
    }
  }

  res.sendStatus(200);
};

const getNearestNeuron = async (data: any) => {
  const neuron: any = await (await fetch(process.env.FIRST_MILE_LOC_URL!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  }))
    .json();

  return neuron;
};

const updateLocationByIP = async (coords: any, ip4: string, ai: { claims: any, raw: any }) => {
  const traits: any = ai.claims.session.identity.traits;
  const { latitude: lat, longitude: lng } = coords;

  if (ip4 !== traits.system.ip4) {
    try {
      traits.system.ip4 = ip4;
      const { latitude: lat, longitude: lng } = coords;
      const neuron = await getNearestNeuron({ lat, lng, ip4 });
      console.log(neuron);

      // Generate new PAC file here

      const updateIdentity: UpdateIdentity = { traits };
      const updateIdentityResponse = await kratos.updateIdentity(ai.claims.session.identity.id, updateIdentity);
      ai.claims.session.identity = updateIdentityResponse.data;

      // Call flow manager with the user id with first mile ip here
      /*
      const res: JSON = await (await fetch(process.env.FLOW_MANAGER_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: ai.claims.session.identity.id, firstMile: neuron.ip })
      }))
        .json();
        */
    } catch (error) {
      console.error(error.response);
    }
  }
};
