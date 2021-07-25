import { NextFunction, Request, Response } from 'express';
import { authInfo, UserRequest } from '../helpers/authInfo';

export default (req: Request, res: Response) => {
  const ai = authInfo(req as UserRequest);
  if (ai.claims.session.identity.schema_id === 'admin') {
    res.render('network', {
      session: ai.claims.session,
      url: req.hostname
    });
  } else res.sendStatus(404);
};
