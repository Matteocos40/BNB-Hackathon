from brownie import accounts, network, config, MockV3Aggregator
from web3 import Web3


LOCAL_BLOCKCHAIN_ENVIRONMENTS = [
    "development",
    "ganache",
    "hardhat",
    "test-ganache",
    "mainnet-fork",
]
FORKED_LOCAL_ENVIRONMENTS = ["mainnet-fork", "mainnet-fork-dev"]



# def get_account(index=None, id=None):
#     if index:
#         return accounts[index]
#     if network.show_active() in LOCAL_BLOCKCHAIN_ENVIRONMENTS:
#         print(accounts[0].balance())
#         return accounts[0]
#     if id:
#         return accounts.load(id)
#     return accounts.add(config["wallets"]["from_key"])

DECIMALS = 8
STARTING_PRICE = 200000000000


def get_account(x):
    if (
        network.show_active() in LOCAL_BLOCKCHAIN_ENVIRONMENTS
        or network.show_active() in FORKED_LOCAL_ENVIRONMENTS
    ):
        return accounts[0]
    else:
        if x==1:
            return accounts.add(config["wallets"]["from_key1"])
        if x==2:
            return accounts.add(config["wallets"]["from_key2"])

def get_pricefeed_address(ticker):
    ticker = ticker.lower() + '_usd_price_feed'
    return config["networks"][network.show_active()][ticker]


def deploy_mocks():
    print(f"The active network is {network.show_active()}")
    print("Deploying Mocks...")
    if len(MockV3Aggregator) <= 0:
        MockV3Aggregator.deploy(DECIMALS, STARTING_PRICE, {"from": get_account()})
    print("Mocks Deployed!")