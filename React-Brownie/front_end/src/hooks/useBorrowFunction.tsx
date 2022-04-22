


import { useEffect, useState } from "react"
import { useEthers, useContractFunction, useCall } from "@usedapp/core"
import { constants, utils } from "ethers"
import LendingPool from "../chain-info/contracts/LendingPool.json"
import ERC20 from "../chain-info/contracts/dependencies/OpenZeppelin/openzeppelin-contracts@4.4.2/ERC20.json"
import { Contract } from "@ethersproject/contracts"
import networkMapping from "../chain-info/deployments/map.json"

export const useDepositCollateral = (tokenAddress: string) => {
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


    const { value, error } = useCall(LendingPoolAddress && {
        contract: new Contract(LendingPoolAddress, LendingPoolInterface),
        method: 'getCollAddr',
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
    const { send: approveErc20Send, state: approveAndDepositErc20State } =
        useContractFunction(erc20Contract, "approve", {
            transactionName: "Approve ERC20 transfer",
        })
    //console.log(LendingPoolAddress)
    const approveAndDeposit = (amount: string) => {
        setAmountToDeposit(amount)
        return approveErc20Send(value?.[0], amount)
    }
    //console.log(approveErc20Send)

    // collateral
    const { send: collateralSend, state: collateralState } =
        useContractFunction(LendingPoolContract, "Borrow", {
            transactionName: "Deposit Collateral",
        })
    const [amountToDeposit, setAmountToDeposit] = useState("0")

    //console.log(amountToDeposit)
    //useEffect
    useEffect(() => {
        if (approveAndDepositErc20State.status === "Success") {
            //console.log(amountToDeposit, tokenAddress, 0, tokenAddress)
            collateralSend(0, tokenAddress, amountToDeposit, tokenAddress)
        }
    }, [approveAndDepositErc20State, amountToDeposit, tokenAddress])

    //console.log(approveAndDepositErc20State, amountToDeposit, tokenAddress)

    const [state, setState] = useState(approveAndDepositErc20State)

    useEffect(() => {
        if (approveAndDepositErc20State.status === "Success") {
            setState(collateralState)
        } else {
            setState(approveAndDepositErc20State)
        }
    }, [approveAndDepositErc20State, collateralState])
    //console.log(approveAndDepositErc20State, collateralState)

    //console.log(approveAndDeposit, state)


    return { approveAndDeposit, state }
}


/**
 */
export const useBorrow = () => {
    const { chainId } = useEthers()

    const { abi } = LendingPool
    const LendingPoolContractAddress = chainId ? networkMapping[String(chainId)]["LendingPool"][0] : constants.AddressZero

    const LendingPoolInterface = new utils.Interface(abi)

    const LendingPoolContract = new Contract(
        LendingPoolContractAddress,
        LendingPoolInterface
    )

    return useContractFunction(LendingPoolContract, "Borrow", {
        transactionName: "Borrow tokens",
    })
}
