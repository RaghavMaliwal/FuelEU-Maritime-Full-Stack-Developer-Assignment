# Environment Variables Setup

## Backend

Create a `.env` file in the `backend` directory with:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/fueleu?schema=public"
PORT=4000
```

Replace `username`, `password`, `localhost`, `5432`, and `fueleu` with your PostgreSQL credentials.

## Frontend

The frontend doesn't require environment variables by default. The API proxy is configured in `vite.config.ts` to forward `/api` requests to `http://localhost:4000`.

If you need to customize the API base URL, you can add to `.env`:

```env
VITE_API_BASE_URL=http://localhost:4000
```

Then update `apiClient.ts` to use `import.meta.env.VITE_API_BASE_URL` instead of the hardcoded `/api`.



