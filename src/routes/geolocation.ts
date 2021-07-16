import { Request, Response } from 'express';
import { AdminApi, Configuration, UpdateIdentity } from '@ory/kratos-client';
import fetch from 'node-fetch';
import config from '../config';
import { authInfo, UserRequest } from '../helpers/authInfo';

const kratos = new AdminApi(new Configuration({ basePath: config.kratos.admin }));
const ValidateIPaddress = (ipAddress: string) => ipAddress.match(/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/);

const getNearestNeuron = async (data: any) => {
  const neuron: JSON = await (await fetch(process.env.FIRST_MILE_LOC!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  }))
    .json();

  console.log(neuron);

  return neuron;
};

export default async (req: Request, res: Response) => {
  const ai = authInfo(req as UserRequest);

  console.log('AY-YAY-YAY! ARRIBA!', ai);

  const { latitude: lat, longitude: lng } = req.body.location.coords;
  if (lat && lng) {
    console.log(await getNearestNeuron({ lat, lng }));

    // Generate new PAC file here
  }

  if (ai.claims.session.identity.schema_id === 'default') {
    console.log('HUH?');
  }

  const ip: string | undefined = req.connection.remoteAddress?.split(':').slice(-1)[0];
  if (ip !== undefined) {
    if (typeof ip === 'string' && !!ValidateIPaddress(ip)) {
      updateLocationByIP(ip, ai);
    } else if (Array.isArray(ip) && !!ValidateIPaddress(ip[0])) {
      updateLocationByIP(ip[0], ai);
    } else {
      throw new Error('IP Address could not be parsed');
    }
  }

  res.sendStatus(200);
};

const updateLocationByIP = async (ip4: string, ai: { claims: any, raw: any }) => {
  const traits: any = ai.claims.session.identity.traits;

  if (ip4 !== traits.system.ip4) {
    traits.system.ip4 = ip4;
    console.log(await getNearestNeuron({ ip4 }));

    // PAC file generation piece will go here

    try {
      const updateIdentity: UpdateIdentity = { traits };
      const updateIdentityResponse = await kratos.updateIdentity(ai.claims.session.identity.id, updateIdentity);
      ai.claims.session.identity = updateIdentityResponse.data;
    } catch (error) {
      console.log(error.response);
    }
  }
};
