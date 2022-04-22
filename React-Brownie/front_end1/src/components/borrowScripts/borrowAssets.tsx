import { Token } from "../Deposit"
import React, { useState } from "react"
import { Box, makeStyles } from "@material-ui/core"
import { TabContext, TabList, TabPanel } from "@material-ui/lab"
import { Tab } from "@material-ui/core"
import { WalletBalance } from "../depositScripts/WalletBalance"
import { BorrowTokens, DepositCollateral } from "./BorrowForm"
import { BorrowValue, CollateralValue, CollateralQuantity, BorrowQuantity, MaxLoan } from "../contractValues/contractBalance"


interface BorrowAssetsProps {
    supportedTokens: Array<Token>
}

const useStyles = makeStyles((theme) => ({
    tabContent: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: theme.spacing(4)
    },
    box: {
        backgroundColor: "white",
        borderRadius: "5px"
    },
    header: {
        color: "white"
    }
}))

export const BorrowAssets = ({ supportedTokens }: BorrowAssetsProps) => {
    const [selectedTokenIndex, setSelectedTokenIndex] = useState<number>(0)

    const handleChange = (event: React.ChangeEvent<{}>, newValue: string) => {
        setSelectedTokenIndex(parseInt(newValue))
    }
    //for bottom tabs
    const [selectedBottomTokenIndex, setSelectedBottomTokenIndex] = useState<number>(0)
    const handleBottomChange = (event: React.ChangeEvent<{}>, newValue: string) => {
        setSelectedBottomTokenIndex(parseInt(newValue))
    }

    const classes = useStyles()
    return (
        <Box>
            <h2 className={classes.header}> Borrow Function </h2>
            <Box className={classes.box}>
                <TabContext value={selectedTokenIndex.toString()}>
                    <TabList onChange={handleChange} aria-label="borrow tabs">
                        {supportedTokens.map((token, index) => {
                            return (
                                <Tab label={token.name}
                                    value={index.toString()}
                                    key={index} />
                            )
                        })}
                    </TabList>
                    {supportedTokens.map((token, index) => {
                        return (
                            <TabPanel value={index.toString()} key={index}>
                                <div className={classes.tabContent}>
                                    <BorrowValue />

                                    <BorrowQuantity token={supportedTokens[selectedTokenIndex]} />
                                    {/* this need to be borrowForm which deposits collat then trasnfers loan 
                                    Basically we need to combine reedeem form for slider bar but with collat and 
                                    deposit form for moving collateral*/}
                                    <MaxLoan token={supportedTokens[selectedTokenIndex]} />

                                    < BorrowTokens token={supportedTokens[selectedTokenIndex]} />
                                </div>
                            </TabPanel>
                        )
                    })}
                </TabContext>

                <TabContext value={selectedBottomTokenIndex.toString()}>
                    <TabList onChange={handleBottomChange} aria-label="collat tabs">
                        {supportedTokens.map((token, index) => {
                            return (
                                <Tab label={token.name}
                                    value={index.toString()}
                                    key={index} />
                            )
                        })}
                    </TabList>
                    {supportedTokens.map((token, index) => {
                        return (
                            <TabPanel value={index.toString()} key={index}>
                                <div className={classes.tabContent}>
                                    <CollateralValue />
                                    <CollateralQuantity token={supportedTokens[selectedBottomTokenIndex]} />
                                    <WalletBalance token={supportedTokens[selectedBottomTokenIndex]} />


                                    <DepositCollateral token={supportedTokens[selectedBottomTokenIndex]} />
                                </div>
                            </TabPanel>
                        )
                    })}
                </TabContext>


            </Box>
        </Box >
    )

}