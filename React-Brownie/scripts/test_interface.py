from brownie import (
    config,
    interface,
    Contract,
    network,
)
from scripts.helpful_scripts import get_account
from web3 import Web3

#interface.InterfaceLendingPool(<address>)


accountPublic1 = config["wallets"]["public1"]
accountPublic2 = config["wallets"]["public2"]
account1 = get_account(1)
account2 = get_account(2)

def main():
    link_addr = "0x01BE23585060835E02B77ef475b0Cc51aA1e0709"
    pool_address = '0x5Eb18E068D06eafe442CEdD476CeA8AC93c33CA2'
    pool = interface.InterfaceLendingPool(pool_address)
    #pool = Contract.from_explorer(pool_address)
    print(pool.getLiquidity(link_addr))