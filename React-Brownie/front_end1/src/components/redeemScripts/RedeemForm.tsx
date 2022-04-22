import React, { useState, useEffect } from "react"
import {
    Button,
    CircularProgress,
    Snackbar,
    makeStyles,
} from "@material-ui/core"
import { Token } from "../Redeem"
import { useWithdrawTokens } from "../../hooks/useRedeem"
import { UserTokenBalance } from "../../hooks/LVRBalance"

import Alert from "@material-ui/lab/Alert"
import { formatUnits } from "@ethersproject/units"
import { UserBalanceMsg } from "../UserBalanceMsg"
import lvr from "../../LeverLogo.png"
import { SliderInput } from "../../hooks/sliderInput"
import { useEthers, useTokenBalance, useNotifications } from "@usedapp/core"
// import {UserTokens} from "../contractValues/contractBalance"
import { utils } from "ethers"
export interface RedeemTokensFormProps {
    token: Token
}


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


export const RedeemTokens = ({ token }: RedeemTokensFormProps) => {
    const { image, address: tokenAddress, name } = token

    const { notifications } = useNotifications()

    const balance = UserTokenBalance()

    const formattedBalance: number = balance
        ? parseFloat(formatUnits(balance, 18))
        : 0

    const { send: redeemTokensSend, state: redeemTokensState } =
        useWithdrawTokens()

    const handleRedeemSubmit = () => {
        console.log(amount.toString())
        const amountAsWei = utils.parseEther(amount.toString())
        console.log(tokenAddress, amountAsWei)
        return redeemTokensSend(tokenAddress, amountAsWei)
    }


    const [showRedeemSuccess, setShowRedeemSuccess] = useState(false)

    const handleCloseSnack = () => {
        showRedeemSuccess && setShowRedeemSuccess(false)
    }

    const [amount, setAmount] = useState<number | string | Array<number | string>>(0)

    useEffect(() => {
        if (
            notifications.filter(
                (notification) =>
                    notification.type === "transactionSucceed" &&
                    notification.transactionName === "Redeem tokens"
            ).length > 0
        ) {
            !showRedeemSuccess && setShowRedeemSuccess(true)
        }
    }, [notifications, showRedeemSuccess])

    const isMining = redeemTokensState.status === "Mining"
    const hasZeroBalance = formattedBalance === 0
    const hasZeroAmountSelected = parseFloat(amount.toString()) === 0


    const classes = useStyles()

    return (
        <>
            <div className={classes.container}>
                <UserBalanceMsg
                    label={`Your LVR balance`}
                    amount={formattedBalance}
                    tokenImgSrc={lvr}
                />
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
                    // variant="contained"
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
        </>
    )
}