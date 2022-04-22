from py import code
from brownie import (LendingPool,Pool,Collateral,config,interface,Conversion,LVRToken,MockV3Aggregator,Contract,network,)
from scripts.helpful_scripts import get_account
from web3 import Web3
import time
import yaml
import json
import shutil
import os

accountPublic1 = config["wallets"]["public1"]
accountPublic2 = config["wallets"]["public2"]
account1 = get_account(1)
account2 = get_account(2)

# brownie run scripts/deploy_main.py --network rinkeby

#NEXT STEPS:
# check collat embedded in main five functions/payout interest in repay? done everytime not great - in liquidation manager?
#       - have payout in repay, liquidation manager in borrow(and reapy)?
#       - cool to have UI turn red if collat value is getting low


# FUTURE:
# Updateable Contract
# switch collateral without having to take out loan and put it back
# collat to repay loan? would need to swap again which i dont like
# check reserve balances and transfer if neccessary - UI? has to be something external
# decide frequancy of payout 


desired_actions = [] # <-- change this to what you want to happen
#################################################################################
#               0         1       2        3           4           5           ##
action_lst=['deposit','borrow','repay','collateral','redeem', 'check collat']  ##
#################################################################################

def main():

    deploy(front_end_update = True)


    actions = [action_lst[x] for x in desired_actions] 
    interact(actions)

    time.sleep(2)

    print_helpers()

def interact(action):
    lendingpool = LendingPool[-1]

    # addresses of contracts deployed by LendingPool
    pool_addr = lendingpool.getPoolAddr()
    coll_addr = lendingpool.getCollAddr()

    # Approve Send of tokens and have contracts pull funds
    link_addr = "0x01BE23585060835E02B77ef475b0Cc51aA1e0709"
    link_token = interface.ERC20(link_addr)
    dai_addr = "0x5592EC0cfb4dbc12D3aB100b257153436a1f0FEa"
    dai_token = interface.ERC20(dai_addr)
    weth_addr = '0xc778417E063141139Fce010982780140Aa0cD5Ab'
    weth_token = interface.ERC20(weth_addr)
    
    if 'deposit' in action:
        #LINK DEPOSIT 1*10**18
        # link_token.approve(pool_addr, 1 * 10 ** 18, {"from": account2})
        # dep_event2 = lendingpool.Deposit(1 * 10 ** 18, link_addr, {"from": account2})

        #DAI DEPOSIT 5*10**18
        dai_token.approve(pool_addr, 10 * 10 ** 18, {"from": account2})
        dep_event2 = lendingpool.Deposit(10 * 10 ** 18, dai_addr, {"from": account2})

        #WETH DEPOSIT 1*10**18
        # weth_token.approve(pool_addr, 1 * 10 ** 15, {"from": account2})
        # dep_event2 = lendingpool.Deposit(1 * 10 ** 15, weth_addr, {"from": account2})
    
    if 'borrow' in action:
        # borrow function with 0 borrow amount just deposits collat. Function takes borrow specs, then collateral specs
        #BORROW 1 LINK AGAINST 2 LINK
        dai_token.approve(coll_addr, 1 * 10 ** 18, {"from": account1})
        borr_event = lendingpool.Borrow(0, dai_addr, 1 * 10 ** 18, dai_addr, {"from": account1} )

        #BORROW 5 DAI AGAINST 1 LINK
        # link_token.approve(coll_addr, 1 * 10 ** 18, {"from": account1})
        # borr_event = lendingpool.Borrow(5 * 10 ** 18, dai_addr, 1 * 10 ** 18, link_addr, {"from": account1})

    # if 'accrue' in action:
    #     # ACCRUE INTEREST
    #     lendingpool.accrueInterest({"from": account1})
    if 'repay' in action:
        #Approve move of loan value to pool before repaying
        #REPAY TOTAL LINK LOAN
        link_loan_total = lendingpool.getOutstandingLoan(accountPublic1, link_addr) * (1.1) #approve more than current loan to account for accruel
        link_token.approve(pool_addr, link_loan_total, {"from": account1})
        repay_event = lendingpool.Repay(link_addr, 1, {"from": account1}) #if amount to repay == 1, repay all- i would prefer if amount == uint256(-1)

        #REPAY TOTAL DAI LOAN
        # dai_loan_total = lendingpool.getOutstandingLoan(accountPublic1, dai_addr)
        # dai_token.approve(pool_addr, dai_loan_total, {"from": account1})
        # repay_event = lendingpool.Repay(dai_addr, dai_loan_total, {"from": account1})

    if 'payout' in action:
        #PAYOUT INTEREST
        lendingpool.payoutInterest({"from": account1})

    if 'collateral' in action:
        #WITHDRAW ALL LINK COLLATERAL FROM ACCOUNT 1
        coll_quant = lendingpool.getUserCollateral(accountPublic1, link_addr)
        withdraw_collat = lendingpool.unlockCollateral(link_addr, coll_quant, False, {"from": account1})
        
    if 'redeem' in action:
        #WITHDRAW LINK DEPOSITED TO POOL FOR LENDING BY DEPOSITING LVR #lendingpool.getBalanceOf(accountPublic2)
        withdraw_event2 = lendingpool.Withdraw(link_addr, lendingpool.getBalanceOf(accountPublic2), {"from": account2})
        #withdraw_event2 = lendingpool.Withdraw(weth_addr, lendingpool.getBalanceOf(accountPublic2), {"from": account2})
        #withdraw_event2 = lendingpool.Withdraw(dai_addr, lendingpool.getBalanceOf(accountPublic2), {"from": account2})

        #^changed to using tokens to withdraw instead of asset- easier to withdraw all available money
    if 'check collat' in action:
        #check LTV
        lendingpool.liquidationManager({'from':account1})
        #lendingpool.updateSupportedAssets(weth_addr)



def print_helpers():
    lendingpool = LendingPool[-1]
    pool_addr = lendingpool.getPoolAddr()
    coll_addr = lendingpool.getCollAddr()
    link_addr = "0x01BE23585060835E02B77ef475b0Cc51aA1e0709"
    link_token = interface.ERC20(link_addr)
    dai_addr = "0x5592EC0cfb4dbc12D3aB100b257153436a1f0FEa"
    dai_token = interface.ERC20(dai_addr)
    weth_addr = '0xc778417E063141139Fce010982780140Aa0cD5Ab'
    weth_token = interface.ERC20(weth_addr)
    #print(f"Pool address from contract:  {lendingpool.getPoolAddr()}")
    print(f"Token address from contract: {lendingpool.getTokenAddr()}")
    #HELPER VALUES:
    coll_value = lendingpool.getCollateralValue(accountPublic1)
    coll_quant = lendingpool.getUserCollateral(accountPublic1, link_addr)
    interest_link = lendingpool.interestQuantity(accountPublic1, link_addr)
    interest_dai = lendingpool.interestQuantity(accountPublic1, dai_addr)
    acct1_LINK_borrow_qty = lendingpool.getOutstandingLoan(accountPublic1, link_addr)
    acct1_borrow = lendingpool.totalValueBorrowed(accountPublic1)
    acct1_DAI_borrow_qty = lendingpool.getOutstandingLoan(accountPublic1,dai_addr)
    #pool = lendingpool.getPoolValue()
    supply = lendingpool.getTotalSupply()
    pool_val = lendingpool.getPoolValue()
    try:
        token_val = lendingpool.getTokenDollarValue()
    except:
        token_val = 0
    #link_bal = lendingpool.getPoolBalance(link_addr) should == lendingpool.getLiquidity(link_addr) when no interest 
    print('ppol',lendingpool.getPoolBalance(link_addr))
    print('ppol',lendingpool.getPoolBalance(dai_addr))
    print('ppol',lendingpool.getPoolBalance(weth_addr))

    print('liq ',lendingpool.getLiquidity(link_addr))
    link_bal = lendingpool.getLiquidity(link_addr)
    link_lock = lendingpool.getCollBalance(link_addr) #should == lendingpool.getLockedCollateral(link_addr)
    dai_bal = lendingpool.getPoolBalance(dai_addr) 
    dai_lock = lendingpool.getCollBalance(dai_addr)
    weth_bal = lendingpool.getLiquidity(weth_addr)
    weth_lock = lendingpool.getCollBalance(weth_addr)
    account_bal1 = lendingpool.getLentAmount(accountPublic1) #lendingpool.getBalanceOf(accountPublic1)
    account_bal2 = lendingpool.getBalanceOf(accountPublic2)#lendingpool.getLentAmount(accountPublic2) #lendingpool.getBalanceOf(accountPublic2)
    try:
        liquidPercentage = lendingpool.getLiquidPct(link_addr)
    except:
        liquidPercentage = 'NA'
    #print(liquidPercentage)
    link_interest_rate = lendingpool.getInterestRate(link_addr)
    link_annual_rate = lendingpool.getAnnualBorrowInterestRate(link_addr)
    dai_interest_rate = lendingpool.getInterestRate(dai_addr)
    weth_interest_rate = lendingpool.getInterestRate(dai_addr)
    try:
        link_lend_rate = lendingpool.getAnnualLendInterestRate(link_addr)/(10**16)
    except:
        link_lend_rate = 0

    print('LendingPool Address:',lendingpool.address)
    print('\n_____________________Token_____________________')
    print(f"Token Supply:             {supply/(1*10**18)}")
    print(f"Pool Value:              ${pool_val/(1*10**18)}")
    print(f"Token value:             ${token_val/ (1 * 10 ** 18)}")
    print(f"acct1 LVR bal:            {account_bal1/(1*10**18)}")
    print(f"acct2 LVR bal:            {account_bal2/(1*10**18)}")
    
    print('\n_____________________Pool_____________________')
    print(f"acct1 borr value:        ${acct1_borrow/(1*10**18)}")
    print(f"acct1 borr LINK qty:      {acct1_LINK_borrow_qty/(1*10**18)}")
    print(f"acct1 borr DAI qty:       {acct1_DAI_borrow_qty/(1*10**18)}") 
    print(f"acct1 collat val:        ${coll_value/(1*10**18)}")
    print(f"acct1 col LINK qty:       {coll_quant/(1*10**18)}")
    #print(f"Percent Liquid:          {liquidPercentage/(10**18)}%")
    print(f"pool LINK balance:        {link_bal/(1*10**18)}")
    print(f"pool WETH balance:        {weth_bal/(1*10**18)}")
    print(f"pool DAI balance:         {dai_bal/(1*10**18)}")
    print(f"collateral LINK locked:   {link_lock/(1*10**18)}")
    print(f"collateral WETH locked:   {weth_lock/(1*10**18)}")
    print(f"collateral DAI locked:    {dai_lock/(1*10**18)}")
    print(f'Reserve LINK balance:     {lendingpool.getReserveBalance(link_addr)/(1*10**18)}')
    print('\n_____________________Interest_____________________')
    print(f"LINK Interst Rate:        {link_interest_rate/(10**16)}%")
    print(f"LINK Annual IR:           {link_annual_rate/10**18}%")
    print(f"LINK Lend IR:             {link_lend_rate}")
    print(f"DAI Interst Rate:         {dai_interest_rate/(10**16)}%")
    print(f"WETH Interst Rate:        {weth_interest_rate/(10**16)}%")
    print(f"acct1 LINK interest:      {interest_link/(1*10**18)}")
    print(f"acct1 DAI interest:       {interest_dai/(1*10**18)}")
    print(f'Time Delta:               {lendingpool.getTimeDelta()} seconds')
    print(f'Total LINK Interest:      {lendingpool.getInterestQuantity(link_addr)/(1*10**18)}')

    #print(lendingpool.getAssetFromTokens(link_addr,account_bal2))

    

def deploy(front_end_update = False):
    # conversion = Conversion.deploy({"from": account})
    # pool = Pool.deploy({'from': account})
    # collateral = Collateral.deploy({'from': account})
    # token = LVRToken.deploy('TestToken','TST', pool.address, {'from': account})
    lending_pool = LendingPool.deploy({"from": account1})
    if front_end_update:
        update_front_end()

def update_front_end():
    #send brwonie cofig to scr folder

    copy_folders_to_front_end("./build", "./front_end1/src/chain-info")

    #convert to json
    with open('brownie-config.yaml', 'r') as brownie_config:
        config_dict = yaml.load(brownie_config,Loader = yaml.FullLoader)
        with open("./front_end1/src/brownie-config.json",'w') as brownie_config_json:
            json.dump(config_dict, brownie_config_json)

def copy_folders_to_front_end(src, dest):
    if os.path.exists(dest):
        shutil.rmtree(dest)
    shutil.copytree(src, dest)




