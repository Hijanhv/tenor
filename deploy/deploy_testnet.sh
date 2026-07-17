#!/usr/bin/env bash
# Deploy Tenor to Stellar testnet: two native test tokens (SY + USDC), the tokenizer,
# a demo market, and a seeded PT/USDC pool. Writes addresses to deploy/testnet.json.
set -euo pipefail

NET=testnet
SRC=deployer
ISSUER=$(stellar keys address $SRC)
TOK_WASM=target/wasm32v1-none/release/tokenizer.wasm
MTK_WASM=target/wasm32v1-none/release/mock_token.wasm

say() { printf "\n\033[1;36m== %s ==\033[0m\n" "$1"; }
q() { stellar contract invoke --id "$1" --source $SRC --network $NET "${@:2}" 2>/dev/null; }

say "issuer / deployer (admin + LP + demo user): $ISSUER"

say "deploy SY token (yield-bearing underlying)"
SY=$(stellar contract deploy --wasm $MTK_WASM --source $SRC --network $NET 2>/dev/null)
q "$SY" -- initialize --decimal 7 --name "Test Stellar Yield" --symbol "TSY" >/dev/null
echo "SY=$SY"

say "deploy USDC token (stable quote)"
USDC=$(stellar contract deploy --wasm $MTK_WASM --source $SRC --network $NET 2>/dev/null)
q "$USDC" -- initialize --decimal 7 --name "Test USDC" --symbol "USDC" >/dev/null
echo "USDC=$USDC"

say "deploy tokenizer"
TOK=$(stellar contract deploy --wasm $TOK_WASM --source $SRC --network $NET 2>/dev/null)
echo "TOKENIZER=$TOK"

NOW=$(date +%s)
MATURITY=$((NOW + 180*86400))   # 180-day tenor
INDEX=10000000                   # 1.0 (1e7)

say "initialize market (maturity=$MATURITY, index=1.0)"
q "$TOK" -- initialize --admin $ISSUER --underlying $SY --quote $USDC --maturity $MATURITY --index_init $INDEX >/dev/null
echo "initialized"

SY_SEED=10000000000000     # 1,000,000 SY (7 decimals), deep pool
USDC_SEED=9500000000000    # 950,000 USDC -> pool price 0.95 -> ~10.5% APR for 180d
EXTRA_USDC=5000000000      # 500 USDC demo buying power

say "mint SY + USDC to deployer"
q "$SY"   -- mint --to $ISSUER --amount $SY_SEED >/dev/null
q "$USDC" -- mint --to $ISSUER --amount $((USDC_SEED + EXTRA_USDC)) >/dev/null
echo "minted"

say "split SY -> PT + YT (deposit)"
q "$TOK" -- deposit --user $ISSUER --sy_amt $SY_SEED >/dev/null

say "seed PT/USDC pool at 0.95"
q "$TOK" -- add_liquidity --provider $ISSUER --pt_in $SY_SEED --quote_in $USDC_SEED >/dev/null

say "seed the carry vault (deposit + invest) so it shows live activity"
VAULT_SEED=20000000000   # 2,000 USDC
q "$USDC" -- mint --to $ISSUER --amount $VAULT_SEED >/dev/null
q "$TOK" -- vault_deposit --user $ISSUER --quote_in $VAULT_SEED >/dev/null
q "$TOK" -- vault_invest --amount $VAULT_SEED >/dev/null
echo "vault seeded"

say "simulate a little accrued yield (index 1.0 -> 1.01)"
q "$TOK" -- sync --new_index 10100000 >/dev/null || true

say "read fixed_rate + pt_price"
RATE=$(q "$TOK" -- fixed_rate || echo "?")
PRICE=$(q "$TOK" -- pt_price || echo "?")
echo "fixed_rate(1e7)=$RATE  pt_price(1e7)=$PRICE"

mkdir -p deploy web
JSON=$(cat <<JSON
{
  "network": "testnet",
  "rpc": "https://soroban-testnet.stellar.org",
  "passphrase": "Test SDF Network ; September 2015",
  "issuer": "$ISSUER",
  "tokenizer": "$TOK",
  "sy": "$SY",
  "usdc": "$USDC",
  "maturity": $MATURITY,
  "seededAt": $NOW
}
JSON
)
echo "$JSON" | tee deploy/testnet.json web/deployment.json >/dev/null

say "DONE, deploy/testnet.json written"
cat deploy/testnet.json
