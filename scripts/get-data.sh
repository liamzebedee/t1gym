set -ex

curl "$NIGHTSCOUT_ENDPOINT_URL/api/v1/entries?count=200" \
  -H 'accept: application/json' \
  -H 'DNT: 1' \
  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Safari/537.36' \
  --compressed > ./data/glucose.json