import { Token } from "../Deposit"
import React, { useState } from "react"
import { Box, makeStyles } from "@material-ui/core"
import { TabContext, TabList, TabPanel } from "@material-ui/lab"
import { Tab } from "@material-ui/core"
import { WalletBalance } from "../depositScripts/WalletBalance"
import { UnlockTokens } from "./UnlockForm"
import { CollateralValue, CollateralQuantity } from "../contractValues/contractBalance"



interface UnlockCollatProps {
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

export const UnlockCollat = ({ supportedTokens }: UnlockCollatProps) => {
    const [selectedTokenIndex, setSelectedTokenIndex] = useState<number>(0)

    const handleChange = (event: React.ChangeEvent<{}>, newValue: string) => {
        setSelectedTokenIndex(parseInt(newValue))
    }
    const classes = useStyles()
    return (
        <Box>
            <h2 className={classes.header}> Unlock Collateral Function </h2>
            <Box className={classes.box}>
                <TabContext value={selectedTokenIndex.toString()}>
                    <TabList onChange={handleChange} aria-label="deposit form tabs">
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
                                    {/* <WalletBalance token={supportedTokens[selectedTokenIndex]} /> */}
                                    <CollateralValue />
                                    <CollateralQuantity token={supportedTokens[selectedTokenIndex]} />
                                    <UnlockTokens token={supportedTokens[selectedTokenIndex]} />
                                </div>
                            </TabPanel>
                        )
                    })}
                </TabContext>
            </Box>
        </Box >
    )

}