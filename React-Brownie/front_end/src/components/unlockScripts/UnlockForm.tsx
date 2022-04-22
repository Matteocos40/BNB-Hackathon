import React, { useState, useEffect } from "react"
import {
    Button,
    CircularProgress,
    Snackbar,
    makeStyles,
} from "@material-ui/core"
import { Token } from "../UnlockCollateral"
//import { useUnlockTokens } from "../../hooks/useUnlock"
import { UserTokenBalance } from "../../hooks/LVRBalance"
import { useUnlockTokens } from "../../hooks"
import Alert from "@material-ui/lab/Alert"
import { formatUnits } from "@ethersproject/units"
import { UserBalanceMsg } from "../UserBalanceMsg"
import lvr from "../../LeverLogo.png"
import { SliderInput } from "../../hooks/sliderInput"
import { useEthers, useTokenBalance, useNotifications } from "@usedapp/core"
// import {UserTokens} from "../contractValues/contractBalance"
import { utils } from "ethers"
//import * as React from 'react';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import { CollateralBalance } from "../../hooks/CollateralBalance"

export interface UnlockTokensFormProps {
    token: Token
}

//#7399C6

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


export const UnlockTokens = ({ token }: UnlockTokensFormProps) => {
    const { image, address: tokenAddress, name } = token

    const { notifications } = useNotifications()

    const { account } = useEthers()

    //console.log(account)
    const { send: redeemTokensSend, state: redeemTokensState } =
        useUnlockTokens()

    const handleUnlockSubmit = () => {
        //console.log(checked)
        // console.log(amount.toString())
        const amountAsWei = utils.parseEther(amount.toString())
        // console.log(tokenAddress, amountAsWei)
        return redeemTokensSend(tokenAddress, amountAsWei, checked) ////////////////////////////////////////////
    }


    const [showUnlockSuccess, setShowUnlockSuccess] = useState(false)

    const handleCloseSnack = () => {
        showUnlockSuccess && setShowUnlockSuccess(false)
    }

    const [amount, setAmount] = useState<number | string | Array<number | string>>(0)

    useEffect(() => {
        if (
            notifications.filter(
                (notification) =>
                    notification.type === "transactionSucceed" &&
                    notification.transactionName === "Unlock tokens"
            ).length > 0
        ) {
            !showUnlockSuccess && setShowUnlockSuccess(true)
        }
    }, [notifications, showUnlockSuccess])

    console.log(tokenAddress)

    const balance = CollateralBalance(tokenAddress, account)

    const formattedBalance: number = balance
        ? parseFloat(formatUnits(balance, 18))
        : 0

    const isMining = redeemTokensState.status === "Mining"
    const hasZeroBalance = formattedBalance === 0
    const hasZeroAmountSelected = parseFloat(amount.toString()) === 0

    //checkbox
    const [checked, setChecked] = React.useState(false);
    //console.log(checked)
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {

        setChecked(event.target.checked);
        //console.log(checked)
    };

    //////////////////////////////////////////////////////////////
    // Should have maxValue be max amount allowed to withdraw, 
    // not the total amount of collateral deposited
    //////////////////////////////////////////////////////////////

    const classes = useStyles()

    return (
        <>
            <div className={classes.container}>
                <SliderInput
                    label={`Unlock ${name}`}
                    maxValue={formattedBalance}
                    id={`slider-input-${name}`}
                    className={classes.slider}
                    value={amount}
                    onChange={setAmount}
                    disabled={isMining || hasZeroBalance}

                />

                <FormGroup>
                    <FormControlLabel control={<Checkbox
                        checked={checked}
                        onChange={handleChange}
                    />} label="Deposit Collateral to Pool as Lender" />
                </FormGroup>


                <Button
                    color="primary"
                    //variant="contained"
                    size="large"
                    onClick={handleUnlockSubmit}
                    disabled={isMining || hasZeroAmountSelected || hasZeroBalance}
                >
                    {isMining ? <CircularProgress size={26} /> : "Unlock"}
                </Button>
            </div>
            <Snackbar
                open={showUnlockSuccess}
                autoHideDuration={5000}
                onClose={handleCloseSnack}
            >
                <Alert onClose={handleCloseSnack} severity="success">
                    Tokens Unlocked
                </Alert>
            </Snackbar>
        </>
    )
}