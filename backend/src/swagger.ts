import swaggerJsdoc from "swagger-jsdoc";
import { env } from "./config/env.js";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "NIDUS Academy API",
      version: "1.0.0",
      description: "API documentation for the NIDUS Academy platform."
    },
    servers: [
      { url: `${env.BACKEND_PUBLIC_URL.replace(/\/+$/, "")}/api`, description: "Production" },
      { url: "http://localhost:8080/api", description: "Development" }
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "session"
        }
      }
    }
  },
  apis: ["src/modules/auth/auth.v2.routes.ts", "src/modules/courses/courses.routes.ts", "src/modules/dashboard/dashboard.routes.ts"]
};

export const swaggerSpec = swaggerJsdoc(options);
