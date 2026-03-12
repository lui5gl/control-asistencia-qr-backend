import { Request, Response } from "express";

export const getAna = async (req: Request, res: Response): Promise<void> => {
  try {
    res.status(200).json({
      message: "Hola desde el componente Ana"
    });
  } catch (error) {
    res.status(500).json({
      error: "Error en el componente Ana"
    });
  }
};
