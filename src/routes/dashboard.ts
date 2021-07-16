import { Request, Response } from 'express';
import { authInfo, UserRequest } from '../helpers/authInfo';

export default (req: Request, res: Response) => {
  const ai: any = authInfo(req as UserRequest);

  console.log('thing_1:', ai);

  console.log('thing_2:', ai.claims);

  res.render('dashboard', {
    session: ai.claims,
    url: req.hostname
  });
};
