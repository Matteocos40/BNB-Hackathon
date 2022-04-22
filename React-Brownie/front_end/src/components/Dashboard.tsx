import { useEthers } from "@usedapp/core"
import helperConfig from "../helper-config.json"
import networkMapping from "../chain-info/deployments/map.json"
import { constants } from "ethers"
import brownieConfig from "../brownie-config.json"
import link from "../link.png"
import eth from "../eth.png"
import dai from "../dai.png"
import { PoolBalance, UserAndPoolHeader } from "./contractValues"
import { makeStyles } from "@material-ui/core"
import lvr from "../LLWhite.png"



export type Token = {
    image: string,
    address: string,
    name: string
}

const useStyles = makeStyles((theme) => ({
    container: {
        display: "inline-grid",
        gridTemplateColumns: "auto auto auto",
        gap: theme.spacing(1),
        alignItems: "center"
    },
    title: {
        color: theme.palette.common.white,
        textAlign: "center",
        fontSize: 60,
        padding: theme.spacing(4)

    },
    tokenImg: {
        width: "60px",
        alignItems: 'center'
    }
}))

export const Dashboard = () => {

    const classes = useStyles()
    const { chainId, account } = useEthers()

    const networkName = chainId ? helperConfig[chainId] : "dev"
    // console.log(chainId)
    // console.log(networkName)
    // console.log(account)

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
        {/* <h1 className={classes.title}>Lever Liquidity <img className={classes.tokenImg} src={lvr} alt="token logo" /> </h1> */}
        <h1 className={classes.title}>Lever Liquidity  </h1>

        {/* <img className={classes.tokenImg} src={lvr} alt="token logo" /> */}
        {/* PoolTotal */}
        {/* <UserStats*/}
        <UserAndPoolHeader address={account} />
        <PoolBalance supportedTokens={supportedTokens} />
    </>)
}