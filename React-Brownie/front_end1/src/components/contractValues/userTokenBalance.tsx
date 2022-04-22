import { Token } from "../Deposit"
import { useEthers, useTokenBalance, useContractCall } from "@usedapp/core"
import { formatUnits } from "@ethersproject/units"
import { PoolBalanceMsg } from "../PoolBalanceMsg"
import LendingPool from "../../chain-info/contracts/LendingPool.json"
import { utils, BigNumber, constants } from "ethers"
import networkMapping from "../../chain-info/deployments/map.json"

export interface UserTokenBalanceProps {
    address: string
}
// here should find how much LVR they have, and i shoudl add function which states how much of an asset they can get with thier LVR
export const UserTokenBalance = (): BigNumber | undefined => {
    const { account, chainId } = useEthers()

    const { abi } = LendingPool
    const lendingPoolContractAddress = chainId ? networkMapping[String(chainId)]["LendingPool"][0] : constants.AddressZero

    const lendingPoolInterface = new utils.Interface(abi)

    const [stakingBalance] =
        useContractCall({
            abi: lendingPoolInterface,
            address: lendingPoolContractAddress,
            method: "getBalanceOf",
            args: [account],
        }) ?? []

    return stakingBalance
}