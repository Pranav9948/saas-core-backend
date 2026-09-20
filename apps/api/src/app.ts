import cookieParser from "cookie-parser";
import express, { type Express } from "express";
import { engine } from "express-handlebars";
import helmet from "helmet";
import path from "path";
import { setupBullBoard } from "./core/bull-board.js";
import { corsMiddleware } from "./core/cors.js";
import { apiLimiter } from "./core/rate-limit.js";
import { NotFoundException } from "./exceptions/exceptions.js";
import { ErrorCode } from "./exceptions/root.js";
import { prisma } from "./infra/db.js";
import { redis } from "./infra/redis.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { requestContext } from "./middlewares/request-context.middleware.js";
import { requestLogger } from "./middlewares/request-logger.middleware.js";
import { requestTimeout } from "./middlewares/timeout.middleware.js";
import { startAnalyticsCron } from "./modules/jobs/schedulers/analytics.scheduler.js";
import routes from "./routes/v1/index.js";
import { webhookHandler } from "./utils/webhookHandler.js";

export const app: Express = express();
const bullBoard = setupBullBoard();

const viewsPath = path.join(process.cwd(), "app", "views");

app.post(
  "/api/webhook",
  express.raw({ type: "application/json" }),
  webhookHandler,
);

const HEALTH_CHECK_TIMEOUT_MS = 2000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("health check timeout")),
      ms,
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

app.get("/health", async (_req, res) => {
  const timestamp = new Date().toISOString();
  const uptime = process.uptime();

  let dbOk = false;
  let redisOk = false;

  try {
    await withTimeout(prisma.$queryRaw`SELECT 1`, HEALTH_CHECK_TIMEOUT_MS);
    dbOk = true;
  } catch {
    dbOk = false;
  }

  try {
    const pong = await withTimeout(redis.ping(), HEALTH_CHECK_TIMEOUT_MS);
    redisOk = pong === "PONG";
  } catch {
    redisOk = false;
  }

  const status = dbOk && redisOk ? "ok" : "degraded";
  res.status(status === "ok" ? 200 : 503).json({
    status,
    service: "api",
    timestamp,
    uptime,
    dependencies: {
      database: dbOk ? "connected" : "disconnected",
      redis: redisOk ? "connected" : "disconnected",
    },
  });
});

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(requestContext);
app.use(requestLogger);
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);
app.use(cookieParser());
app.use(corsMiddleware);

app.use(requestTimeout(5000));

app.use("/admin/queues", bullBoard.getRouter());

startAnalyticsCron();

app.engine(
  "hbs",
  engine({
    extname: ".hbs",
    defaultLayout: "main",
    layoutsDir: path.join(viewsPath, "layouts"),
  }),
);

app.set("view engine", "hbs");

app.set("views", viewsPath);
app.use("/api", apiLimiter);

app.use("/api/v1", routes);

app.all("{*path}", (req, _res, next) => {
  next(
    new NotFoundException(
      `Route ${req.originalUrl} not found`,
      ErrorCode.NOT_FOUND,
    ),
  );
});

app.use(errorMiddleware);
