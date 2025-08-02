
import express from "express";
import { auth } from "../middleware/auth";
import analyticsController from "../controllers/analyticsController";


const router = express.Router();


router.get("/overview", auth,
    (req: any, res: any) => analyticsController.getOverview(req, res)
)

router.get("/dashboard",auth,
    (req: any, res: any) => analyticsController.getDashboardAnalytics(req, res)
)

router.get("/url/:urlId",auth,
    (req: any, res: any) => analyticsController.getUrlSpecificAnalytics(req, res)
)

export default router;

