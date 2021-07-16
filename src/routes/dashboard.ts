import { Request, Response } from 'express';
import { authInfo, UserRequest } from '../helpers/authInfo';

export default async (req: Request, res: Response) => {
  const ai = authInfo(req as UserRequest);

  res.render('dashboard', {
    session: ai.claims.session,
    token: ai,
    url: req.hostname
  });
};
