import { Token } from "../Deposit"
import React, { useState } from "react"
import { Box, makeStyles } from "@material-ui/core"

import { TokenIdentifiers, LiquidBalance, BorrowBalance, BorrowInterestRate, LendInterestRate } from "./contractBalance"
//import { TokenIdentifiers, LiquidBalance, BorrowBalance } from "./contractBalance"

// import { DepositForm } from "./DepositForm"
import type { } from '@mui/x-data-grid/themeAugmentation';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

// import { useEthers, useTokenBalance } from "@usedapp/core"
// import { formatUnits } from "@ethersproject/units"


interface PoolBalanceProps {
    supportedTokens: Array<Token>
}

const useStyles = makeStyles((theme) => ({

    box: {
        backgroundColor: "white",
        borderRadius: "5px"
    },
    header: {
        color: "white"
    }
}))

export const PoolBalance = ({ supportedTokens }: PoolBalanceProps) => {
    const [selectedTokenIndex, setSelectedTokenIndex] = useState<number>(0)

    const handleChange = (event: React.ChangeEvent<{}>, newValue: string) => {
        setSelectedTokenIndex(parseInt(newValue))
    }
    const classes = useStyles()
    const { image, address, name } = supportedTokens[0]

    return (
        <Box>
            <h4 className={classes.header}> Pool Balances </h4>
            <Box className={classes.box}>

                <TableContainer >
                    <Table aria-label="a dense table">
                        <TableHead>
                            <TableRow>
                                <TableCell>Token</TableCell>
                                <TableCell align="left">Liquid Supply</TableCell>
                                <TableCell align="left">Lend APY</TableCell>
                                <TableCell align="left">Borrow Supply</TableCell>
                                <TableCell align="left">Borrow Interest Rate</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>

                            <TableRow>

                                <TableCell>
                                    <TokenIdentifiers token={supportedTokens[0]} />
                                </TableCell>

                                <TableCell>
                                    <LiquidBalance token={supportedTokens[0]} />
                                </TableCell>
                                <TableCell>
                                    <LendInterestRate token={supportedTokens[0]} />
                                </TableCell>
                                <TableCell>
                                    <BorrowBalance token={supportedTokens[0]} />
                                </TableCell>
                                <TableCell>
                                    <BorrowInterestRate token={supportedTokens[0]} />
                                </TableCell>

                            </TableRow>
                            <TableRow>

                                <TableCell>
                                    <TokenIdentifiers token={supportedTokens[1]} />
                                </TableCell>

                                <TableCell>
                                    <LiquidBalance token={supportedTokens[1]} />
                                </TableCell>
                                <TableCell>
                                    <LendInterestRate token={supportedTokens[1]} />
                                </TableCell>
                                <TableCell>
                                    <BorrowBalance token={supportedTokens[1]} />
                                </TableCell>
                                <TableCell>
                                    <BorrowInterestRate token={supportedTokens[1]} />
                                </TableCell>

                            </TableRow>
                            <TableRow>

                                <TableCell>
                                    <TokenIdentifiers token={supportedTokens[2]} />
                                </TableCell>
                                <TableCell>
                                    <LiquidBalance token={supportedTokens[2]} />
                                </TableCell>
                                <TableCell>
                                    <LendInterestRate token={supportedTokens[2]} />
                                </TableCell>
                                <TableCell>
                                    <BorrowBalance token={supportedTokens[2]} />
                                </TableCell>
                                <TableCell>
                                    <BorrowInterestRate token={supportedTokens[2]} />
                                </TableCell>

                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>



            </Box>
        </Box >
    )

}

