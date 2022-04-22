import { Token } from "../Deposit"
import React, { useState } from "react"
import { Box, makeStyles } from "@material-ui/core"
import { TabContext, TabList, TabPanel } from "@material-ui/lab"
import { Tab } from "@material-ui/core"
import { RepayForm } from "./RepayForm"
import { OutstandingLoan, OutstandingLoanUSD } from "../contractValues/contractBalance"


interface RepayLoanProps {
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

export const RepayLoan = ({ supportedTokens }: RepayLoanProps) => {
    const [selectedTokenIndex, setSelectedTokenIndex] = useState<number>(0)

    const handleChange = (event: React.ChangeEvent<{}>, newValue: string) => {
        setSelectedTokenIndex(parseInt(newValue))
    }
    const classes = useStyles()
    return (
        <Box>
            <h2 className={classes.header}> Repay Function </h2>
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
                                    {/* total outstandign USD Loan
                                    loan per each asset  */}
                                    <OutstandingLoanUSD />
                                    <OutstandingLoan token={supportedTokens[selectedTokenIndex]} />

                                    {/* ^^ make in contractBalance */}
                                    <RepayForm token={supportedTokens[selectedTokenIndex]} />
                                </div>
                            </TabPanel>
                        )
                    })}
                </TabContext>
            </Box>
        </Box >
    )

}