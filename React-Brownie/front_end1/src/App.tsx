import React from 'react'
import { ChainId, DAppProvider } from "@usedapp/core"
import { Header } from "./components/Header"
import { Container } from "@material-ui/core"
import { Deposit } from "./components/Deposit"
import { Dashboard } from "./components/Dashboard"
import { Redeem } from "./components/Redeem"
import { Borrow } from "./components/Borrow"
import { Repay } from "./components/Repay"
import { UnlockCollateral } from './components/UnlockCollateral'
import { Box, makeStyles } from "@material-ui/core"

function App() {
  return (
    <DAppProvider config={{
      supportedChains: [ChainId.Rinkeby],
      notifications: {
        expirationPeriod: 1000,
        checkInterval: 1000
      },
      multicallVersion: 2
    }}>
      <Header />
      <Container maxWidth="lg">
        <Dashboard />
        <Deposit />
        <Redeem />
        <Borrow />
        <Repay />
        <UnlockCollateral />
      </Container>
    </DAppProvider>
  )
}

export default App
