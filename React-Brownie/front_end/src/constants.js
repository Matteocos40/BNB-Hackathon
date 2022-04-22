import { Deposit } from "./components/Deposit"
import { Dashboard } from "./components/Dashboard"
import { Redeem } from "./components/Redeem"
import { Borrow } from "./components/Borrow"
import { Repay } from "./components/Repay"
import { UnlockCollateral } from './components/UnlockCollateral'

import DashboardIcon from '@mui/icons-material/Dashboard';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import RedeemIcon from '@mui/icons-material/Redeem';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PaymentsIcon from '@mui/icons-material/Payments';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

export const routes = [
    {
        path: '/',
        component: <Dashboard />,
        icon: <DashboardIcon />,
        title: 'Dashboard',
    },
    {
        path: '/deposit',
        component: <Deposit />,
        icon: <AttachMoneyIcon />,
        title: 'Deposit',
    },
    {
        path: '/redeem',
        component: <Redeem />,
        icon: <RedeemIcon />,
        title: 'Redeem',
    },
    {
        path: '/borrow',
        component: <Borrow />,
        icon: <CreditCardIcon />,
        title: 'Borrow',
    },
    {
        path: '/repay',
        component: <Repay />,
        icon: <PaymentsIcon />,
        title: 'Repay',
    },
    {
        path: '/unlock-collateral',
        component: <UnlockCollateral />,
        icon: <AccountBalanceIcon />,
        title: 'Unlock Collateral',
    }
]