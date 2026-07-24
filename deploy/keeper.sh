#!/usr/bin/env bash
# Tenor yield keeper: reads a real Stellar yield rate and pushes it to the market's
# index via `sync`, so the market's implied fixed rate tracks live yield instead of a
# hand-typed number. Reads Blend USDC's live APY from DeFiLlama (the same feed the web
# analytics page uses). In production this would instead read the underlying SY's
# on-chain exchange rate or a Reflector feed; DeFiLlama is the off-chain stand-in.
#
#   ./deploy/keeper.sh              # dry run: fetch rate, show the index it would push
#   ./deploy/keeper.sh --run        # actually submit the sync (needs the admin key)
#
# Env: TENOR_NET (testnet|mainnet), TENOR_TOKENIZER, TENOR_SOURCE, TENOR_DT (seconds).
set -euo pipefail

NET="${TENOR_NET:-testnet}"
SRC="${TENOR_SOURCE:-deployer}"
BLEND_USDC_POOL="ecf788e3-d2ef-4fdd-9ece-8a2d96226ddf" # DeFiLlama pool id, matches web/lib/yields.ts
YEAR=31536000
STATE="deploy/.keeper_state"   # remembers the last sync time to size the next increment

if [[ "$NET" == "mainnet" ]]; then
  TOK="${TENOR_TOKENIZER:-CDZFACPLN7EDI55KU4OOSFWTD56DM4GVAUZJ6CMOUQTFKYUQ2BWFQVZI}"
  RPC="${STELLAR_RPC_URL:-https://mainnet.sorobanrpc.com}"
  PASS="Public Global Stellar Network ; September 2015"
else
  TOK="${TENOR_TOKENIZER:-CBETJAH3AEX2TDBDNL6LRYE4DQVR4GS5Q4C2MASQPXTF5YCFTGQVFTV4}"
  RPC="${STELLAR_RPC_URL:-https://soroban-testnet.stellar.org}"
  PASS="Test SDF Network ; September 2015"
fi

RUN=0
[[ "${1:-}" == "--run" ]] && RUN=1

say() { printf "\n\033[1;36m== %s ==\033[0m\n" "$1"; }
die() { printf "\033[1;31mxx %s\033[0m\n" "$1" >&2; exit 1; }

say "read live Blend USDC yield (DeFiLlama)"
APY=$(curl -s -m 15 "https://yields.llama.fi/chart/$BLEND_USDC_POOL" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data'][-1]['apy'])") \
  || die "could not fetch the Blend rate"
echo "APY = $APY %"

say "read current market index"
CUR=$(stellar contract invoke --id "$TOK" --source "$SRC" --rpc-url "$RPC" \
  --network-passphrase "$PASS" --send=no -- market_info 2>/dev/null \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['index'])") \
  || die "could not read market_info (is $SRC in your keystore?)"
echo "current index (1e7) = $CUR"

# Seconds since the last sync this keeper did, so the increment matches real elapsed time.
NOW=$(date +%s)
LAST=$(cat "$STATE" 2>/dev/null || echo "")
DT="${TENOR_DT:-$([[ -n "$LAST" ]] && echo $((NOW - LAST)) || echo 3600)}"
[[ "$DT" -gt 0 ]] || die "elapsed time is zero; pass TENOR_DT=<seconds>"

# new = current * (1 + apy/100 * dt/year), computed at 1e7 scale in integer math.
NEW=$(python3 -c "print(int($CUR * (1 + ($APY/100.0) * ($DT/$YEAR.0))))")
echo "elapsed = ${DT}s -> new index (1e7) = $NEW  (+$(python3 -c "print(round(($NEW-$CUR)/$CUR*100,4))")%)"

if [[ $RUN == 0 ]]; then
  say "dry run — nothing submitted. Re-run with --run to push this via sync()."
  exit 0
fi

say "submit sync($NEW)"
stellar contract invoke --id "$TOK" --source "$SRC" --rpc-url "$RPC" \
  --network-passphrase "$PASS" --inclusion-fee 1000000 -- sync --new_index "$NEW" >/dev/null
echo "$NOW" > "$STATE"
echo "synced. Market index now tracks live Blend yield."
