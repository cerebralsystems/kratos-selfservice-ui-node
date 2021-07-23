import { NextFunction, Request, Response } from 'express';
import { authInfo, UserRequest } from '../helpers/authInfo';

export default (req: Request, res: Response) => {
  const ai = authInfo(req as UserRequest);
  res.render('instructions', {});
};
