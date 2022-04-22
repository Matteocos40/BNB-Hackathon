
import React, { useState } from "react"
import { Box, makeStyles } from "@material-ui/core"
import { TotalValue, UserTokens, TokenValue } from "./contractBalance"
//import { TokenIdentifiers, LiquidBalance, BorrowBalance } from "./contractBalance"

// import { DepositForm } from "./DepositForm"
import type { } from '@mui/x-data-grid/themeAugmentation';

import { useEthers, useTokenBalance } from "@usedapp/core"
import { formatUnits } from "@ethersproject/units"
import lvr from "../../LeverLogo.png"



interface UserAndPoolHeaderProps {
    address: any
}

const useStyles = makeStyles((theme) => ({
    container: {
        display: "inline-grid",
        gridTemplateColumns: "auto auto auto",
        gap: theme.spacing(4),
        alignItems: "center"
    },
    box: {
        backgroundColor: "white",
        borderRadius: "5px"
    },
    header: {
        color: "white"
    },
    title: {
        fontWeight: 600,
        // color: '#7399C6',
        color: "#565656",
        // color: "black",

        fontSize: 70
    },
    values: {
        fontWeight: 600,
        // color: '#7399C6',
        color: "#565656",
        fontSize: 20,
        alignItems: "center"
    },
    // line: {
    //     fontWeight: 800,
    //     // color: '#7399C6',
    //     color: "black",

    //     fontSize: 19.9,
    //     alignItems: "center"
    // },
    marginAutoItem: {
        margin: 'auto'
    },
    tokenImg: {
        width: "54px",
        alignItems: 'right'
    },
    horizontalSplit: {
        display: 'flex',
        flexDirection: 'row'
    },
    topPane: {
        width: '50%',
    },
    bottomPane: {
        width: '50%',
    },
    verticalSplit: {
        display: 'flex',
        flexDirection: 'column'
    },
    filler:
        { color: "white" }

}))

export const UserAndPoolHeader = ({ address }: UserAndPoolHeaderProps) => {
    //const { address } = values
    const classes = useStyles()

    return (
        <><h2 className={classes.header}> Dashboard </h2>
            <Box className={classes.box}>
                <Box className={classes.horizontalSplit}>
                    {/* <div> <div className={classes.title}> Total Value Locked: <img className={classes.tokenImg} src={lvr} alt="token logo" /> </div></div> */}
                    <div className={classes.title}> <div className={classes.topPane}> Total Value Locked: {<TotalValue />}</div></div>
                    {/* <div className={classes.title}> <div className={classes.topPane}> {<TotalValue />}</div> </div> */}
                    {/* <div className={classes.line}>__________________________________________________________________________________________________________</div> */}

                    <div className={classes.verticalSplit}>
                        <li className={classes.filler}></li>
                        <div className={classes.values}> <div className={classes.bottomPane}> LVR Token Value: {<TokenValue />}</div> </div>
                        {/* Below is super clunky but i coudlnt get white space any other way */}
                        <li className={classes.filler}></li>
                        <li className={classes.filler}></li>
                        <li className={classes.filler}></li>

                        <div className={classes.values}> <div className={classes.bottomPane}>  Your LVR Balance: </div> </div>
                        <div className={classes.values}>  {<UserTokens />} </div>
                    </div>
                </Box>
            </Box></>
    )
}