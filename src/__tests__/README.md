# Interpreter testing flow

## Storing decoded transations in local DB

1. Make sure you have a local instance of MongoDB running. (see https://github.com/the-metagame/metabot if you need one)

2. The `testTxHashArr.json` file has a list of transactions to test the interpreter with. If you add support
for a new protocol, add example transactions to that file.

3. Once the `testTxHashArr.json` file is complete, run `yarn seed-test-txs` in terminal within the evm-translator folder. This will decode all the transactions in your folder and update the `decodedtxes` collection within the
evm-translator DB.

Note: you will have to complete this step every time the `testTxHashArr.json` file is updated.

## Testing the interpreter with snapshotting

TODO