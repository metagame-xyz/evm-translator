import { Action } from 'interfaces/interpreted'

export type InterpreterMap = {
    /** The address of the contract this map is for */
    contractAddress: string
    /** The official name of the contract as defined in the source code */
    contractOfficialName: string
    /** A sensible name that will explain what this contract is for */
    contractName: string
    /** The entity related to this contract */
    entityName: string
    /** The interpretation for a tx when it is initiated by calling the given write method */
    writeFunctions: Record<string, MethodMap>
}

export type MethodMap = {
    /** The action the tx will be categorized as when this method is the initiator of tx */
    action: Action
    /** The template for the example description using both global keywords and method-specific keywords */
    exampleDescriptionTemplate: string
    /** An example of what the description will look like */
    exampleDescription: string
    /** Keywords to pull out of the decoded events to be used in the example description and stored in the `extra` object of the interpretation */
    keywords: Record<string, KeywordMap>
}

export type KeywordMap = {
    /** The key we're looking for to pull out the value  */
    key: string
    /** Filters to narrow down to the event(s) that will have the key:value we're looking for */
    filters: {
        [key: string]: string
    }
    /** The default value if we cant find a matching event or if the value is null */
    defaultValue: string
    /** If there are multiple events that match the filters, which event in the array to use. The default is 0 */
    index?: number
    /** How many number of places the decimal needs to be moved for human readability. The default is 18 (the standard for ERC20s) */
    decimals?: number
}

export type DeployInterpreterMap = {
    exampleDescriptionTemplate: string
    exampleDescription: string
    keywords: Record<string, KeywordMap>
}
