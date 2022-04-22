import { useCall, useEthers } from "@usedapp/core"
import { utils, BigNumber, constants } from "ethers"
import { formatUnits } from "@ethersproject/units"
import LendingPool from "../chain-info/contracts/LendingPool.json"
import networkMapping from "../chain-info/deployments/map.json"
import { Contract } from "@ethersproject/contracts"

/**
 * Get the staking balance of a certain token by the user in our TokenFarm contract
 * @param address - The contract address of the token
 */
export const UserTokenBalance = (): BigNumber | undefined => {
    const { account, chainId } = useEthers()

    const { abi } = LendingPool
    const lendingPoolContractAddress = chainId ? networkMapping[String(chainId)]["LendingPool"][0] : constants.AddressZero

    const lendingPoolInterface = new utils.Interface(abi)
    //console.log('lvr')
    //console.log(lendingPoolContractAddress)
    const { value, error } = useCall(lendingPoolContractAddress && {
        contract: new Contract(lendingPoolContractAddress, lendingPoolInterface),
        method: 'getLentAmount',
        args: [account]
    }) ?? {}
    if (error) {
        console.error(error.message)
    }

    return value?.[0]
}



