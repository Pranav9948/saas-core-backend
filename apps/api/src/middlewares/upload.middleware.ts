import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import { BadRequestException } from '@/exceptions/exceptions.js';

const storage = multer.memoryStorage();

const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];

export const uploadLogo = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
  fileFilter: (
    _req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback,
  ) => {
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new BadRequestException('Only PNG, JPEG, WEBP images allowed'));
    }

    cb(null, true);
  },
});
