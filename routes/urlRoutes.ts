import express from 'express';
import multer from 'multer';
import urlController from '../controllers/urlController';
import { auth } from '../middleware/auth';
import { urlValidation } from '../middleware/validation';
import { shortenLimiter } from '../middleware/rateLimiter';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});

router.post('/shorten', 
  auth, 
  shortenLimiter,
  upload.single('qrCodeImage'),
  urlValidation.shortenUrl,
  (req: any, res: any) => urlController.shortenUrl(req, res)
);

router.get('/user-urls', 
  auth,
  urlValidation.getUserUrls,
  (req: any, res: any) => urlController.getUserUrls(req, res)
);

// router.get('/get/:id', 
//   auth,
//   urlValidation.getUrl, 
//   (req: any, res: any) => urlController.getUrlById(req, res)
// );

router.delete('/delete/:id', 
  auth, 
  urlValidation.getUrl, 
  urlController.deleteUrl
);



export default router; 