# Interpreter testing flow

Note that this entire flow is performed automatically by the GitHub actions every time code is pushed to any branch. If the snapshot tests are failing within the actions and you'd like to update the snapshot, run `yarn test -u` and then push again. Follow these steps to do perform the testing locally...

## Storing decoded transations in local DB

1. Make sure you have a local instance of MongoDB running.
[local mongoDB installation guide](https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-os-x/)

note: I've been running MongoDB "as a macOS service" as they suggest.

To see the data in a GUI I've been using [Compass](https://www.mongodb.com/products/compass) (by the MongoDB team)

You can connect to a local instance using `mongodb://localhost:27017`

2. The `testTxHashes.ts` file has a list of transactions to test the interpreter with. If you add support
for a new protocol, add example transactions to that file. Note that the contract and functions names are purely for human readability within the file itself and do not have any functional significance. If you would like to test the same transaction with multiple roles (an NFT buy/sell for example), then put the tx hash as a key in the `multiSidedTxMap` object, with its corresponding value being an array of all of the addresses you'd like to test as participants in the transaction (buyer and seller for example).

3. Once the `testTxHashes.ts` file is complete, run `yarn seed-test-txs` in terminal within the evm-translator folder. This will decode all the transactions in your folder and update the `decodedtxes` collection within the
evm-translator DB.

Note: you will have to complete this step every time the `testTxHashes.ts` file is updated.

## Testing the interpreter with snapshotting

1. In a new terminal tab, run `yarn dev` within the evm-translator folder. This will enable hot reloading for your changes.

2. Make sure you have followed the above steps to store decoded transactions in your local DB. Keep the local DB instance up and running.

3. Run `yarn test`. If this fails, you know the interpreter broke. If it failed but you'd like to update the snapshot so that this new intepretations is the "answer" going forward, run `yarn test -u`.