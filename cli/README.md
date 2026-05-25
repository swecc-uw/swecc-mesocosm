# SWECC Bench CLI (mesocosm distribution)

Thin install wrapper around `bench_common` from [swecc-core](https://github.com/swecc-uw/swecc-core).

```bash
pip install swecc-mesocosm
```

Defaults (override with env):

- `SWECC_SERVER_URL` — Django auth host (default `https://api.swecc.org`)
- `SWECC_BENCH_URL` — bench-api (default `https://api.swecc.org/bench`)

```bash
bench auth login --username YOUR_USER --password YOUR_PASSWORD
bench env submit --name "My env" --github-url https://github.com/org/repo
```
