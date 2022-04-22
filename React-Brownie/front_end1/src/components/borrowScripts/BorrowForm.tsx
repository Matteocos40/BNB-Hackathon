import React, { useState, useEffect } from "react"
import {
    Button,
    CircularProgress,
    Snackbar,
    makeStyles, Input,
} from "@material-ui/core"
import { Token } from "../Redeem"
import { useBorrow, useDepositCollateral } from "../../hooks/useBorrowFunction"
import { UserTokenBalance } from "../../hooks/LVRBalance"
import Alert from "@material-ui/lab/Alert"
import { formatUnits } from "@ethersproject/units"
import { useEthers, useTokenBalance, useNotifications } from "@usedapp/core"
// import {UserTokens} from "../contractValues/contractBalance"
import { utils } from "ethers"
export interface DepositCollateralFormProps {
    token: Token
}

/**
 * 2 function: 1 for collat, on for borrow
 * 
 * deposit collat using borrow function 
 * 
 * 
 * CREATE A HOOK TO USE BORROW FUNCTION, then use that here
 * You can borrow up to (number of dai based on sclaed collat minus current loan converted to)
 */


const useStyles = makeStyles((theme) => ({
    contentContainer: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: theme.spacing(2),
    },
    container: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: theme.spacing(2),
        width: "100%",
    },
    slider: {
        width: "100%",
        maxWidth: "400px",
    },
}))


export const DepositCollateral = ({ token }: DepositCollateralFormProps) => {
    const { address: tokenAddress, name } = token
    const { account } = useEthers()

    const { notifications } = useNotifications()

    const [amount, setAmount] = useState<number | string | Array<number | string>>(0)
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newAmount = event.target.value === "" ? "" : Number(event.target.value)
        setAmount(newAmount)
        // console.log(newAmount)
    }

    const { approveAndDeposit, state: approveAndDepositErc20State } = useDepositCollateral(tokenAddress)
    const handleDepositSubmit = () => {
        const amountAsWei = utils.parseEther(amount.toString())
        return approveAndDeposit(amountAsWei.toString())
    }

    const isMining = approveAndDepositErc20State.status === "Mining"
    const [showErc20ApprovalSuccess, setShowErc20ApprovalSuccess] = useState(false)
    const [showDepositTokenSuccess, setShowDepositTokenSuccess] = useState(false)
    const handleCloseSnack = () => {
        setShowErc20ApprovalSuccess(false)
        setShowDepositTokenSuccess(false)
    }

    useEffect(() => {
        if (notifications.filter(
            (notification) =>
                notification.type === "transactionSucceed" &&
                notification.transactionName === "Approve ERC20 transfer").length > 0) {
            setShowErc20ApprovalSuccess(true)
            setShowDepositTokenSuccess(false)
        }
        if (notifications.filter(
            (notification) =>
                notification.type === "transactionSucceed" &&
                notification.transactionName === "Deposit Tokens"
        ).length > 0) {
            setShowErc20ApprovalSuccess(false)
            setShowDepositTokenSuccess(true)
        }
    }, [notifications, showErc20ApprovalSuccess, showDepositTokenSuccess])



    return (
        <>
            <div>
                <Input
                    onChange={handleInputChange} />
                <Button
                    onClick={handleDepositSubmit}
                    color="primary"
                    size="large"
                    disabled={isMining}>
                    {isMining ? <CircularProgress size={26} /> : "Deposit Collateral"}
                </Button>
            </div>
            <Snackbar
                open={showErc20ApprovalSuccess}
                autoHideDuration={5000}
                onClose={handleCloseSnack}
            >
                <Alert onClose={handleCloseSnack} severity="success">
                    ERC-20 token transfer approved! Now approve the 2nd transaction.
                </Alert>
            </Snackbar>
            <Snackbar
                open={showDepositTokenSuccess}
                autoHideDuration={5000}
                onClose={handleCloseSnack}>
                <Alert onClose={handleCloseSnack} severity="success">
                    Tokens Deposited!
                </Alert>
            </Snackbar>
        </>
    )
}




export interface BorrowTokensFormProps {
    token: Token
}





export const BorrowTokens = ({ token }: BorrowTokensFormProps) => {
    const { image, address: tokenAddress, name } = token

    const { notifications } = useNotifications()

    const balance = UserTokenBalance()

    const formattedBalance: number = balance
        ? parseFloat(formatUnits(balance, 18))
        : 0

    const { send: borrowTokensSend, state: borrowTokensState } =
        useBorrow()

    const handleBorrowSubmit = () => {
        //console.log(amount.toString())
        const amountAsWei = utils.parseEther(amount.toString())
        //console.log(tokenAddress, amountAsWei)
        return borrowTokensSend(amountAsWei, tokenAddress, 0, tokenAddress) //depositing 0 collateral but still need address?
    }
    const [amount, setAmount] = useState<number | string | Array<number | string>>(0)
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newAmount = event.target.value === "" ? "" : Number(event.target.value)
        setAmount(newAmount)
        // console.log(newAmount)
    }


    const [showBorrowSuccess, setShowBorrowSuccess] = useState(false)

    const handleCloseSnack = () => {
        showBorrowSuccess && setShowBorrowSuccess(false)
    }


    useEffect(() => {
        if (
            notifications.filter(
                (notification) =>
                    notification.type === "transactionSucceed" &&
                    notification.transactionName === "Borrow tokens"
            ).length > 0
        ) {
            !showBorrowSuccess && setShowBorrowSuccess(true)
        }
    }, [notifications, showBorrowSuccess])

    const isMining = borrowTokensState.status === "Mining"
    const hasZeroBalance = formattedBalance === 0
    const hasZeroAmountSelected = parseFloat(amount.toString()) === 0


    const classes = useStyles()

    return (
        <>
            <div className={classes.container}>
                <Input
                    onChange={handleInputChange} />
                <Button
                    onClick={handleBorrowSubmit}
                    color="primary"
                    size="large"
                    disabled={isMining}>
                    {isMining ? <CircularProgress size={26} /> : "Borrow"}
                </Button>
            </div>
            <Snackbar
                open={showBorrowSuccess}
                autoHideDuration={5000}
                onClose={handleCloseSnack}
            >
                <Alert onClose={handleCloseSnack} severity="success">
                    Tokens Sent!
                </Alert>
            </Snackbar>
        </>
    )
}