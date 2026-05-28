# SWECC Bench CLI (mesocosm distribution)

Thin install wrapper around **swecc-mesocosm** from [swecc-core](https://github.com/swecc-uw/swecc-core) (`packages/swecc-mesocosm`). One command: **`mesocosm`** (there is no separate `bench` binary on PyPI).

```bash
pip install swecc-mesocosm
mesocosm --help
```

Defaults (override with env):

- `SWECC_SERVER_URL` — Django auth host (default `https://api.swecc.org`)
- `SWECC_BENCH_URL` / `MESOCOSM_BASE_URL` — bench-api (default `https://api.swecc.org/bench`)

```bash
mesocosm init   # scaffold files/, showcase/, LOCAL_DEV.md
mesocosm auth login   # prompts for username and password (not stored in shell history)
mesocosm env submit --name "My env" --github-url https://github.com/org/repo
mesocosm run create --domain DOMAIN_ID --vow-version 1.0.0 --model gemini/gemini-2.0-flash --visibility gallery_public
mesocosm run export RUN_ID -o showcase/data/replay.json
```

See swecc-core `services/bench/docs/SHOWCASE_DEVELOPER.md` for building a showcase UI in **your repo** using `replay.json` (`reasoning`, observations, actions).
