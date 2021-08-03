import { Request, Response } from 'express';
import { AdminApi, Configuration, Identity } from '@ory/kratos-client';
import fetch from 'node-fetch';
import config from '../config';
import { authInfo, UserRequest } from '../helpers/authInfo';
import { generatePacFile, updateUserData } from './tenant';

const kratos = new AdminApi(new Configuration({ basePath: config.kratos.admin }));
const validateIPaddress = (ipAddress: string) => ipAddress.match(/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/);

export default async (req: Request, res: Response) => {
  const ai = authInfo(req as UserRequest);
  const user: Identity = ai.claims.session.identity;
  const traits: any = user.traits;

  let ip: string | undefined = req.connection.remoteAddress?.split(':').slice(-1)[0];
  if (ip !== undefined && user.schema_id === 'default') {
    if (Array.isArray(ip)) {
      ip = ip[0] as string;
    }

    if (validateIPaddress(ip)) {
      /* if a neuron ip is passed then only generate the pac file */
      if (req.body.location) {
        updateLocationByIP(req, req.body.location.coords, ip, user);
      }
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

/* Updates the identity DB of the new user ip and generates a new pac file with best neron */
const updateLocationByIP = async (req: Request, coords: any, ip4: string, user: Identity)
  : Promise<boolean> => {
  const traits: any = user.traits;
  if (ip4.startsWith('127') || ip4 !== traits.system.ip4) {
    try {
      const { latitude: lat, longitude: lng } = coords;
      const neuron = await getNearestNeuron({ lat, lng, ip4 });
      console.log(neuron);
      // this is useful if we have to offline regenerate pac files and flows when tenant services change
      traits.system.neuron = neuron;
      traits.system.ip4 = ip4;
      updateUserData(req, user);

      return true;
    } catch (error) {
      console.error(error.response);
    }
  }
  return false;
};
