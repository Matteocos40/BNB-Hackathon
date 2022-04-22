
import { Token } from "../Deposit"
import { formatUnits } from "@ethersproject/units"
import { PoolBalanceMsg } from "../PoolBalanceMsg"
import { useEthers, useTokenBalance, useCall } from "@usedapp/core"
import LendingPool from "../../chain-info/contracts/LendingPool.json"
import { utils, BigNumber, constants } from "ethers"
import networkMapping from "../../chain-info/deployments/map.json"
import { makeStyles } from "@material-ui/core"
import { Contract } from "@ethersproject/contracts"
import { UserBalanceMsgUSD } from "../UserBalanceUSD"
import { UserBalanceMsg } from "../UserBalanceMsg"

export interface ContractBalanceProps {
    token: Token
}

const useStyles = makeStyles(theme => ({
    container: {
        display: "inline-grid",
        gridTemplateColumns: "auto auto auto",
        gap: theme.spacing(1),
        alignItems: "center"
    },
    tokenImg: {
        width: "32px"
    },
    value: {
        fontWeight: 700,
        size: 100
    }
}))

export const TokenIdentifiers = ({ token }: ContractBalanceProps) => {
    const classes = useStyles()
    const { image, address, name } = token
    return (
        <div className={classes.container}>
            <img className={classes.tokenImg} src={image} alt="token logo" />{name}
        </div>
    )
}

export const LiquidBalance = ({ token }: ContractBalanceProps) => {
    const { image, address, name } = token
    const classes = useStyles()
    //const { chainId } = useEthers()
    const chainId = 4
    //const tokenBalance = useTokenBalance(address, account)

    const { abi } = LendingPool
    const lendingPoolContractAddress = chainId ? networkMapping[String(chainId)]["LendingPool"][0] : constants.AddressZero

    const lendingPoolInterface = new utils.Interface(abi)

    const { value, error } = useCall(lendingPoolContractAddress && {
        contract: new Contract(lendingPoolContractAddress, lendingPoolInterface),
        method: 'getLiquidity',
        args: [address]
    }) ?? {}
    if (error) {
        console.error(error.message)
        return (<div>LIQ ERROR</div>)
    }
    //console.log(value?.[0])
    const formattedLiquidBalance = value?.[0] ? parseFloat(formatUnits(value?.[0], 18)) : 0
    return (<div className={classes.value}>
        {formattedLiquidBalance.toFixed(2)}
    </div>)
}


// const formattedLiquidBalance: number = liquidTokenBalance ? parseFloat(formatUnits(liquidTokenBalance, 18)) : 0


export const BorrowBalance = ({ token }: ContractBalanceProps) => {
    const { image, address, name } = token
    //const { account } = useEthers()
    //const { chainId } = useEthers()
    const classes = useStyles()
    //const tokenBalance = useTokenBalance(address, account)
    const chainId = 4

    const { abi } = LendingPool
    const lendingPoolContractAddress = chainId ? networkMapping[String(chainId)]["LendingPool"][0] : constants.AddressZero

    const lendingPoolInterface = new utils.Interface(abi)

    const { value, error } = useCall(lendingPoolContractAddress && {
        contract: new Contract(lendingPoolContractAddress, lendingPoolInterface),
        method: 'getTotalBorrow',
        args: [address]
    }) ?? {}
    if (error) {
        console.error(error.message)
        return (<div>Error in useCall</div>)
    }
    //console.log(value?.[0])
    const formattedBorrowBalance = value?.[0] ? parseFloat(formatUnits(value?.[0], 18)) : 0
    return (<div className={classes.value}>
        {formattedBorrowBalance.toFixed(2)}
    </div>)
}

export const BorrowInterestRate = ({ token }: ContractBalanceProps) => {
    const { image, address, name } = token
    //const { account } = useEthers()
    //const { chainId } = useEthers() 4 for rinkeby
    const classes = useStyles()
    //const tokenBalance = useTokenBalance(address, account)
    const chainId = 4

    const { abi } = LendingPool
    const lendingPoolContractAddress = chainId ? networkMapping[String(chainId)]["LendingPool"][0] : constants.AddressZero

    const lendingPoolInterface = new utils.Interface(abi)

    const { value, error } = useCall(lendingPoolContractAddress && {
        contract: new Contract(lendingPoolContractAddress, lendingPoolInterface),
        method: 'getAnnualBorrowInterestRate',
        args: [address]
    }) ?? {}
    if (error) {
        console.error(error.message)
        return (<div>Error in useCall</div>)
    }
    //console.log(value?.[0])
    const formattedInterestRate = value?.[0] ? parseFloat(formatUnits(value?.[0], 18)) : 0
    return (<div className={classes.value}>
        {formattedInterestRate.toFixed(2)}%
    </div>)
}


export const LendInterestRate = ({ token }: ContractBalanceProps) => {
    const { image, address, name } = token
    //const { account } = useEthers()
    //const { chainId } = useEthers() 4 for rinkeby
    const classes = useStyles()
    //const tokenBalance = useTokenBalance(address, account)
    const chainId = 4

    const { abi } = LendingPool
    const lendingPoolContractAddress = chainId ? networkMapping[String(chainId)]["LendingPool"][0] : constants.AddressZero

    const lendingPoolInterface = new utils.Interface(abi)

    //console.log(address)

    const { value, error } = useCall(lendingPoolContractAddress && {
        contract: new Contract(lendingPoolContractAddress, lendingPoolInterface),
        method: 'getAnnualLendInterestRate',
        args: [address]
    }) ?? {}
    if (error) {
        console.error(error.message)
        //return (<div>LEND IR</div>)
    }
    //console.log(value?.[0])
    const formattedInterestRate = value?.[0] ? parseFloat(formatUnits(value?.[0], 18)) : 0
    const APY = ((1 + (.9 * formattedInterestRate / 365)) ** (365) - 1) * 100
    return (<div className={classes.value}>
        {APY.toFixed(2)}%
    </div>)
}


export const TotalValue = () => {

    //const { account } = useEthers()
    //const { chainId } = useEthers() 4 for rinkeby
    const classes = useStyles()
    //const tokenBalance = useTokenBalance(address, account)
    const chainId = 4

    const { abi } = LendingPool
    const lendingPoolContractAddress = chainId ? networkMapping[String(chainId)]["LendingPool"][0] : constants.AddressZero

    const lendingPoolInterface = new utils.Interface(abi)

    const { value, error } = useCall(lendingPoolContractAddress && {
        contract: new Contract(lendingPoolContractAddress, lendingPoolInterface),
        method: 'getPoolValue',
        args: []
    }) ?? {}
    if (error) {
        console.error(error.message)
        return (<div>Error in useCall</div>)
    }
    //console.log(value?.[0])
    const formattedPoolValue = value?.[0] ? parseFloat(formatUnits(value?.[0], 18)) : 0
    return (<div className={classes.container}>
        ${formattedPoolValue.toFixed(2)}
    </div>)
}


export const TokenValue = () => {

    //const { account } = useEthers()
    //const { chainId } = useEthers() 4 for rinkeby
    const classes = useStyles()
    //const tokenBalance = useTokenBalance(address, account)
    const chainId = 4

    const { abi } = LendingPool
    const lendingPoolContractAddress = chainId ? networkMapping[String(chainId)]["LendingPool"][0] : constants.AddressZero

    const lendingPoolInterface = new utils.Interface(abi)

    const { value, error } = useCall(lendingPoolContractAddress && {
        contract: new Contract(lendingPoolContractAddress, lendingPoolInterface),
        method: 'getTokenDollarValue',
        args: []
    }) ?? {}
    if (error) {
        console.error(error.message)
        return (<div>Supply is 0</div>)
    }
    //console.log(value?.[0])
    const formattedTokenValue = value?.[0] ? parseFloat(formatUnits(value?.[0], 18)) : 0
    return (<div className={classes.container}>
        ${formattedTokenValue.toFixed(2)}
    </div>)
}


export const UserTokens = () => {
    //const { account } = useEthers()
    const { chainId, account } = useEthers() //4 for rinkeby
    const classes = useStyles()
    //const tokenBalance = useTokenBalance(address, account)
    //const chainId = 4

    const { abi } = LendingPool
    const lendingPoolContractAddress = chainId ? networkMapping[String(chainId)]["LendingPool"][0] : constants.AddressZero

    const lendingPoolInterface = new utils.Interface(abi)

    const { value, error } = useCall(lendingPoolContractAddress && {
        contract: new Contract(lendingPoolContractAddress, lendingPoolInterface),
        method: 'getLentAmount',
        args: [account]
    }) ?? {}
    if (error) {
        console.error(error.message)
        return (<div>Error in useCall</div>)
    }
    //console.log(value?.[0])
    const formattedUserTokens = value?.[0] ? parseFloat(formatUnits(value?.[0], 18)) : 0
    return (<div className={classes.container}>
        {formattedUserTokens.toFixed(2)}
    </div>)
}



export const BorrowQuantity = ({ token }: ContractBalanceProps) => {
    const { image, address, name } = token
    const classes = useStyles()
    const { chainId, account } = useEthers() //4 for rinkeby
    //const tokenBalance = useTokenBalance(address, account)

    const { abi } = LendingPool
    const lendingPoolContractAddress = chainId ? networkMapping[String(chainId)]["LendingPool"][0] : constants.AddressZero

    const lendingPoolInterface = new utils.Interface(abi)

    const { value, error } = useCall(lendingPoolContractAddress && {
        contract: new Contract(lendingPoolContractAddress, lendingPoolInterface),
        method: 'getOutstandingLoan',
        args: [account, address]
    }) ?? {}
    if (error) {
        console.error(error.message)
        return (<div>borQty error</div>)
    }
    const formattedBorrowBalance = value?.[0] ? parseFloat(formatUnits(value?.[0], 18)) : 0
    return (<UserBalanceMsg
        label={`Your ${name} Loan Quantity`}
        tokenImgSrc={image}
        amount={formattedBorrowBalance} />)
}

export const CollateralQuantity = ({ token }: ContractBalanceProps) => {
    const { image, address, name } = token
    const classes = useStyles()
    const { chainId, account } = useEthers() //4 for rinkeby
    //const tokenBalance = useTokenBalance(address, account)

    const { abi } = LendingPool
    const lendingPoolContractAddress = chainId ? networkMapping[String(chainId)]["LendingPool"][0] : constants.AddressZero

    const lendingPoolInterface = new utils.Interface(abi)

    const { value, error } = useCall(lendingPoolContractAddress && {
        contract: new Contract(lendingPoolContractAddress, lendingPoolInterface),
        method: 'getUserCollateral',
        args: [account, address]
    }) ?? {}
    if (error) {
        console.error(error.message)
        return (<div>CollQty ERROR</div>)
    }
    const formattedCollateralBalance = value?.[0] ? parseFloat(formatUnits(value?.[0], 18)) : 0
    return (<UserBalanceMsg
        label={`Your ${name} Collateral Quantity`}
        tokenImgSrc={image}
        amount={formattedCollateralBalance} />)
}



export const CollateralValue = () => {
    //const { account } = useEthers()
    const { chainId, account } = useEthers() //4 for rinkeby
    const classes = useStyles()
    //const tokenBalance = useTokenBalance(address, account)
    //const chainId = 4

    const { abi } = LendingPool
    const lendingPoolContractAddress = chainId ? networkMapping[String(chainId)]["LendingPool"][0] : constants.AddressZero

    const lendingPoolInterface = new utils.Interface(abi)

    const { value, error } = useCall(lendingPoolContractAddress && {
        contract: new Contract(lendingPoolContractAddress, lendingPoolInterface),
        method: 'getCollateralValue',
        args: [account]
    }) ?? {}
    if (error) {
        console.error(error.message)
        return (<div>Error in collatVal</div>)
    }
    //console.log(value?.[0])
    const formattedValue = value?.[0] ? parseFloat(formatUnits(value?.[0], 18)) : 0
    return (<UserBalanceMsgUSD
        label="Your Total Collateral Value: $"
        amount={formattedValue} />)
}

export const BorrowValue = () => {
    //const { account } = useEthers()
    const { chainId, account } = useEthers() //4 for rinkeby
    const classes = useStyles()
    //const tokenBalance = useTokenBalance(address, account)
    //const chainId = 4

    const { abi } = LendingPool
    const lendingPoolContractAddress = chainId ? networkMapping[String(chainId)]["LendingPool"][0] : constants.AddressZero

    const lendingPoolInterface = new utils.Interface(abi)

    const { value, error } = useCall(lendingPoolContractAddress && {
        contract: new Contract(lendingPoolContractAddress, lendingPoolInterface),
        method: 'totalValueBorrowed',
        args: [account]
    }) ?? {}
    if (error) {
        console.error(error.message)
        return (<div>Error in borVal</div>)
    }
    //console.log(value?.[0])
    const formattedValue = value?.[0] ? parseFloat(formatUnits(value?.[0], 18)) : 0
    // return (<div className={classes.container}>
    //     {formattedValue.toFixed(2)}
    // </div>)
    return (<UserBalanceMsgUSD
        label="Your Total Loan Value: $"
        amount={formattedValue} />)
}



export const MaxLoan = ({ token }: ContractBalanceProps) => {
    const { image, address, name } = token
    const classes = useStyles()
    const { chainId, account } = useEthers() //4 for rinkeby
    //const tokenBalance = useTokenBalance(address, account)

    const { abi } = LendingPool
    const lendingPoolContractAddress = chainId ? networkMapping[String(chainId)]["LendingPool"][0] : constants.AddressZero

    const lendingPoolInterface = new utils.Interface(abi)

    const { value, error } = useCall(lendingPoolContractAddress && {
        contract: new Contract(lendingPoolContractAddress, lendingPoolInterface),
        method: 'availableAssetLoan',
        args: [address, account]
    }) ?? {}
    if (error) {
        console.error(error.message)
        return (<div>loan max ERROR</div>)
    }
    //console.log(value?.[0])

    const formattedValue = value?.[0] ? parseFloat(formatUnits(value?.[0], 18)) : 0
    //console.log(formattedValue)
    return (<UserBalanceMsg
        label={`Your Maximum Available ${name} Loan Quantity`}
        tokenImgSrc={image}
        amount={formattedValue} />)
}


export const OutstandingLoan = ({ token }: ContractBalanceProps) => {
    const { image, address, name } = token
    const classes = useStyles()
    const { chainId, account } = useEthers() //4 for rinkeby
    //const tokenBalance = useTokenBalance(address, account)

    const { abi } = LendingPool
    const lendingPoolContractAddress = chainId ? networkMapping[String(chainId)]["LendingPool"][0] : constants.AddressZero

    const lendingPoolInterface = new utils.Interface(abi)

    const { value, error } = useCall(lendingPoolContractAddress && {
        contract: new Contract(lendingPoolContractAddress, lendingPoolInterface),
        method: 'getOutstandingLoan',
        args: [account, address]
    }) ?? {}
    if (error) {
        console.error(error.message)
        return (<div>loan max ERROR</div>)
    }
    //console.log(value?.[0])

    const formattedValue = value?.[0] ? parseFloat(formatUnits(value?.[0], 18)) : 0
    //console.log(formattedValue)
    return (<UserBalanceMsg
        label={`Your Current ${name} Loan Quantity`}
        tokenImgSrc={image}
        amount={formattedValue} />)
}

export const OutstandingLoanUSD = () => {
    //const { account } = useEthers()
    const { chainId, account } = useEthers() //4 for rinkeby
    const classes = useStyles()
    //const tokenBalance = useTokenBalance(address, account)
    //const chainId = 4

    const { abi } = LendingPool
    const lendingPoolContractAddress = chainId ? networkMapping[String(chainId)]["LendingPool"][0] : constants.AddressZero

    const lendingPoolInterface = new utils.Interface(abi)

    const { value, error } = useCall(lendingPoolContractAddress && {
        contract: new Contract(lendingPoolContractAddress, lendingPoolInterface),
        method: 'totalValueBorrowed',
        args: [account]
    }) ?? {}
    if (error) {
        console.error(error.message)
        return (<div>Error in collatVal</div>)
    }
    //console.log(value?.[0])
    const formattedValue = value?.[0] ? parseFloat(formatUnits(value?.[0], 18)) : 0
    return (<UserBalanceMsgUSD
        label="Your Total Loan Value: $"
        amount={formattedValue} />)
}