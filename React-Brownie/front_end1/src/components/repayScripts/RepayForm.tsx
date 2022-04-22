import React, { useState, useEffect } from "react"
import { Token } from "../Deposit"
import { useEthers, useTokenBalance, useNotifications } from "@usedapp/core"
import { formatUnits } from "@ethersproject/units"
import {
    Button,
    CircularProgress,
    Snackbar,
    makeStyles,
} from "@material-ui/core"
import Alert from "@material-ui/lab/Alert"
import { useRepayTokens } from "../../hooks/useRepayTokens"
import { utils } from "ethers"
import { OutstandingAssetLoan } from "../../hooks/LoanBalance"
import { SliderInput } from "../../hooks/sliderInput"



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

export interface RepayFormProps {
    token: Token
}

export const RepayForm = ({ token }: RepayFormProps) => {
    const { address: tokenAddress, name } = token
    const { account } = useEthers()

    const { notifications } = useNotifications()

    const [amount, setAmount] = useState<number | string | Array<number | string>>(0)
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newAmount = event.target.value === "" ? "" : Number(event.target.value)
        setAmount(newAmount)
        // console.log(newAmount)
    }


    const { approveAndRepay, state: approveAndRepayErc20State } = useRepayTokens(tokenAddress)
    const handleRepaySubmit = () => {

        const bufferAmount = Number(amount) * 1.05
        const bufferAsWei = utils.parseEther((bufferAmount).toString())
        // console.log(bufferAmount)
        const amountAsWei = utils.parseEther((amount).toString())

        if (amount == formattedBalance) {

            return approveAndRepay(bufferAsWei.toString(), String(1))
        } else {
            // console.log(amount)
            // const bufferAmount = Number(amount) * 1.05
            // const bufferAsWei = utils.parseEther((bufferAmount).toString())
            // // console.log(bufferAmount)
            // const amountAsWei = utils.parseEther((amount).toString())
            return approveAndRepay(bufferAsWei.toString(), amountAsWei.toString())
        }
    }

    const isMining = approveAndRepayErc20State.status === "Mining"
    const [showErc20ApprovalSuccess, setShowErc20ApprovalSuccess] = useState(false)
    const [showRepayTokenSuccess, setShowRepayTokenSuccess] = useState(false)
    const handleCloseSnack = () => {
        setShowErc20ApprovalSuccess(false)
        setShowRepayTokenSuccess(false)
    }

    useEffect(() => {
        if (notifications.filter(
            (notification) =>
                notification.type === "transactionSucceed" &&
                notification.transactionName === "Approve ERC20 transfer").length > 0) {
            setShowErc20ApprovalSuccess(true)
            setShowRepayTokenSuccess(false)
        }
        if (notifications.filter(
            (notification) =>
                notification.type === "transactionSucceed" &&
                notification.transactionName === "Repay Tokens"
        ).length > 0) {
            setShowErc20ApprovalSuccess(false)
            setShowRepayTokenSuccess(true)
        }
    }, [notifications, showErc20ApprovalSuccess, showRepayTokenSuccess])


    const balance = OutstandingAssetLoan(tokenAddress, account)

    const formattedBalance: number = balance
        ? parseFloat(formatUnits(balance, 18))
        : 0

    const hasZeroBalance = formattedBalance === 0
    const hasZeroAmountSelected = parseFloat(amount.toString()) === 0

    const classes = useStyles()


    return (
        <>
            <div className={classes.container}>
                <SliderInput
                    label={`Repay ${name}`}
                    maxValue={formattedBalance}
                    id={`slider-input-${name}`}
                    className={classes.slider}
                    value={amount}
                    onChange={setAmount}
                    disabled={isMining || hasZeroBalance}
                />
                <Button
                    onClick={handleRepaySubmit}
                    color="primary"
                    size="large"
                    disabled={isMining || hasZeroAmountSelected}>
                    {isMining ? <CircularProgress size={26} /> : "Repay"}
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
                open={showRepayTokenSuccess}
                autoHideDuration={5000}
                onClose={handleCloseSnack}>
                <Alert onClose={handleCloseSnack} severity="success">
                    Tokens Repayed!
                </Alert>
            </Snackbar>
        </>
    )
}
{/* <>
            <div className={classes.container}>
                <SliderInput
                    label={`Redeem LVR for ${name}`}
                    maxValue={formattedBalance}
                    id={`slider-input-${name}`}
                    className={classes.slider}
                    value={amount}
                    onChange={setAmount}
                    disabled={isMining || hasZeroBalance}
                />
                <Button
                    color="primary"
                    variant="contained"
                    size="large"
                    onClick={handleRedeemSubmit}
                    disabled={isMining || hasZeroAmountSelected}
                >
                    {isMining ? <CircularProgress size={26} /> : "Redeem"}
                </Button>
            </div>
            <Snackbar
                open={showRedeemSuccess}
                autoHideDuration={5000}
                onClose={handleCloseSnack}
            >
                <Alert onClose={handleCloseSnack} severity="success">
                    Tokens Redeemed
                </Alert>
            </Snackbar>
        </> */}