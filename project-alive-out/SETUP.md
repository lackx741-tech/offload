# SETUP — St3

## Orient (source of truth)

```bash
cd "/Users/a.l-f.a.t.t.ah/Desktop/Production/SETUPSAAS/St3"
project-alive all . --out ./project-alive-out
ls -la
test -f README.md && head -40 README.md || true
```

## Check toolchain

```bash
node -v   # need >=18 or engines field
docker version
```

## Install dependencies

```bash
npm install
```

## Operator config (.env)

```bash
# create .env from docs / project-alive handoff section
# edit .env — fill critical keys (DB, secrets, keys, bot tokens)
```

## Local infra

```bash
docker compose up -d
# or only: docker compose up -d redis postgres
```

## Boot primary entrypoint

```bash
npm run start
```

## Verify

```bash
npm run lint
```

