import { useCall, useEthers } from "@usedapp/core"
import { utils, BigNumber, constants } from "ethers"
import { formatUnits } from "@ethersproject/units"
import LendingPool from "../chain-info/contracts/LendingPool.json"
import networkMapping from "../chain-info/deployments/map.json"
import { Contract } from "@ethersproject/contracts"
import { Token } from "../components/Repay"



// export interface LoanBalanceProps {
//     assetAddress: string
//     userAddress: string
// }

export const CollateralBalance = (assetAddress: string, userAddress: string | null | undefined) => {
    //const { image, address, name } = token

    const { chainId } = useEthers() //4 for rinkeby
    //const tokenBalance = useTokenBalance(address, account)

    const { abi } = LendingPool
    const lendingPoolContractAddress = chainId ? networkMapping[String(chainId)]["LendingPool"][0] : constants.AddressZero

    const lendingPoolInterface = new utils.Interface(abi)

    const { value, error } = useCall(lendingPoolContractAddress && {
        contract: new Contract(lendingPoolContractAddress, lendingPoolInterface),
        method: 'getUserCollateral',
        args: [userAddress, assetAddress]
    }) ?? {}
    if (error) {
        console.error(error.message)
        return (<div>collatBalanceHookERROR</div>)
    }
    //console.log(value?.[0])
    return value?.[0]
    // const formattedValue = value?.[0] ? parseFloat(formatUnits(value?.[0], 18)) : 0
    // //console.log(formattedValue)
    // return formattedValue
}