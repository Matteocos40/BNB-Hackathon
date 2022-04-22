import { useEffect, useState } from "react"
import { useEthers, useContractFunction, useCall } from "@usedapp/core"
import { constants, utils } from "ethers"
import LendingPool from "../chain-info/contracts/LendingPool.json"
import ERC20 from "../chain-info/contracts/dependencies/OpenZeppelin/openzeppelin-contracts@4.4.2/ERC20.json"
import { Contract } from "@ethersproject/contracts"
import networkMapping from "../chain-info/deployments/map.json"

export const useRepayTokens = (tokenAddress: string) => {
    // address
    // abi
    // chainId
    const { chainId } = useEthers()
    const { abi } = LendingPool
    const LendingPoolAddress = chainId ? networkMapping[String(chainId)]["LendingPool"][0] : constants.AddressZero
    const LendingPoolInterface = new utils.Interface(abi)
    const LendingPoolContract = new Contract(LendingPoolAddress, LendingPoolInterface)

    const erc20ABI = ERC20.abi
    const erc20Interface = new utils.Interface(erc20ABI)
    const erc20Contract = new Contract(tokenAddress, erc20Interface)

    ///////////////////////////////////////////////////////////////////////////////////////




    //const poolAddress = () => {

    //const { chainId } = useEthers()
    // const chainId = 4
    // //const tokenBalance = useTokenBalance(address, account)

    // const { abi } = LendingPool
    // const lendingPoolContractAddress = chainId ? networkMapping[String(chainId)]["LendingPool"][0] : constants.AddressZero

    // const lendingPoolInterface = new utils.Interface(abi)

    const { value, error } = useCall(LendingPoolAddress && {
        contract: new Contract(LendingPoolAddress, LendingPoolInterface),
        method: 'getPoolAddr',
        args: []
    }) ?? {}
    if (error) {
        console.error(error.message)
    }
    //console.log(value?.[0])
    //const formattedLiquidBalance = value?.[0] ? parseFloat(formatUnits(value?.[0], 18)) : "Connect to a Chain"
    //return value?.[0]
    // (<div className={classes.value}>
    //     {formattedLiquidBalance}
    // </div>)
    //console.log(value?.[0])


    ////////////////////////////////////////////////////////////////////////////////////////

    // approve
    const { send: approveErc20Send, state: approveAndRepayErc20State } =
        useContractFunction(erc20Contract, "approve", {
            transactionName: "Approve ERC20 transfer",
        })
    //console.log(LendingPoolAddress)
    const approveAndRepay = (amountApprove: string, amount: string) => {

        //turn into decimal, multiply by 1.05, return to large number string
        //const formattedValue =amount ? parseFloat(formatUnits(amount, 18)) : 0

        setAmountToRepay(amount)
        return approveErc20Send(value?.[0], amountApprove)
    }
    //console.log(approveErc20Send)

    // deposit
    const { send: depositSend, state: depositState } =
        useContractFunction(LendingPoolContract, "Repay", {
            transactionName: "Repay Tokens",
        })
    const [amountToRepay, setAmountToRepay] = useState("0")

    //console.log(amountToRepay)
    //useEffect
    useEffect(() => {
        if (approveAndRepayErc20State.status === "Success") {
            depositSend(tokenAddress, amountToRepay)
        }
    }, [approveAndRepayErc20State, amountToRepay, tokenAddress])

    //console.log(approveAndRepayErc20State, amountToRepay, tokenAddress)

    const [state, setState] = useState(approveAndRepayErc20State)

    useEffect(() => {
        if (approveAndRepayErc20State.status === "Success") {
            setState(depositState)
        } else {
            setState(approveAndRepayErc20State)
        }
    }, [approveAndRepayErc20State, depositState])
    //console.log(approveAndRepayErc20State, depositState)

    //console.log(approveAndRepay, state)


    return { approveAndRepay, state }
}
