This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

The UI reads domains from the BenchAnything API (default `http://127.0.0.1:8000`). Start the API from the **repo root** first:

```bash
cd ..   # repo root
uv run uvicorn src.api.app:app --reload
```

Then install and run the Next app from this directory:

```bash
cd ui
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Registered domains (including **draft** ones like `game-2048`) appear on the home page; click a card for detail. Optional: `NEXT_PUBLIC_BENCH_API_URL=http://host:port` in `.env.local` if the API is not on localhost:8000.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
