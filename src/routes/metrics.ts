import { Request, Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { authInfo, UserRequest } from '../helpers/authInfo';
const fsp = require('fs').promises;

class Measure {
    date: Date | undefined;
    fileName: string | undefined;
}

const startingDate: any = new Date(process.env.STARTING_DATE + '');
const pingMeasures: Measure[] = [];
const dlMeasures: Measure[] = [];
const vpnMeasures: Measure[] = [];

export const metrics = async (req: Request, res: Response) => {
  const ai = authInfo(req as UserRequest);
  if (ai.claims.session.identity.schema_id === 'default') {
    res.sendStatus(404);
    return;
  }
  res.json({ count: pingMeasures.length });
};

export const metric = async (req: Request, res: Response) => {
  const ai = authInfo(req as UserRequest);
  if (ai.claims.session.identity.schema_id === 'default') {
    res.sendStatus(404);
    return;
  }
  let filename: string | undefined = '';
  let index: number = parseInt(req.params.index);
  if (req.params.type === 'ping') {
    if (index < pingMeasures.length) { filename = pingMeasures[index].fileName; }
  } else if (req.params.type === 'vpn') {
    index = index - (pingMeasures.length - vpnMeasures.length);
    if (index > -1) { filename = vpnMeasures[index].fileName; }
  } else if (req.params.type === 'download') {
    index = index - (pingMeasures.length - dlMeasures.length);
    if (index > -1) { filename = dlMeasures[index].fileName; }
  }
  if (filename) {
    var stream = fs.createReadStream(filename);
    res.writeHead(200, {
      'Content-Type': 'text/xml'
    });
    stream.pipe(res);
  } else {
    res.writeHead(401);
    res.end();
  }
};

async function scanMeasures (directoryName: string) {
  try {
    await fsp.stat(process.env.MEASURE_DIR);
  } catch (err) {
    return;
  }
  const files = await fsp.readdir(directoryName, { withFileTypes: true });
  for (const f of files) {
    const fullPath: string = path.join(directoryName, f.name);
    if (f.name.endsWith('.xml')) {
      let measures : Measure[];
      let dateString: string = '';
      if (f.name.startsWith('measure')) {
        dateString = f.name.substr(8);
        measures = pingMeasures;
      } else if (f.name.startsWith('https-download')) {
        dateString = f.name.substr(15);
        measures = dlMeasures;
      } else if (f.name.startsWith('vpn-measure')) {
        dateString = f.name.substr(12);
        measures = vpnMeasures;
      } else { continue; }
      dateString = dateString.substr(0, 10) + ' ' + dateString.substr(11, dateString.length - 15);
      const date: any = new Date(dateString);
      const m = new Measure();
      m.date = date;
      m.fileName = fullPath;
      if ((date - startingDate) > 0) {
        measures.push(m);
      }
    }
  }
  pingMeasures.sort((a: any, b: any) => a.date - b.date);
  dlMeasures.sort((a: any, b: any) => a.date - b.date);
  vpnMeasures.sort((a: any, b: any) => a.date - b.date);
}
if (process.env.MEASURE_DIR) {
  scanMeasures(process.env.MEASURE_DIR);
}
