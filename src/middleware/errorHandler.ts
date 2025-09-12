import { NextFunction, Request, Response } from 'express';

export function notFound(req: Request, res: Response, _next: NextFunction) {
  res.status(404).json({ message: 'Ruta no encontrada' });
}

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.error('Error middleware:', err);
  if (res.headersSent) return;
  if (!err || typeof err !== 'object') {
    console.error('Error inesperado:', err);
    res.status(500).json({ message: 'Error interno inesperado' });
    return;
  }
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || 'Error interno'
  });
}
