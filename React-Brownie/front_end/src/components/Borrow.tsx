import { useEthers } from "@usedapp/core"
import helperConfig from "../helper-config.json"
import networkMapping from "../chain-info/deployments/map.json"
import { constants } from "ethers"
import brownieConfig from "../brownie-config.json"
import link from "../link.png"
import eth from "../eth.png"
import dai from "../dai.png"
import { BorrowAssets } from "./borrowScripts"
//import { RedeemTokens } from "./redeemScripts/RedeemForm"
import { makeStyles } from "@material-ui/core"
import { GridFilterInputMultipleValue } from "@mui/x-data-grid"

export type Token = {
    image: string,
    address: string,
    name: string
}


/**
 * Link borr balance 
 * link collat balance
 * link borrow value
 * total collat value
 * Input: Loan quantity
 * slider: collat multipler 0- 5x
 */

const useStyles = makeStyles((theme) => ({
    title: {
        color: theme.palette.common.white,
        textAlign: "center",
        padding: theme.spacing(4)
    }
}))

export const Borrow = () => {

    const classes = useStyles()
    const { chainId } = useEthers()

    const networkName = chainId ? helperConfig[chainId] : "dev"
    // console.log(chainId)
    // console.log(networkName)

    //const poolAddress = chainId ? networkMapping[String(chainId)]["LendingPool"][0] : constants.AddressZero
    const wethTokenAddress = chainId ? brownieConfig["networks"][networkName]["weth_token"] : constants.AddressZero // brownie config
    const daiTokenAddress = chainId ? brownieConfig["networks"][networkName]["dai_token"] : constants.AddressZero // brownie config
    const linkTokenAddress = chainId ? brownieConfig["networks"][networkName]["link_token"] : constants.AddressZero // brownie config

    const supportedTokens: Array<Token> = [
        {
            image: link,
            address: linkTokenAddress,
            name: "LINK"
        },
        {
            image: eth,
            address: wethTokenAddress,
            name: "WETH"
        },
        {
            image: dai,
            address: daiTokenAddress,
            name: "DAI"
        }
    ]

    return (<>
        {/* <h2 className={classes.title}>Lever Liquidity</h2> */}
        < BorrowAssets supportedTokens={supportedTokens} />
    </>)
}