# Contributing contract interpretations to evm-translator

## What we need from you

If you're here, you likely understand the power and potential of evm-translator to create human readble interpreations of ethereum transactions. We have the infrastructure in place to elegantly interpret transactions from nearly every contract deployed to the chain. However, **we still need lots of contract-specific interpretations** to improve our coverage and close our blind spots. That's where you come in.

Do you have a protocol or contract you interact with frequently that you'd like to see detailed, concise interpretations for? Have you deployed your own contract that deserves recognition by evm-translator? Contribute to evm-translator!

<br></br>

## How to contribute

You don't need to be an advanced web3 software developer to contribute a contract interpretation to evm-translator. Note that Part 1 sets up a local environment for testing your new contract interpretations. This part is optional but highly encouraged if you are comfortable with the set up. Here's how it's done...

### Part 1: Set up a local testing environment (recommended)

1.  **Clone and link the repos by following [these steps](https://github.com/metagame-xyz/evm-translator-demo/blob/main/README.md)**

    You MUST follow the above steps to `yarn link` the evm-translator repo to evm-translator-demo or else your changes will take effect. Also, make sure you get the necessary API keys and stash them in .env as described.

2.  **Run the package and demo**

    Now, run `yarn dev` within the evm-translator-demo folder in your terminal. In a new terminal tab, run `yarn dev` within the evm-translator folder. Go to localhost:3000/interpret in your browser of choice. Put an example transaction in the first text field, clear the second text field, and select "Get Interpretation". Here is a particularly interesting transaction you could try...0xca8f8c315c8b6c48cee0675677b786d1babe726773829a588efa500b71cbdb65.

    If that worked for you, then you have successfully set up your test environment. Well done! This interface will allow you to live-test example transactions of the contracts you're interpreting.

    <br></br>

### Part 2: Interpret a contract

You made it to the fun part, congrats. Here, I'll walk through an example interpretation of a the Uniswap V2 contract to explain the process.

1. Create a new branch. Please title the branch after the contract you plan to interpret. If you plan on interpreting multiple contracts, please make different branches for each contract. You can create a new branch by typing `git checkout -b {new branch name}` within the evm-translator folder in your terminal.

2. Create a new file within `evm-translator/src/core/contractInterpreters`.

    In this case the name of the file will be `UniswapV2Router02_0x7a25.json`. The general format of this file name should be `{Human-readable but specific contract name}_0x{first 4 chars of contract address}.json`. I was able to find the contract address from [Uniswap's documentation](https://docs.uniswap.org/protocol/V2/reference/smart-contracts/router-02). I can't tell you the address of where your contract is deployed but hopefully you can figure that out.

    Note that sometimes, your contract can have a single interpretation but be deployed in multiple places (see [an example of this](https://compound.finance/docs#guides)). In this case, don't worry about the underscore and everything after it. We will cover how to handle this in a minute.

3. Grab a contract interpretation template.

    Go to https://evm-translator-demo.themetagame.xyz/templateGenerator and input your contract address into the text field. Select "Get Template". Once the JSON loads and appears on the screen, select "Download JSON file". Then, copy the contents of the JSON file into the new file you just created.

4. Customize your JSON file.

    Allow me to walk through this JSON file, as it will be the basis for your contract interpretation. See [the complete UniswapV2Router02_0x7a25.json file](https://github.com/metagame-xyz/evm-translator/blob/main/src/core/contractInterpreters/UniswapV2Router02_0x7a25.json) as reference.

    - **contractAddress**: the address of the contract you're interpreting. If your interpretation applies to multiple contract addresses, feel free to leave off this field.
    - **contractOfficialName**: A specific but still readable name for the contract(s) you're interpreting.
    - **contractName**: A highly readable name for the contract(s) you're interpreting. This name can appear in the `exampleDescription` field of the interpretation so choose it wisely.

    - **writeFunctions**: this is the meat of your interpretation. You dEach key/value pair is a contract method name that corresponds to another object. This inner object has the following fields...

        - (required!) **action**: A very short (1-2 words ideally) description of what the user _did_ in the transaction. This should include a past tense verb. See the `Action` enum from [this file](https://github.com/metagame-xyz/evm-translator/blob/main/src/interfaces/interpreted.ts) for a bunch of action names. If at all possible, pick an action from this enum.

            Some actions will depend on the perspective of the user, like an NFT sale. One user "bought" and the other "sold". If your action is an NFT sale, use the special `"__NFTSALE__"` action that will resolve to either "bought" or "sold" depending on the user's address.

        - (optional--can leave as empty string) **exampleDescriptionTemplate**: Creates a human readable one-sentence description of the transaction. You can use variables in this description by wrapping their names in curly braces. I will cover how to create your variables in the "Filtering for keywords" section, but here are the ones that you can use with no extra setup...

            - {userName}: The ENS (or address if no ENS is present) of the user interacting with the contract
            - {contractName}: The value of the `contractName` field from above
            - {action}: The value of the `action` field from above
            - {userAddress} (userName is recommended): The address of the user interacting with the contract
            - {\_\_NATIVEVALUETRANSFERRED\_\_}: The amount of ETH transferred in a NFT sale.

    - (optional--can leave as empty string) **exampleDescription**: Just like `exampleDescriptionTemplate` but with example values plugged in for the variables.
    - (optional--can leave as empty object) **keywords**: An object with each key being a variable name that can be used by `exampleDescriptionTemplate` and each value being "instructions" on how to isolate the variable's value from the transaction's event logs. See "Filtering for keywords" for details.

    Note: the optional fields work together to generate the human-readable `exampleDescription` field for the transaction interpretation. Although this is cool, it is not required to complete the contract interpretation. The `action` field, on the other hand, is critical.
    <br><br>
    **Gathering your contract's methods**

    We recommend using [Bloxy.info](https://bloxy.info/) to identify your contract's methods. Enter the contract address in the search box, press "enter", and then scroll down to the "Smart Contract Function Calls" section. Here, you can see all of the contract's methods in order of popularity––a feature [Etherscan.io](etherscan.io) does not have.

    Note that some methods are only called internally and do not need to be included in the `writeFunctions` object. Cross reference this list with your contract's documentation or source code to get a full understanding of which methods users interact with directly.

    You can also select the number under "Calls Count" to get examples of transactions with this method. At this point, we encourage you to copy the transaction hash into [Etherscan.io](etherscan.io) to get a better understanding of what is happening in a given transaction.
    <br><br>
    **Dealing with "multicall" methods**

    Some contracts use methods like "multicall", which bundle multiple method calls into one. If your contract does this, have no fear! Simply use `"executed multiple actions"` for your `action` field and don't worry about `keywords`. Your `exampleDescriptionTemplate` could be something like `"{userAddress} {action} on {contractName}"` if you choose to fill this field.

    Make sure you implement all the important methods within `writeFunctions` that the multicall method could call. You can analyze the trace calls of a multicall transaction on [Bloxy.info](bloxy.info) in the "Execution trace" section. Only concern yourself with the first level of idented method calls.

    Then, navigate to `evm-translator/src/utils/constants.ts`. Add the name of your multicall-style method to `multicallFunctionNames` if it does not already exist in that array. Add your contract address to `multicallContractAddresses`.

    When you test it, the final interpretation should have an `actions` field with an array of all the "sub-actions" that the multicall method initiates.
    <br><br>
    (optional) **Filtering for keywords**

    First, find an example transaction calling the specific method you're working on. You can do this by browsing your contract's transactions on [Etherscan.io](etherscan.io) (avoid pending txs) or by using [Bloxy.info](bloxy.info) (see above).

    Then, enter the transaction hash into etherscan and navigate into the "Logs" section. Here, you can see all the pieces of data you can plug into your `exampleDescriptionTemplate`. If you see something you want, note information about the event it comes from that you can use to filter for the event.

    Each key within the `writeFunctions.[methodName].keywords` object should match a bracketed variable within `writeFunctions.[methodName].exampleDescriptionTemplate`. The values of the `keywords` object will be another object with the following keys...

    - **key**: The name of the field from the event. For example, if you want the value of a Transfer, this would likely be "value" or "amount". If you want an ERC20 token's symbol, use your filters to isolate an event emitted from the address of the token's contract, and use `"key": "contractSymbol"`. See the Uniswap interpretation for an example of this.
    - **filters**: An object with each key/value pair being a criteria that the event must meet to be used to populate the keyword's value. For example, if you want to get the value of a Transfer from the user's address to someone else, you could use something like `"eventName": "Transfer"`, `"from": "{userAddress}"` for filters.
    - **index**: Sometimes you must manually specify the event's position you want to isolate when you cannot isolate it with your filters. Defaults to 0. See the `removeLiquidityWithPermit` method within the Uniswap interpretation for an example of how this field is used (example tx: 0xe1147990da44812918868c75c795ae91592a59277692e9050f7e5ab89dc143da).
      <br><br>

5. Enter the interpretation into the main directory.

    Go to `evm-translator/src/core/contractInterpreters/index.ts`. Add a new entry in the `contractInterpreters` object with the key being the contract's address and the value being `require('./{name of your JSON file})`. If you are using the same JSON interpreation file for multiple contract addresses, you can add multiple entries all with the same value.
    <br><br><br>

### Part 3: Test it

1.  (optional) Test it yourself!

    If you followed Part 1 and set up a testing environment, you can do this next part. If not, you're going to have to submit your interpretation blind.

    Make sure that both evm-translator and evm-translator-demo are running by typing `yarn dev` into terminal tabs within those folders. Go to localhost:3000 and type in various example transactions from your contract. Make sure you test all methods. You can find example transactions from [etherscan.io](etherscan.io) or Bloxy.info as described above.

    Make sure that the interpretation looks good to you. If you implemented the `exampleDescriptionTemplate` and field, check that, but if not, don't worry about it. The first object in the JSON that appears on the screen is the interpretation and is the only part that you have control over. Pay special attention to the `actions` field.

2.  Let posterity test it!

    Do this step regardless if you followed Part 1 or not.

    Go to `evm-translator/src/__tests__/testTxHashes.ts`. This file contains a repository of transaction hashes with accurate interpretations that must be maintained as we continue to make changes to evm-translator. Before each PR merge, we automatically run these tests to ensure that new changes did not corrupt previously accurate interpretations.

    Add a new entry into the `testTxHashes` object with the key being a human readable name for your contract and the value being a bunch of example transaction hashes using all the methods of the contract. See prior entries as an example. Everything other than the transaction hashes are solely for human readability but please still use care when filling out contract and method names.

    If you implemented a method that has different interpretations depending on the perspective of the user, such as an NFT sale, add an entry to the `multiSidedTxMap` object. The key should be an example multi-sided transaction and the value should be an array of the different addresses that should be tested.
    <br><br><br>

### Part 4: Submit your interpretation

1. Add, commit, and push your changes to your branch. See [this tutorial](https://www.earthdatascience.org/workshops/intro-version-control-git/basic-git-commands/) if you don't know how.

2. Open an pull request. See [this tutorial](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request) if you don't know how.

    Please spend time detailing your proposed interpretation using the title and description of the PR. The only files that you should have edited are your own JSON file, `contractInterpreters/index.ts`, `__tests__/testTxHashes.ts`, and maybe `utils/constants.ts` if you have a multicall method. **We will not accept proposals that edit aditional files**

3. Check tests in GitHub actions

    Right after you opened the PR, a GitHub action started up to make sure everything is kosher with your interpretation. You can see the actions [here](https://github.com/metagame-xyz/evm-translator/actions). If your action succeeds, you're all good! We will review the PR and merge it if meets our standards. Thank you for your contribution!

    If your action fails, examine the error by clicking into it and then fix it. The test will automatically rerun when you push to a branch with an open PR. If you believe the failure isn't your fault, please open an issue on GitHub.
