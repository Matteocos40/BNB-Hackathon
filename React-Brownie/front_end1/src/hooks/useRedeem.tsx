import { useContractFunction, useEthers } from "@usedapp/core"
import LendingPool from "../chain-info/contracts/LendingPool.json"
import { utils, constants } from "ethers"
import { Contract } from "@ethersproject/contracts"
import networkMapping from "../chain-info/deployments/map.json"

/**
 * Expose { send, state } object to facilitate unstaking the user's tokens from the TokenFarm contract
 */
export const useWithdrawTokens = () => {
    const { chainId } = useEthers()

    const { abi } = LendingPool
    const LendingPoolContractAddress = chainId ? networkMapping[String(chainId)]["LendingPool"][0] : constants.AddressZero

    const LendingPoolInterface = new utils.Interface(abi)

    const LendingPoolContract = new Contract(
        LendingPoolContractAddress,
        LendingPoolInterface
    )

    return useContractFunction(LendingPoolContract, "Withdraw", {
        transactionName: "Withdraw tokens",
    })
}