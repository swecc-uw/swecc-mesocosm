# SWECC Bench CLI (mesocosm distribution)

Thin install wrapper around `bench_common` from [swecc-core](https://github.com/swecc-uw/swecc-core).

```bash
pip install swecc-mesocosm
```

Defaults (override with env):

- `SWECC_SERVER_URL` — Django auth host (default `https://api.swecc.org`)
- `SWECC_BENCH_URL` — bench-api (default `https://api.swecc.org/bench`)

```bash
bench init   # scaffold benchanything.json, adapter.py, env.py, showcase/
bench auth login --username YOUR_USER --password YOUR_PASSWORD
bench env submit --name "My env" --github-url https://github.com/org/repo
bench run create --domain DOMAIN_ID --vow-version 1.0.0 --model gemini/gemini-2.0-flash --visibility gallery_public
bench run export RUN_ID -o showcase/data/replay.json
```

See swecc-core `services/bench/docs/SHOWCASE_DEVELOPER.md` for building a showcase UI in **your repo** using `replay.json` (`reasoning`, observations, actions).
