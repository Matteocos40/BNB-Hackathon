import React, { useState, useEffect } from "react"
import { Token } from "../Deposit"
import { useEthers, useTokenBalance, useNotifications } from "@usedapp/core"
import { formatUnits } from "@ethersproject/units"
import { Button, Input, CircularProgress, Snackbar } from "@material-ui/core"
import Alert from "@material-ui/lab/Alert"
import { useDepositTokens } from "../../hooks"
import { utils } from "ethers"

export interface DepositFormProps {
    token: Token
}

export const DepositForm = ({ token }: DepositFormProps) => {
    const { address: tokenAddress, name } = token

    const { notifications } = useNotifications()

    const [amount, setAmount] = useState<number | string | Array<number | string>>(0)
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newAmount = event.target.value === "" ? "" : Number(event.target.value)
        setAmount(newAmount)
        // console.log(newAmount)
    }

    const { approveAndDeposit, state: approveAndDepositErc20State } = useDepositTokens(tokenAddress)
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
                    {isMining ? <CircularProgress size={26} /> : "Deposit"}
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