#!/usr/bin/env bash
# Deploy Tenor to Stellar mainnet (public network).
#
# This is deliberately NOT deploy_testnet.sh with the network swapped. The testnet
# script deploys two mock tokens, mints itself a million of each, and seeds a pool
# at a made-up price. None of that belongs on mainnet: a real market points at a
# real yield-bearing asset (Blend pool token, DeFindex share, USDY) and real USDC,
# and liquidity is seeded with assets you actually hold.
#
# So this script does three things only: upload the tokenizer wasm, create the
# contract instance, initialize the market. Seeding liquidity and the carry vault
# is left to you, with real size, after you have checked the deployed market.
#
#   TENOR_SY=C...   ./deploy/deploy_mainnet.sh --dry-run   # preflight + real fee quote, spends nothing
#   TENOR_SY=C...   ./deploy/deploy_mainnet.sh             # deploys, asks for confirmation first
set -euo pipefail

NET_PASS="Public Global Stellar Network ; September 2015"
RPC="${STELLAR_RPC_URL:-https://mainnet.sorobanrpc.com}"
HORIZON="${STELLAR_HORIZON_URL:-https://horizon.stellar.org}"

# Tenor's deployer wallet — the same keypair the project already uses as the testnet
# issuer (deploy/testnet.json, web/deployment.json, README). Stellar keys are
# network-agnostic, so this is one wallet with separate account state per network;
# on mainnet it was funded 2026-07-24. It pays the deploy fees and becomes admin.
TENOR_MAINNET_WALLET="${TENOR_MAINNET_WALLET:-GBESJK7N25HADVP5W5RD2OEY6CNUF345ADSX2NKWOMIHJ46ZCHOBE5EP}"

# Signing identity for that wallet: a `stellar keys` name, or an S... secret.
# Its public key must match TENOR_MAINNET_WALLET above, or the deploy is refused.
SRC="${TENOR_SOURCE:-deployer}"

# The yield-bearing asset the market splits. No default: picking this wrong is the
# one mistake you cannot undo, so it has to be stated explicitly.
SY="${TENOR_SY:-}"

# Stable token the PT AMM prices against. Defaults to Circle's USDC SAC on mainnet.
QUOTE="${TENOR_QUOTE:-CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75}"

TENOR_DAYS="${TENOR_DAYS:-180}"       # tenor length in days
INDEX_INIT="${TENOR_INDEX_INIT:-10000000}"  # starting SY->asset rate, 1e7 = 1:1

WASM=target/wasm32v1-none/release/tokenizer.wasm
DRY_RUN=0
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=1

say()  { printf "\n\033[1;36m== %s ==\033[0m\n" "$1"; }
warn() { printf "\033[1;33m!! %s\033[0m\n" "$1"; }
die()  { printf "\033[1;31mxx %s\033[0m\n" "$1" >&2; exit 1; }
sc()   { stellar contract "$@" --rpc-url "$RPC" --network-passphrase "$NET_PASS"; }

# ---------------------------------------------------------------- preflight

say "preflight"

[[ -f "$WASM" ]] || die "no wasm at $WASM — run: stellar contract build"
[[ -n "$SY" ]] || die "set TENOR_SY to the mainnet contract id of the yield-bearing asset (Blend pool token, DeFindex share, USDY, ...)"

for id in "$SY" "$QUOTE"; do
  [[ "$id" =~ ^C[A-Z2-7]{55}$ ]] || die "not a contract id: $id"
done

ISSUER=$(stellar keys address "$SRC" 2>/dev/null || echo "$SRC")
[[ "$ISSUER" =~ ^G[A-Z2-7]{55}$ ]] || die "could not resolve a public key from TENOR_SOURCE=$SRC"

# Signing with a bare public key cannot work, and silently deploying from the wrong
# key would hand contract admin to an account you may not control. Fail loudly.
if [[ "$ISSUER" != "$TENOR_MAINNET_WALLET" ]]; then
  die "TENOR_SOURCE=$SRC resolves to $ISSUER, but the mainnet wallet is $TENOR_MAINNET_WALLET.
     Import the secret for that wallet first:  stellar keys add tenor-mainnet
     (or override with TENOR_MAINNET_WALLET=... if you really mean to deploy from a different account)"
fi
echo "deployer      $ISSUER"
echo "underlying    $SY"
echo "quote         $QUOTE"

# The account must already exist on mainnet. A key that only ever lived on testnet
# looks identical but has no mainnet account behind it.
ACCT=$(curl -sf "$HORIZON/accounts/$ISSUER" 2>/dev/null) \
  || die "$ISSUER does not exist on mainnet. Fund it with at least 1 XLM (base reserve) plus deploy fees."
BAL=$(printf '%s' "$ACCT" | python3 -c "import sys,json;print(next(b['balance'] for b in json.load(sys.stdin)['balances'] if b['asset_type']=='native'))")
echo "balance       $BAL XLM"

# Both target contracts must actually be live on mainnet, or initialize succeeds
# against an address that can never be invoked.
# The free public RPC returns 503 on roughly one call in five, and "no contract live"
# is a badly misleading way to report that right before a real deploy. Back off hard
# rather than retrying inside the same rate-limit window.
for id in "$SY" "$QUOTE"; do
  ok=0
  for delay in 0 3 8 20; do
    [[ $delay -gt 0 ]] && sleep $delay
    if sc info interface --id "$id" >/dev/null 2>&1; then ok=1; break; fi
  done
  [[ $ok == 1 ]] || die "could not reach $id on mainnet after 4 tries.
     Either the contract is not live, or $RPC is rate-limiting you.
     For a real deploy use a dedicated RPC: STELLAR_RPC_URL=https://... ./deploy/deploy_mainnet.sh"
done
echo "targets       both contracts resolve on mainnet"

# ---------------------------------------------------------------- fee quote

say "fee quote (simulated against mainnet, spends nothing)"

UPLOAD_XDR=$(sc upload --wasm "$WASM" --source-account "$ISSUER" --build-only 2>/dev/null | tail -1)
FEE=$(python3 - "$RPC" <<PY
import json, subprocess, sys
rpc = sys.argv[1]
req = json.dumps({"jsonrpc":"2.0","id":1,"method":"simulateTransaction",
                  "params":{"transaction":"""$UPLOAD_XDR"""}})
out = subprocess.run(["curl","-s","-m","40","-X","POST",rpc,
                      "-H","Content-Type: application/json","--data-binary",req],
                     capture_output=True, text=True).stdout
res = json.loads(out).get("result", {})
print(res.get("minResourceFee", "0") if "error" not in res else "0")
PY
)
[[ "$FEE" != "0" ]] || warn "could not simulate the upload fee; falling back to a static estimate"
UPLOAD_XLM=$(python3 -c "print(f'{int($FEE)/1e7:.5f}')")
echo "wasm upload   $UPLOAD_XLM XLM  ($(wc -c <"$WASM" | tr -d ' ') bytes)"
echo "instance      ~0.04 XLM"
echo "initialize    ~0.19 XLM"
echo "reserve       1.00 XLM (held, not spent)"
TOTAL=$(python3 -c "print(f'{int($FEE)/1e7 + 0.23 + 1:.2f}')")
echo "total needed  ~$TOTAL XLM"

python3 -c "
import sys
bal, need = float('$BAL'), float('$TOTAL')
sys.exit(0 if bal >= need else 1)" \
  || die "balance $BAL XLM is short of the ~$TOTAL XLM this needs"

if [[ $DRY_RUN == 1 ]]; then
  say "dry run, stopping here. Nothing was submitted."
  exit 0
fi

# ---------------------------------------------------------------- confirm

NOW=$(date +%s)
MATURITY=$((NOW + TENOR_DAYS * 86400))

say "about to spend real XLM on mainnet"
cat <<EOF
  deployer / admin  $ISSUER
  underlying (SY)   $SY
  quote             $QUOTE
  maturity          $MATURITY  ($TENOR_DAYS days from now, $(date -r $MATURITY 2>/dev/null || date -d @$MATURITY))
  index_init        $INDEX_INIT
  cost              ~$TOTAL XLM, irreversible

  The deployer becomes admin: the only account that can call sync() to push the
  yield index and vault_invest() to deploy vault cash. Losing that key freezes both.
EOF
read -r -p $'\ntype DEPLOY to continue: ' CONFIRM
[[ "$CONFIRM" == "DEPLOY" ]] || die "aborted"

# ---------------------------------------------------------------- deploy

say "upload tokenizer wasm"
# Uploaded separately from the instance so the hash is reusable: every later market
# reuses this code entry and pays only the instance + initialize (~0.22 XLM).
# stderr is left visible on purpose: a swallowed submission error here once cost a
# whole deploy attempt with no diagnostic. The hash/id still comes from stdout.
HASH=$(sc upload --wasm "$WASM" --source "$SRC" | tail -1)
echo "WASM_HASH=$HASH"

say "create contract instance"
TOK=$(sc deploy --wasm-hash "$HASH" --source "$SRC" | tail -1)
echo "TOKENIZER=$TOK"

say "initialize market"
sc invoke --id "$TOK" --source "$SRC" -- initialize \
  --admin "$ISSUER" --underlying "$SY" --quote "$QUOTE" \
  --maturity "$MATURITY" --index_init "$INDEX_INIT" >/dev/null
echo "initialized"

say "read back market_info"
sc invoke --id "$TOK" --source "$SRC" --send=no -- market_info || true

mkdir -p deploy web
cat > deploy/mainnet.json <<JSON
{
  "network": "mainnet",
  "rpc": "$RPC",
  "passphrase": "$NET_PASS",
  "issuer": "$ISSUER",
  "tokenizer": "$TOK",
  "wasmHash": "$HASH",
  "sy": "$SY",
  "usdc": "$QUOTE",
  "maturity": $MATURITY,
  "seededAt": $NOW
}
JSON
cat deploy/mainnet.json

say "DONE — deploy/mainnet.json written"
cat <<EOF
Still to do, deliberately not automated:
  1. add_liquidity to seed the PT/USDC pool, with real size you are willing to lose.
  2. A keeper calling sync() on a schedule. Yield stops accruing to YT holders without it.
  3. extend_ttl on the code entry and the instance, or the contract is archived and
     the market becomes uninvokable. Budget roughly the upload rent per renewal.
  4. Point the web app at deploy/mainnet.json (web/deployment.json is testnet).
EOF
