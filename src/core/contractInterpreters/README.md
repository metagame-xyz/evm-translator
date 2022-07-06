# Contributing contract interpretations to evm-translator

## What we need from you

If you're here, you likely understand the power and potential of evm-translator to create human readble interpreations of ethereum transactions. We have the infrastructure in place to elegantly interpret transactions from nearly every contract deployed to the chain. However, **we still need lots of contract-specific interpretations** to improve our coverage and close our blind spots. That's where you come in.

Do you have a protocol or contract you interact with frequently that you'd like to see detailed, concise interpretations for? Have you deployed your own contract that deserves recognition by evm-translator? Contribute to evm-translator!

## How to contribute

You don't need to be an advanced web3 software developer to contribute a contract interpretation to evm-translator. Note that Part 1 sets up a local environment for testing your new contract interpretations. This part is optional but highly encouraged if you are comfortable with the set up. Here's how it's done...

### Part 1: Setting up a local testing environment

1. Clone the repos by following [these steps](https://github.com/metagame-xyz/evm-translator-demo)

2. Set up the database

Folllow [MongoDB's local installation guide](https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-os-x/)

Run `brew services start mongodb-community@5.0`

To see the data in a GUI I've been using [Compass](https://www.mongodb.com/products/compass) (by the MongoDB team)

You can connect to a local instance using `mongodb://localhost:27017`

Seed erc721 & erc20 ABIs with `yarn run seed` (it runs `evm-translator/scripts/seed-db.js`) (we should add erc1155 here too)

TODO: set up a endpoint for this...Seed contracts with `https://metabot.loca.lt/api/seed/contracts`

3. Bringing it all together

Now, run `yarn dev` within the evm-translator-demo folder in your terminal. In a new terminal tab, run `yarn dev` within the evm-translator folder. Go to [localhost:3000/interpret](localhost:3000/interpret) in your browser of choice. Put an example transaction in the first text field and then select "Get Interpretation". Here is a particularly interesting transaction you could try...0xca8f8c315c8b6c48cee0675677b786d1babe726773829a588efa500b71cbdb65.

If that worked for you, then you have successfully set up your test environment. Well done! This interface will allow you to live-test example transactions of the contracts you're interpreting.
