# Contributing contract interpretations to evm-translator

## What we need from you

If you're here, you likely understand the power and potential of evm-translator to create human readable interpretations of ethereum transactions. We have the infrastructure in place to elegantly interpret transactions from nearly every contract deployed to the chain. However, **we still need lots of contract-specific interpretations** to improve our coverage and close our blind spots. That's where you come in.

We've set up a [Wonder bounty board](https://app.wonderverse.xyz/organization/Metagame/boards) with ~$5k USDC of bounties across 50+ contracts waiting to be interpreted.

Note: Once you've claimed a task, you'll have 24 hours to submit your work for it. This makes sure other folks have a chance to claim and do the task if it's not an immediate priority for you.

Do you have a protocol or contract you interact with frequently that you'd like to see detailed, concise interpretations for? Have you deployed your own contract that deserves recognition by evm-translator? Contribute to evm-translator!

<br>

# How to contribute

You don't need to be an advanced web3 software developer to contribute a contract interpretation to evm-translator.

Coming soon: Contributing via our interface + Wonder only (no command line or Github required)
<!--
At the end, you will submit 3 files with your Wonder Task:
1. The Interpreter Map in JSON format (into a .json file)
2. a list of tx hashes, 1 per function you interpreted. These will be added to our test suite
3. An example of each function's interpreted output in JSON format. These can all be in 1 file. (into a .json file)

### Instructions
1. pick a contract from Wonder's dashboard (we suggest starting with an easy one)
1. go to https://evm-translator-demo.themetagame.xyz/
1. enter in the contract address
1. click "generate template"
1. take note of the writeFunctions in the template
1. In a new tab, go to https://bloxy.info. Search for the contract's address
1. For each of the write functions, click on the link in the "Smart Contract Function Calls" section in the "Calls Count" column
1. Click on one of the hashes in the "Tx Hash" column. You can now copy and paste the tx hash to Etherscan to get a better idea of what happens in the tx.
1. Go back to the evm-translator demo site, and paste the tx hash in.
1. Click "interpret". This will use the interpreter map that's been generated to interpret the tx hash you just pasted in.
1. Update the interpreter map so the interpretation makes sense for this transaction
1. note down the txHash and the interpretation output
1. repeat steps 7-12 for each function
1. Once you're done with the whole interpreter map, copy and paste it into a .json file
1. Submit the 3 files to your Wonder Task!
 -->

## Contributing via Github PR

## Part 1: Set up a local testing environment

1. **Clone and link the repos by following [these steps](https://github.com/metagame-xyz/evm-translator-demo/blob/main/README.md)**

    You MUST follow the above steps to `yarn link` the evm-translator repo to evm-translator-demo or else your changes will take effect. Also, make sure you get the necessary API keys and stash them in .env as described.

2. **Run the package and demo**

    Now, run `yarn dev` within the evm-translator-demo folder in your terminal. In a new terminal tab, run `yarn dev` within the evm-translator folder. Go to localhost:3000/interpret in your browser of choice. Put an example transaction in the first text field, clear the second text field, and select "Get Interpretation". Here is a particularly interesting transaction you could try...`0xca8f8c315c8b6c48cee0675677b786d1babe726773829a588efa500b71cbdb65`.

    If that worked for you, then you have successfully set up your test environment. Well done! This interface will allow you to live-test example transactions of the contracts you're interpreting.

    <br>

## Part 2: Interpret a contract

You made it to the fun part, congrats. Here, I'll walk through an example interpretation of a the Uniswap V2 contract to explain the process.

1.  **Create a new branch**

    Please title the branch after the contract you plan to interpret. If you plan on interpreting multiple contracts, please make different branches for each contract. You can create a new branch by typing `git checkout -b {your-name/contract-name}` within the evm-translator folder in your terminal.

2.  **Grab a contract interpretation template.**

    Go to https://evm-translator-demo.themetagame.xyz/templateGenerator and input your contract address into the text field. Select "Get Template". Once the JSON loads and appears on the screen, select "Download JSON file". Then, move this file within the `evm-translator/src/core/contractInterpreters`.

    Note that sometimes, your contract can have a single interpretation but be deployed in multiple places (see [an example of this](https://compound.finance/docs#guides)). In this case, you can rename the JSON file to remove the underscore and everything after it. We will cover how to handle this case in a minute.

3.  **Customize your JSON file.**

    First, let's walk through the structure of this JSON file, as it will be the basis for your contract interpretation. See [the complete UniswapV2Router02_0x7a25.json file](https://github.com/metagame-xyz/evm-translator/blob/main/src/core/contractInterpreters/UniswapV2Router02_0x7a25.json) as reference.

    ```json
    {
        "contractAddress": "0x7a250d5630b4cf539739df2c5dacb4c659f2488d",
        "contractOfficialName": "UniswapV2Router02",
        "contractName": "Uniswap V2",
        "entityName": "Uniswap",
        "writeFunctions": {
            "addedLiquidity": {
                "action": "added liquidity",
                ...
            }
        }
    }
    ```

    -   **contractAddress**: the address of the contract you're interpreting. If your interpretation applies to multiple contract addresses, feel free to leave off this field.
    -   **contractOfficialName**: A specific but still readable name for the contract(s) you're interpreting.
    -   **contractName**: A highly readable name for the contract(s) you're interpreting. This name can appear in the `exampleDescription` field of the interpretation so choose it wisely.
    -   **entityName**: The name of the entity associated with the contract

    -   **writeFunctions**: this is the meat of your interpretation. Each entry has a key which is the method name and a value which is an inner object with the following fields...

        -   (required!) **action**: A very short (1-2 words ideally) description of what the user _did_ in the transaction. This should include a past tense verb. See the `Action` enum from [this file](https://github.com/metagame-xyz/evm-translator/blob/main/src/interfaces/interpreted.ts) for a bunch of action names. If at all possible, pick an action from this enum.

            Some actions will depend on the perspective of the user, like an NFT sale. One user "bought" and the other "sold". If your action is an NFT sale, use the special `"__NFTSALE__"` action that will resolve to either "bought" or "sold" depending on the user's address.

        -   There are a few other optional fields that will be detailed in step 4.

                <br>

    **Gathering your contract's methods**

    We recommend using [Bloxy.info](https://bloxy.info/) to identify your contract's methods. Enter the contract address in the search box, press "enter", and then scroll down to the "Smart Contract Function Calls" section. Here, you can see all of the contract's methods in order of popularity––a feature [Etherscan.io](etherscan.io) does not have.

    Note that some methods are only called internally and do not need to be included in the `writeFunctions` object. Cross reference this list with your contract's documentation or source code to get a full understanding of which methods users interact with directly.

    You can also select the number under "Calls Count" to get examples of transactions with this method. At this point, we encourage you to copy the transaction hash into [Etherscan.io](etherscan.io) to get a better understanding of what is happening in a given transaction.
    <br><br>

    **Dealing with "multicall" methods**

    Some contracts use methods like "multicall", which bundle multiple method calls into one. If your contract does this, have no fear! Simply use `"executed multiple actions"` for your `action` field. Here is an example from `UniswapV3NonFungiblePositionManager.json`...

    ```
    "multicall": {
        "action": "executed multiple actions",
        "exampleDescriptionTemplate": "{userAddress} {action} on {contractName}",
        "exampleDescription": "leotheprocess.eth executed multiple actions on Uniswap V3",
        "keywords": {}
    }
    ```

    Make sure you implement all the important methods within `writeFunctions` that the multicall method could call. You can analyze the trace method calls of a multicall transaction on [Bloxy.info](bloxy.info) in the "Execution trace" section. Only concern yourself with the first level of idented method calls.

    Lastly, navigate to `evm-translator/src/utils/constants.ts`. Add the name of your multicall-style method to `multicallFunctionNames` if it does not already exist in that array. Add your contract address to `multicallContractAddresses`.

    When you test it, the final interpretation should have an `actions` field with an array of all the "sub-actions" that the multicall method initiates.
    <br><br>

4.  **Filtering for keywords**

    If you'd prefer to skip this step, add the following blank fields to each of the `writeFunctions.[methodName]` objects...

    ```
    "exampleDescriptionTemplate": "",
    "exampleDescription": "",
    "keywords": {}
    ```

    This step involves generating the `"exampleDescription"` field for the interpretation, which is a one-sentence, human-readable description of the transaction. Although this is cool, it is not required to complete the contract interpretation.

    If you're game to tackle this challenge then let's get into it...

    First, let's examine how this would be done for Uniswap V2's `swapExactTokensForTokens` method. This method is called when a Uniswap user wants to swap one non-ETH token for another non-ETH token.

    ```
    "exampleDescriptionTemplate": "{userName} {action} {tokenAmount0} {tokenName0} for {tokenAmount1} {tokenName1} on {contractName}",
    "exampleDescription": "leotheprocess.eth swapped 246 DAI for 247 USDC on Uniswap V2",
    "keywords": {
        "tokenName0": {
            "key": "contractSymbol",
            "filters": {
                "eventName": "Transfer",
                "from": "{userAddress}"
            },
            "defaultValue": "an unknown token"
        },
        "tokenAmount0": {
            "key": "value",
            "filters": {
                "eventName": "Transfer",
                "from": "{userAddress}"
            },
            "defaultValue": "an unknown amount"
        },
        "tokenName1": {
            "key": "contractSymbol",
            "filters": {
                "eventName": "Transfer",
                "to": "{userAddress}"
            },
            "defaultValue": "an unknown token"
        },
        "tokenAmount1": {
            "key": "value",
            "filters": {
                "eventName": "Transfer",
                "to": "{userAddress}"
            },
            "defaultValue": "an unknown amount"
        }
    }
    ```

    Let's walk through these fields and what they mean.

    -   **exampleDescriptionTemplate**: Creates a human readable one-sentence description of the transaction. You can use variables in this description by wrapping their names in curly braces. I will cover how to create your variables in the "keywords" section, but here are the ones that you can use with no extra setup...

        -   **{userName}**: The ENS (or address if no ENS is present) of the user interacting with the contract
        -   **{contractName}**: The value of the `contractName` field from above
        -   **{action}**: The value of the `action` field from above
        -   **{userAddress} (userName is recommended)**: The address of the user interacting with the contract
        -   **{\_\_NATIVEVALUETRANSFERRED\_\_}**: The amount of ETH transferred in a NFT sale.

    -   **exampleDescription**: Just like `exampleDescriptionTemplate` but with example values plugged in for the variables.
    -   **keywords**: An object with each key that matches a variable wrapped in curly braces from`exampleDescriptionTemplate` and each value being an object with "instructions" on how to isolate the variable's value from the transaction's event logs. This inner object has the following keys...

        -   **key**: The name of the field from the event. For example, if you want the value of a Transfer, this would likely be "value" or "amount". If you want an ERC20 token's symbol, use your filters to isolate an event emitted from the address of the token's contract, and use `"key": "contractSymbol"`. See the Uniswap interpretation for an example of this.
        -   **filters**: An object with each key/value pair being a criteria that the event must meet to be used to populate the keyword's value. For example, if you want to get the value of a Transfer from the user's address to someone else, you could use something like `"eventName": "Transfer"`, `"from": "{userAddress}"` for filters.
        -   **index**: Sometimes you must manually specify the event's position you want to isolate when you cannot isolate it with your filters. Defaults to 0. See the `removeLiquidityWithPermit` method within the Uniswap interpretation for an example of how this field is used (example tx: 0xe1147990da44812918868c75c795ae91592a59277692e9050f7e5ab89dc143da).

        <br><br>

    **How to parse event logs**

    If you skipped "Filtering for keywords", skip this step as well.

    First, find an example transaction calling the specific method you're working on. You can do this by browsing your contract's transactions on [Etherscan.io](etherscan.io) (make sure to avoid pending transactions) or by using [Bloxy.info](bloxy.info) (see above).

    Then, enter the transaction hash into [Etherscan.io](etherscan.io) and navigate into the "Logs" section. Here, you can see all the pieces of data you can include as keywords. Let's look at [an example of a swapExactTokensForTokens transaction](https://etherscan.io/tx/0xb684992cdec31d2eeaf3866be82ddd2a9cfe2211bab96b1aa132d3a9ae50587b#eventlog). In this transaction, user (0x4090) is swapping 900 USDC for 202,899 KINGDOM. The four pieces of information we need are...

    -   Amount of tokens sent
    -   Symbol of tokens sent
    -   Amount of tokens received
    -   Symbol of tokens sent
        <br><br>

    ![Transfer event log ("from")](https://drive.google.com/uc?export=view&id=1G-VS8Y7aWI66lPzwE-XgJCIulNU45j0r)
    ![Transfer event log ("to")](https://drive.google.com/uc?export=view&id=1pxNpSvu26_m5zHfyxV222rS2jvtfnLIv)

    It may not look like it at first, but these two event logs have everything we need. The `value` field from the first event log has the amount of tokens sent. (Don't worry about the extra zeros. We handle those.) The field at index 1 ("from") is the user. Therefore, the keyword object will look like this...

    ```
    "tokenAmount0": {
        "key": "value",
        "filters": {
            "eventName": "Transfer",
            "from": "{userAddress}"
        },
        "defaultValue": "an unknown amount"
    },
    ```

    And we can use `"{tokenAmount0}"` within `exampleDescriptionTemplate`

    The `Address` field from the first event log has the [contract address of the ERC20 token being sent (USDC)](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48). The field at index 2 ("from") is the user. Therefore, the keyword object will look like this...

    ```
    "tokenName0": {
        "key": "contractSymbol",
        "filters": {
            "eventName": "Transfer",
            "to": "{userAddress}"
        },
        "defaultValue": "an unknown amount"
    },
    ```

    The `"contractSymbol"` key takes the contract address that emits the event and gets the symbol of the ERC20 token it represents. We can use `"{tokenName0}"` within `exampleDescriptionTemplate`.

    We can repeat these steps for the tokens being received, except we use `"from"` instead of `"to"`.
    <br><br><br>

5.  **Enter the interpretation into the main directory.**

    Go to `evm-translator/src/core/contractInterpreters/index.ts`. Add a new entry in the `contractInterpreters` object with the key being the contract's address and the value being `require('./{name of your JSON file})`. If you are using the same JSON interpreation file for multiple contract addresses, you can add multiple entries all with the same value.
    <br><br><br>

## Part 3: Test it

1.  **Test it yourself!**

    If you followed Part 1 and set up a testing environment, you can do this next part. If not, you're going to have to submit your interpretation blind.

    Make sure that both evm-translator and evm-translator-demo are running by typing `yarn dev` into terminal tabs within those folders. Go to localhost:3000 and type in various example transactions from your contract. Make sure you test all methods. You can find example transactions from [etherscan.io](etherscan.io) or Bloxy.info as described above.

    Make sure that the interpretation looks good to you. If you implemented the `exampleDescriptionTemplate` and field, check that, but if not, don't worry about it. The first object in the JSON that appears on the screen is the interpretation and is the only part that you have control over. Pay special attention to the `actions` field.

2.  **Let posterity test it!**

    Do this step regardless if you followed Part 1 or not.

    Go to `evm-translator/src/__tests__/testTxHashes.ts`. This file contains a repository of transaction hashes with accurate interpretations that must be maintained as we continue to make changes to evm-translator. Before each PR merge, we automatically run these tests to ensure that new changes did not corrupt previously accurate interpretations.

    Add a new entry into the `testTxHashes` object with the key being a human readable name for your contract and the value being a bunch of example transaction hashes using all the methods of the contract. See prior entries as an example. Everything other than the transaction hashes are solely for human readability but please still use care when filling out contract and method names.

    If you implemented a method that has different interpretations depending on the perspective of the user, such as an NFT sale, add an entry to the `multiSidedTxMap` object. The key should be an example multi-sided transaction and the value should be an array of the different addresses that should be tested.
    <br><br><br>

## Part 4: Submit your interpretation

1. **Add, commit, and push your changes to your branch.**
   See [this tutorial](https://www.earthdatascience.org/workshops/intro-version-control-git/basic-git-commands/) if you don't know how.

2. **Open an pull request.**
   See [this tutorial](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request) if you don't know how.

    Please spend time detailing your proposed interpretation using the title and description of the PR. The only files that you should have edited are your own JSON file, `contractInterpreters/index.ts`, `__tests__/testTxHashes.ts`, and maybe `utils/constants.ts` if you have a multicall method. **We will not accept proposals that edit aditional files**

3. **Check tests in GitHub actions**

    Right after you opened the PR, a GitHub action started up to make sure everything is kosher with your interpretation. You can see the actions [here](https://github.com/metagame-xyz/evm-translator/actions). If your action succeeds, you're all good! We will review the PR and merge it if meets our standards. Thank you for your contribution!

    If your action fails, examine the error by clicking into it and then fix it. The test will automatically rerun when you push to a branch with an open PR. If you believe the failure isn't your fault, please open an issue on GitHub.

<br><br>

## FAQ & Troubleshooting

**My contract interpretation isn't being acknowledged by the interpreter!**

-   Make sure that you have followed part 3 step 5 and added the interpretation to the `contractInterpreters/index.ts` file.
-   Make sure that the transaction you inputting into your local testing console is a transaction from the contract interpreted.
