# Interpreter testing flow

## Storing decoded transations in local DB

1. Make sure you have a local instance of MongoDB running. (see https://github.com/the-metagame/metabot if you need one)

2. The `testTxHashArr.json` file has a list of transactions to test the interpreter with. If you add support
for a new protocol, add example transactions to that file.

3. Once the `testTxHashArr.json` file is complete, run `yarn seed-test-txs` in terminal within the evm-translator folder. This will decode all the transactions in your folder and update the `decodedtxes` collection within the
evm-translator DB.

Note: you will have to complete this step every time the `testTxHashArr.json` file is updated.

## Testing the interpreter with snapshotting

1. In a new terminal tab, run `yarn dev` within the evm-translator folder. This will enable hot reloading for your changes.

2. Make sure you have followed the above steps to store decoded transactions in your local DB. Keep the local DB instance up and running.

3. Run `yarn test`. If this fails, you know the interpreter broke. If it failed but you'd like to update the snapshot so that this new
intepretations is the "answer" going forward, run `yarn test -u`. Then run `yarn test` again to rewrite the snapshots.