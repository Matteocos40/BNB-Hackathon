// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "./Conversion.sol";
import "./Uniswap.sol";
import "./Math.sol";

contract Pool is AccessControlEnumerable {
    using SafeMath for uint256;
    using Math for uint256;

    event poolTransferEvent(
        address _from,
        address _to,
        address _asset,
        uint256 _quantity
    );

    struct ReserveStruct {
        //interest payments
        uint256 interestQty;
        // liquid quantity
        uint256 LiqQty;
        // borrowed quantity
        uint256 BorQty;
        //reserve quantity
        uint256 ResQty;
    }
    //map asset to structure of balances
    mapping(address => ReserveStruct) liquidity;

    address[] supportedAssets;

    // careful of decimals
    uint256 reserveReq;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    Conversion conversion;
    Uniswap uniswap;

    address public constant DAI = 0x5592EC0cfb4dbc12D3aB100b257153436a1f0FEa;
    address public constant WETH = 0xc778417E063141139Fce010982780140Aa0cD5Ab;
    address public constant LINK = 0x01BE23585060835E02B77ef475b0Cc51aA1e0709;

    constructor() {
        // address WETH = 0xc778417E063141139Fce010982780140Aa0cD5Ab;
        // address LINK = 0x01BE23585060835E02B77ef475b0Cc51aA1e0709;
        // address DAI = 0x5592EC0cfb4dbc12D3aB100b257153436a1f0FEa;

        liquidity[LINK] = ReserveStruct(0, 0, 0, 0);
        supportedAssets.push(LINK);
        liquidity[DAI] = ReserveStruct(0, 0, 0, 0);
        supportedAssets.push(DAI);
        liquidity[WETH] = ReserveStruct(0, 0, 0, 0);
        supportedAssets.push(WETH);

        conversion = new Conversion();
        uniswap = new Uniswap();

        _setupRole(ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN_ROLE, address(this));
    }

    modifier onlyOwner() {
        require(hasRole(ADMIN_ROLE, msg.sender), "must have admin role");
        _;
    }

    function addOwner(address newOwner) public onlyOwner {
        _setupRole(ADMIN_ROLE, newOwner);
    }

    //update struct with new tokens
    function addSupportedAsset(address _assetContractAddress) public onlyOwner {
        liquidity[_assetContractAddress] = ReserveStruct(0, 0, 0, 0);
        supportedAssets.push(_assetContractAddress);
    }

    /// @notice 80% goes to liquidity, 20% goes to reserve
    /// @dev The calling address must approve this contract to spend at least `_quantity` worth of its asset for this function to succeed.
    /// @param _quantity The amount of asset to be deposited.
    /// @param _asset The asset to be desposited.
    /// @param _owner The address where asset comes from
    function depositTransfer(
        address _owner,
        address _asset,
        uint256 _quantity
    ) public onlyOwner {
        IERC20(_asset).transferFrom(_owner, address(this), _quantity);
        liquidity[_asset].LiqQty += ((8 * 10**17) * _quantity) / (10**18);
        liquidity[_asset].ResQty += ((2 * 10**17) * _quantity) / (10**18);
        emit poolTransferEvent(_owner, address(this), _asset, _quantity);
    }

    /// @notice repay goes to interest first, then principal
    /// @notice function receives repayment and updates borrow, liquid , interest amounts
    /// @dev The calling address must approve this contract to spend at least `_quantity` worth of its asset for this function to succeed.
    /// @param _quantity The amount of loan to be repayed.
    /// @param _asset The asset loan to be repayed.
    /// @param _owner The address where asset comes from
    /// @param _principalPortion how much of repayment goes to principal
    /// @param _interestPortion how much of repayment goes to interest
    function repayTransfer(
        address _owner,
        address _asset,
        uint256 _quantity,
        uint256 _principalPortion,
        uint256 _interestPortion
    ) public onlyOwner {
        IERC20(_asset).transferFrom(_owner, address(this), _quantity);
        liquidity[_asset].LiqQty += _principalPortion;
        liquidity[_asset].BorQty -= _principalPortion; // only subtract principal portion from intital loan quantity
        liquidity[_asset].interestQty += ((9 * _interestPortion) / 10); // 10% of interest is fee, so only .9 goes to pool
        emit poolTransferEvent(_owner, address(this), _asset, _quantity);
    }

    /// @notice transfer a loan to a user
    /// @param _quantity The amount of loan to be payed.
    /// @param _asset The asset to be loaned
    /// @param _borrower The address borrowing
    function borrowTransfer(
        address _borrower,
        address _asset,
        uint256 _quantity
    ) public onlyOwner {
        IERC20(_asset).transfer(_borrower, _quantity);
        (liquidity[_asset].LiqQty -= _quantity);
        (liquidity[_asset].BorQty += _quantity);
        emit poolTransferEvent(address(this), _borrower, _asset, _quantity);
    }

    /// @notice In the case of not enough liquidity or user didnt lend asset, user reserve to pay out redeem
    /// @notice If there is not enough in reserve,  swap other assets for desired asset
    /// @param _quantity The amount of deposit to be redeemed.
    /// @param _asset The asset to be redeemed for.
    /// @param _user The address where LEVR comes from
    function reserveWithdrawTransfer(
        address _user,
        address _asset,
        uint256 _quantity
    ) public onlyOwner {
        // Note HERE: swap if reserve not liquid enough
        if (liquidity[_asset].ResQty < _quantity) {
            //swap and add that to ResQty
            //fee for swapping: return 99% of value?
            uint256 swappedRatio = uniswapRebalanceInteraction(
                _asset,
                (_quantity - liquidity[_asset].ResQty)
            );
            swappedRatio = minimum(swappedRatio, 1 * 10**18);
            _quantity = (_quantity * swappedRatio) / (1 * 10**18);
        }

        (liquidity[_asset].ResQty -= minimum(
            _quantity,
            liquidity[_asset].ResQty
        )); //-= _quantity); // problem b/c then user might not be getting what they want?
        IERC20(_asset).transfer(_user, _quantity);
        balanceReserves(_asset);
        emit poolTransferEvent(address(this), _user, _asset, _quantity);
    }

    /// @notice pay out an asset when a user redeems LEVR
    /// @param _quantity The amount of deposit to be redeemed.
    /// @param _asset The asset to be redeemed for.
    /// @param _user The address where LEVR comes from
    function withdrawTransfer(
        address _user,
        address _asset,
        uint256 _quantity
    ) public onlyOwner {
        (liquidity[_asset].LiqQty -= _quantity); // remove from liquid pool
        IERC20(_asset).transfer(_user, _quantity); // transfer ownership of desired currency
        //balanceReserves(_asset);
        emit poolTransferEvent(address(this), _user, _asset, _quantity);
    }

    /// @notice keeps reserves at 20% of total asset pool
    /// @param _asset asset pool to balance
    function balanceReserves(address _asset) public onlyOwner {
        //need to make sure there is enough liquid when transfering back to reserve
        uint256 properBalance = ((2 * 10**17) *
            (liquidity[_asset].LiqQty +
                liquidity[_asset].ResQty +
                liquidity[_asset].BorQty)) / (10**18); // correct 20% ratio

        if (liquidity[_asset].ResQty > properBalance) {
            liquidity[_asset].LiqQty += (liquidity[_asset].ResQty -
                properBalance);
            liquidity[_asset].ResQty -= (liquidity[_asset].ResQty -
                properBalance);
        } else if (liquidity[_asset].ResQty < properBalance) {
            if (
                // make sure enough liquid to move to reserve
                liquidity[_asset].LiqQty >=
                (properBalance - liquidity[_asset].ResQty)
            ) {
                liquidity[_asset].LiqQty -= (properBalance -
                    liquidity[_asset].ResQty);
                liquidity[_asset].ResQty += (properBalance -
                    liquidity[_asset].ResQty);
            }
        }
    }

    /// @notice update recieved collateral from collateral contract default
    function recieveDefaultCollateral(address _asset, uint256 _quantity)
        public
        onlyOwner
    {
        liquidity[_asset].ResQty += (98 * _quantity) / 100;
        // 2% of default is taken as fee
    }

    /// @notice if user defaults, need to put interest payment and liquidity back into pool where they took from
    function replenishPoolOnDefault(address _asset, uint256 _quantity)
        public
        onlyOwner
    {
        //Note: also swap here if reserve is too low to move this _quantity
        if (liquidity[_asset].ResQty < _quantity) {
            //swap
            //fee for swapping: return 99% of value?
            uint256 swappedRatio = uniswapRebalanceInteraction(
                _asset,
                (_quantity - liquidity[_asset].ResQty)
            );
            _quantity = (_quantity * swappedRatio) / (1 * 10**18);
        }
        liquidity[_asset].ResQty -= _quantity;

        liquidity[_asset].LiqQty += (95 * _quantity) / 100;
        liquidity[_asset].interestQty += ((5 * _quantity) / 100);
    }

    /// @notice swap for asset if not enough in contract
    /// @param _asset the asset we want to swap for
    /// @param _quantity amount of _aaset to send for swap
    function uniswapRebalanceInteraction(address _asset, uint256 _quantity)
        public
        onlyOwner
        returns (uint256)
    {
        /* NOTE: must be able to pull all if they have all (in theory), but only pull from other assets
         * swap as needed- if someone wants to withdraw any currency, make sure there is enough in reserve
         * if not swap the reserves+liquid to fill required amount of desired asset

         * USD requested asset
         * USD total res+liq 
         * ratio: r1 = ((USD requested asset)*10**18)/(USD total reserves+LiqQty)
         * loop through all assets multiply ResQty,LiqQty by (1-r1); swap r1*(resQty+LiqQty) for _asset
         */
        uint256 assetPrice = conversion.getPrice(_asset);
        uint256 requestedAssetUSD = (assetPrice * _quantity) / (10**18);
        //uint256 totalAvailableUSD = getWithdrawableUSD();
        uint256 pullRatio = minimum(
            (requestedAssetUSD * (1 * 10**18)) /
                (getWithdrawableUSD() -
                    (liquidity[_asset].ResQty * assetPrice)),
            1 * 10**18
        ); //minium of this and 1?
        //uint256 numberAddresses = supportedAssets.length; //uint16?
        uint256 totalSwappedQuantity = 0;
        for (uint16 i = 0; i < supportedAssets.length; i++) {
            // stack too deep error made me comment out a few of these
            address asset = supportedAssets[i];
            uint256 balance = (liquidity[asset].LiqQty +
                liquidity[asset].ResQty);
            uint256 amountIn = ((pullRatio * balance) / (1 * 10**18));

            IERC20(asset).approve(address(uniswap), amountIn);

            if ((_asset == WETH) && (_asset != asset) && (balance > 10**9)) {
                uint256 swappedQuantity = uniswap.swapExactInputSingleOutWETH(
                    asset,
                    amountIn
                );

                totalSwappedQuantity += swappedQuantity;
            } else if (
                (asset == WETH) && (asset != _asset) && (balance > 10**9)
            ) {
                uint256 swappedQuantity = uniswap.swapExactInputSingleInWETH(
                    amountIn,
                    _asset
                );

                totalSwappedQuantity += swappedQuantity;
            } else if ((asset != _asset) && ((balance) > 10**9)) {
                //takes _assetIn, _amountIn, _assetOut
                uint256 swappedQuantity = uniswap.swapExactInputMultihop(
                    asset,
                    amountIn,
                    _asset
                );

                totalSwappedQuantity += swappedQuantity;
            }
        }
        //move proportional liqudity in desired _asset liquid pool to reserve pool
        liquidity[_asset].ResQty +=
            (liquidity[_asset].LiqQty * (pullRatio)) /
            (10**18);
        liquidity[_asset].LiqQty =
            (liquidity[_asset].LiqQty * (1 * 10**18 - pullRatio)) /
            (10**18);

        liquidity[_asset].ResQty += totalSwappedQuantity;
        // return ratio so we know what to send to user with a possible tiny built in fee: (USD amount of swapped asset) / (USD amount intended of asset)
        return (totalSwappedQuantity * assetPrice) / (requestedAssetUSD);
    }

    function getLiquidQuantity(address _asset) public view returns (uint256) {
        return liquidity[_asset].LiqQty;
    }

    function getBorrowQuantity(address _asset) public view returns (uint256) {
        return liquidity[_asset].BorQty;
    }

    function getReserveQuantity(address _asset) public view returns (uint256) {
        return liquidity[_asset].ResQty;
    }

    function getInterestQuantity(address _asset) public view returns (uint256) {
        return liquidity[_asset].interestQty;
    }

    /// @notice function that shows annual interest rates
    /// @param _asset The asset we want the rate  of
    function annualBorrowInterestRate(address _asset)
        public
        view
        returns (uint256)
    {
        uint256 UtilizationRate = 1 * 10**18 - getLiquidPct(_asset);
        return ((15 * 10**15) +
            ((8 * ((UtilizationRate**4) / (10**18)**2)) / (10**20)));
    }

    /// @notice function that shows annual lend interest rates
    /// @param _asset The asset we want the rate  of
    function annualLendInterestRate(
        address _asset,
        uint256 timeOfLastTransaction
    ) public view returns (uint256) {
        uint256 APR = (liquidity[_asset].BorQty *
            annualBorrowInterestRate(_asset)) /
            (liquidity[_asset].LiqQty +
                liquidity[_asset].ResQty +
                liquidity[_asset].BorQty);

        return APR;
    }

    /// @notice transfer fees to owner
    function transferFees(address contractOwner) public onlyOwner {
        /*
         * loop through each assset:
         * difference of pool -  (pool interst+ reserve+liquid) is fee amount
         * transfer that to owner
         */
        uint256 numberAddresses = supportedAssets.length;
        //loop to calculate the value of the pool liquid + borrowed
        for (uint16 i = 0; i < numberAddresses; i++) {
            address asset = supportedAssets[i];

            uint256 feeQuantity = IERC20(asset).balanceOf(address(this)) -
                (liquidity[asset].LiqQty +
                    liquidity[asset].ResQty +
                    liquidity[asset].interestQty);

            IERC20(asset).transfer(contractOwner, feeQuantity);
        }
    }

    /// @notice interest using time between each transaction
    function InterestRate(address _asset, uint256 timeOfLastTransaction)
        public
        view
        returns (uint256)
    {
        uint256 UtilizationRate = 1 * 10**18 - getLiquidPct(_asset);
        uint256 timeDelta = ((block.timestamp) - timeOfLastTransaction);
        return
            (timeDelta *
                ((15 * 10**15) +
                    ((8 * ((UtilizationRate**4) / (10**18)**2)) / (10**20)))) /
            (31556952); // seconds since last interest accruel * seconds per year
    }

    /// @notice function that shows how much assets can be removed in USD
    function getWithdrawableUSD() public view returns (uint256) {
        uint256 totalWithdrawableValue = 0;

        // make this less bits?
        uint256 numberAddresses = supportedAssets.length;
        //loop to calculate the value of the pool liquid + borrowed
        for (uint16 i = 0; i < numberAddresses; i++) {
            address asset = supportedAssets[i];

            totalWithdrawableValue += (((liquidity[asset].LiqQty +
                liquidity[asset].ResQty) * conversion.getPrice(asset)) /
                (1 * 10**18));
        }
        return totalWithdrawableValue;
    }

    /// @notice function that shows total pool USD value
    function getTotalPool() public view returns (uint256) {
        uint256 totalPoolValue = 0;

        // make this less bits?
        uint256 numberAddresses = supportedAssets.length;
        //loop to calculate the value of the pool liquid + borrowed
        for (uint16 i = 0; i < numberAddresses; i++) {
            address asset = supportedAssets[i];

            totalPoolValue += (((liquidity[asset].LiqQty +
                liquidity[asset].BorQty +
                liquidity[asset].ResQty) * conversion.getPrice(asset)) /
                (1 * 10**18));
        }
        return totalPoolValue;
    }

    function resetInterest(address _asset) public onlyOwner {
        liquidity[_asset].LiqQty += liquidity[_asset].interestQty;
        liquidity[_asset].interestQty = 0;
    }

    function getLiquidPct(address _asset) public view returns (uint256) {
        if (liquidity[_asset].LiqQty > 0 || liquidity[_asset].BorQty > 0) {
            return
                (liquidity[_asset].LiqQty * (1 * 10**18)) /
                (liquidity[_asset].LiqQty + liquidity[_asset].BorQty);
        } else {
            return 1 * 10**18;
        }
    }

    function getBalance(address _assetAddress) public view returns (uint256) {
        return IERC20(_assetAddress).balanceOf(address(this));
    }

    function assetsSupported() public view returns (address[] memory) {
        return supportedAssets;
    }

    function getTotalLend(address _asset) public view returns (uint256) {
        return (liquidity[_asset].LiqQty +
            liquidity[_asset].BorQty +
            liquidity[_asset].ResQty);
    }

    function totalInterest(address _asset) public view returns (uint256) {
        return liquidity[_asset].interestQty;
    }

    function getTimeDelta(uint256 oldTimeStamp) public view returns (uint256) {
        return ((block.timestamp) - oldTimeStamp);
    }

    function minimum(uint256 a, uint256 b) internal pure returns (uint256) {
        return a.min(b);
    }
}
