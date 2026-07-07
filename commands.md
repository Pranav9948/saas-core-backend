--------------------------------------------------------------------------------------------------------------

    DOCKER COMMANDS

---

---

🎯 docker-compose --env-file ./apps/api/.env up

When to use:
To start your entire stack (API + DB).

When NOT to use:
Do not use if you have changed your package.json or Dockerfile.

---

🎯 docker-compose --env-file ./apps/api/.env up -d --build

When to use:
When you change code, install a new npm package, or edit the Dockerfile.

When NOT to use:
Do not use if you only changed a simple .ts file (watch mode enabled).

---

🎯 docker-compose --env-file ./apps/api/.env down

When to use:
When you are done for the day or want to stop everything safely.

When NOT to use:
Do not use if you want to keep your database running in the background.

---

🎯 pnpm --filter api run prisma:dev -- --name fitness-system

🔵 This command is used to push or update schema changes to database

The "Debug & Maintenance" Commands

When things go wrong (like the Prisma bug we just fixed), use these to look inside the "box."

🎯 docker-compose logs -f

🔵 What: Shows you the terminal output of your API and DB in real-time.

🔵 When: Use this immediately if your container status says "restarting" or "exited."

🔵 Pro Tip: Use docker-compose logs -f api to only see the backend logs.

---

🎯 docker exec -it <container_name> sh

🔵 What: "SSH" into your running container. It opens a terminal inside the Linux environment.

🔵 When: Use this to check if a file exists (e.g., ls prisma/schema.prisma) or to run a one-off command like npx prisma studio.

Example: docker exec -it saas_api sh

---

🎯 docker-compose ps

🔵 What: Shows a list of your running containers and their status (Up, Exited, or Restarting).
🔵 When: Use this to check if your Postgres DB is actually healthy.

---

3. The "Cleanup" (When you run out of disk space)

Docker stores every version of your images. Over time, this takes up gigabytes.

🎯 docker system prune

🔵What: Deletes all "dangling" data (stopped containers, unused networks, and old images).

🔵 When: Use this once a week or when your computer feels slow.

🔵 Warning: It won't delete your "Volumes" (your database data) unless you add the -a and --volumes flags.

---

The Prisma Special

Since you are using Prisma, you have a unique command you'll need:

🎯 docker exec -it saas_api npx prisma studio

🔵 What: Opens the Prisma GUI to view your database in the browser.
🔵 When: Use this to manually check if data was saved correctly without writing code.

---

If the code works on your Windows machine but fails in Docker:

🎯 docker-compose down

🎯 docker-compose up --build

If that doesn't fix it, use docker-compose logs -f to see the error.

---
