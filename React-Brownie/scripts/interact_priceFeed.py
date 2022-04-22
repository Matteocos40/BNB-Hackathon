from brownie import Conversion
from scripts.helpful_scripts import get_account, get_pricefeed_address

# DAI: 0x1680df1901C033306f161ea35425c1463D52B0C6
# lINK: 0x01BE23585060835E02B77ef475b0Cc51aA1e0709

def retreive():
    convert = Conversion[-1]
    account = get_account(1)
    #priceFeed_address = convert.printAddress('eth', {'from': account})
    #price = convert.getPrice('eth')
    #print(f'___/USD price is {price}')
    #print(type(price))
    #print('address is:',priceFeed_address)
    print(convert.getPrice('0x01BE23585060835E02B77ef475b0Cc51aA1e0709'))
    

def main():
    retreive()


#brownie run scripts/interact_priceFeed.py --network rinkeby