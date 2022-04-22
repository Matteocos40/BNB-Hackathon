/** @jsxImportSource @emotion/react */
import { useEthers } from "@usedapp/core"
import { Button, makeStyles } from "@material-ui/core"
import { useNavigate } from "react-router-dom"

import { routes } from "../constants"
import React from "react"

const useStyles = makeStyles((theme) => ({
    container: {
        paddingBottom: theme.spacing(4),
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '97vh',
        minHeight: '670px',
        maxWidth: '300px',
        width: '25vw',
        minWidth: '200px',
        backgroundColor: '#282931',
        position: 'fixed',
        borderTopRightRadius: '20px',
        borderBottomRightRadius: '20px',
    },
    containerW : {
        width: "25vw", 
        maxWidth: "300px", 
        minWidth: "200px"
    },
    navlinks: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        height: '50vh',
        color: theme.palette.common.white,
    },
    titleContainer: {
        width: "90%", 
        marginLeft: "2vw", 
        display: "flex", 
        justifyContent: "flex-start", 
        gap: "15px", 
        alignItems: "center"
    },
    title: {
        fontSize: '30px',
        color: theme.palette.common.white,
    },
    navlink: {
        display: "flex",
        paddingLeft: "3vw",
        alignItems: "center",
        gap: "15px",
        color: theme.palette.common.white,
        padding: theme.spacing(1),
        margin: "0px",
        transition: "all 0.3s ease-in-out",
        "&:hover": {
            color: "#749ac7",
            cursor: "pointer",
            backgroundColor: '#383944',
            borderRadius: '30px',
            gap: "20px",
            transition: "all 0.3s ease-in-out",
        },
    },
    button: {
        color: theme.palette.common.white,
        backgroundColor: '#749ac7',
    }
}))

export const Sidebar = () => {
    const classes = useStyles()
    const { account, activateBrowserWallet, deactivate } = useEthers()
    const navigate = useNavigate()

    const isConnected = account !== undefined

    return (
        <React.Fragment>
            {/* Top div for formatting, 'fixed' position takes container out of doc flow, 
            so this allows everything to format correctly*/}
            <div className={classes.containerW}></div>
            <div className={classes.container}>
                {/* Logo and Name (Placeholder for now)*/}
                <div>
                    <div className={classes.titleContainer}>
                        <img src="LeverLogo.png" alt="Lever Logo" css={{marginTop: "3px", width: "50px", height: "auto"}}/>
                        <p className={classes.title}>Lever</p>
                    </div>
                    <div className={classes.navlinks}>
                        {routes.map((route) => (
                            <div key={route.title} className={classes.navlink}>
                                <div>
                                    {route.icon}
                                </div>
                                <p
                                    onClick={() => navigate(route.path)}
                                    css={{marginBottom: "20px"}}
                                >
                                    {route.title}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
                <div css={{marginInline: 'auto', paddingBottom: '5vh'}}>
                    {isConnected ? (
                        <Button color="primary" variant='contained' onClick={deactivate}>

                            Disconnect

                        </Button>
                    ) : (
                        <Button className={classes.button} variant='contained'
                            onClick={() => activateBrowserWallet()}>
                            Connect
                        </Button>
                    )
                    }
                </div>
            </div>
        </React.Fragment>

    )
}