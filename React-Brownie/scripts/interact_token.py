from brownie import LVRToken, config, network
from scripts.helpful_scripts import get_account
from web3 import Web3


#0x80311730A0f91134AC60f16d673dfF006BA4E55d acct2
#0x1680df1901C033306f161ea35425c1463D52B0C6 acct1

#rinkeby LINK contract location: 0x01BE23585060835E02B77ef475b0Cc51aA1e0709
#rinkeby DAI  contract location: 0x95b58a6bff3d14b7db2f5cb5f0ad413dc2940658

def mint():

    #Setup
    #_______________________________________________________________________________________________________________________________________________________
    token = LVRToken[-1]
    account1 = get_account(1)
    account2 = get_account(2)
    

    #Accounts and Values
    #_______________________________________________________________________________________________________________________________________________________
    account_bal1 = token.balanceOf('0x1680df1901C033306f161ea35425c1463D52B0C6') #0x168 is account 1: use get_acounts from_key1
    # account_bal2 = token.balanceOf('0x80311730A0f91134AC60f16d673dfF006BA4E55d')
    #token_val = token.tokenDollarValue()
    pool = token.getPoolValue()
    supply = token.totalSupply()
    #val = token.getTotalValue('eth', Web3.toWei(0.1, 'ether'))
    #tot = token.mintQuantity(val)

    
    #BURN
    #_______________________________________________________________________________________________________________________________________________________
    #burn1 = token.burn(account_bal1, {'from':account1})
    #burn2 = token.burn(account_bal2, {'from':account2})


    #MINT
    #_______________________________________________________________________________________________________________________________________________________
    amount  = 1000000000000000000 # this should come from deposit function
    link_address = '0x01BE23585060835E02B77ef475b0Cc51aA1e0709'
    #price = token.mint(config['wallets']['personal_public'], 2000, 'eth', {'from': account, 'value':Web3.toWei(1, 'ether')})
    #price2 = token.mint('0x80311730A0f91134AC60f16d673dfF006BA4E55d', amount, link_address, {'from': account2})#
    #price1 = token.mint('0x1680df1901C033306f161ea35425c1463D52B0C6', amount, link_address, {'from': account1})#


    #PRINT
    #_______________________________________________________________________________________________________________________________________________________
    print(f'pool:         {pool}')
    print(f'supply:       {supply}')
    #print(f'dollar value: {token_val}')
    print(f'acct1:        {account_bal1}')
    #print(f'acct2:        {account_bal2}')
    # print(burn)
    # print(price)

    

def main():
    mint()

#brownie run scripts/interact_token.py --network rinkeby
