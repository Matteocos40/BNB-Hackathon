/** @jsxImportSource @emotion/react */
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from 'react-router-dom';
import { ChainId, DAppProvider } from "@usedapp/core"
import { Header } from "./components/Header"
import { Container } from "@material-ui/core"
import { routes } from "./constants"
import { Sidebar } from "./components/Sidebar"
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
      <div>
        <div 
          css={{
            display: 'flex', 
            flexDirection: 'row',
            justifyContent: 'space-between',
            width: '100vw',
            padding: "0px",
          }}
        >
          <Router>
          <Sidebar />
            <Box css={{width: '75vw', paddingInline: '10vw', paddingBottom: '5vh', margin: 'auto', height: '100vh', overflowY: 'scroll'}}>
              <Routes>
                {routes.map((route, index) => (
                  <Route
                    key={index}
                    path={route.path}
                    element={route.component}
                  />
                ))}
              </Routes>
            </Box>
          </Router>
        </div>
      </div>
    </DAppProvider>
  )
}

export default App
