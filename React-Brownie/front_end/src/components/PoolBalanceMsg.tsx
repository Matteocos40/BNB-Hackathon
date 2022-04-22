import { makeStyles } from "@material-ui/core"
//make send to export table here ?
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';

const useStyles = makeStyles(theme => ({
    container: {
        display: "inline-grid",
        gridTemplateColumns: "auto auto auto",
        gap: theme.spacing(1),
        alignItems: "center"
    },
    tokenImg: {
        width: "32px"
    },
    liqQty: {
        fontWeight: 700
    },
    borQty: {
        fontWeight: 700
    },
    borInterestRate: {
        fontWeight: 700
    }
}))

interface PoolBalanceMsgProps {
    label: string
    liqQty: number
    borQty: number
    borInterestRate: number
    tokenImgSrc: string
}

export const PoolBalanceMsg = ({ label, liqQty, borQty, borInterestRate, tokenImgSrc }: PoolBalanceMsgProps) => {
    const classes = useStyles()

    return (
        <div className={classes.container}>

            <TableBody>
                <TableRow>
                    <TableCell align="center"><img className={classes.tokenImg} src={tokenImgSrc} alt="token logo" /><div>{label}</div></TableCell>
                    {/* <TableCell align="left"><div></div></TableCell> */}
                    <TableCell align="left"><div className={classes.liqQty}>{liqQty}</div></TableCell>
                    <TableCell align="left"><div className={classes.borQty}>{borQty}</div></TableCell>
                    <TableCell align="left"><div className={classes.borInterestRate}>{borInterestRate}</div></TableCell>
                </TableRow>
            </TableBody>
        </div>
    )
}

//no longer use  this file