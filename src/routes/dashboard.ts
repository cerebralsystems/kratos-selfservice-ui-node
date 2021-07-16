import { Request, Response } from 'express';
import { authInfo, UserRequest } from '../helpers/authInfo';

export default (req: Request, res: Response) => {
  const ai: any = authInfo(req as UserRequest);

  res.render('dashboard', {
    session: ai.claims.session,
    url: req.hostname
  });
};
