// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "../interfaces/InterfaceLendingPool.sol";
import "./Math.sol";
import "./Pool.sol";
import "./Collateral.sol";
import "./LVRToken.sol";
import "./Conversion.sol";

contract LendingPool is InterfaceLendingPool, AccessControlEnumerable {
    //need to inheret InterfaceLendingPool?
    //using SafeMath for uint256; dont need it 0.8.0
    using Math for uint256;

    event depositEvent(
        address _user,
        address _asset,
        uint256 _quantity,
        uint256 _tokensMinted
    );
    event borrowEvent(
        address _user,
        uint256 _borrowed,
        address _borrowedAsset,
        uint256 _collateral,
        address _collateralAsset
    );
    event redeemEvent(address _user, address _asset, uint256 _tokensBurned);
    event repayEvent(address _user, address _asset, uint256 _quantity);
    event withdrawCollateralEvent(
        address _user,
        address _asset,
        uint256 _quantity
    );

    //time to track last interest accruel
    uint256 interestTime = block.timestamp;

    //create other contracts
    Conversion conversion;
    Pool pool;
    Collateral collateral;
    LVRToken token;
    address owner;

    //mapps asset address to total asset lent
    mapping(address => uint256) lenderTokenTracker;

    address[] supportedAssets; //supported assets arra
    // supported to bool - check if its supported
    mapping(address => bool) supportedAssetTracker;

    struct borrowAmountTracker {
        uint256 principal;
        uint256 interest;
    }
    //asset -> user -> amount borrowed
    mapping(address => mapping(address => borrowAmountTracker))
        public borrowTracker;

    //asset -> user -> amount lent
    mapping(address => mapping(address => uint256)) LentAmountTracker;

    //asset -> list of borrowers
    mapping(address => address[]) borrowersByAsset;

    //mapping to make sure no double adding:
    mapping(address => mapping(address => bool)) initializedBorrowerTracker;

    //total list of borrowers
    address[] borrowers;
    //mapping to make sure no double adding:
    mapping(address => bool) initializedBorrowers;

    //asset -> list of borrowers
    mapping(address => address[]) lendersByAsset;
    //mapping to make sure no double adding:
    mapping(address => mapping(address => bool)) initializedLenderTracker;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    constructor() {
        pool = new Pool();
        token = new LVRToken("LeverToken", "LVR", address(pool));
        collateral = new Collateral(address(pool));
        conversion = new Conversion();

        //set up supported currencies
        /*
         *rinkeby LINK contract location: 0x01BE23585060835E02B77ef475b0Cc51aA1e0709
         *rinkeby DAI  contract location: 0x5592EC0cfb4dbc12D3aB100b257153436a1f0FEa
         *rinkeby WETH contract location: 0xc778417E063141139Fce010982780140Aa0cD5Ab
         */
        address WETH = 0xc778417E063141139Fce010982780140Aa0cD5Ab;
        address LINK = 0x01BE23585060835E02B77ef475b0Cc51aA1e0709;
        address DAI = 0x5592EC0cfb4dbc12D3aB100b257153436a1f0FEa;

        supportedAssets.push(LINK);
        supportedAssetTracker[LINK] = true;
        supportedAssets.push(DAI);
        supportedAssetTracker[DAI] = true;
        supportedAssets.push(WETH);
        supportedAssetTracker[WETH] = true;

        owner = msg.sender;
        _setupRole(ADMIN_ROLE, msg.sender);
        pool.addOwner(address(collateral));
        _setupRole(ADMIN_ROLE, address(this));
    }

    modifier onlyOwner() {
        require(hasRole(ADMIN_ROLE, msg.sender), "must have admin role");
        _;
    }

    /// @notice function takes asset and quanity and mints user LVR tokens for equivalent USD value
    /// @dev The calling address must approve this contract to spend at least _quantity worth of its _asset for this function to succeed.
    /// @param _quantity The asset Quantity being deposited
    /// @param _asset The asset address being deposited
    function Deposit(uint256 _quantity, address _asset) public {
        require(supportedAssetTracker[_asset] == true, "asset not supported");

        accrueInterest();

        require(_quantity > 0, "deposit must be positive");
        uint256 tokenQuantity = token.mint(msg.sender, _quantity, _asset);
        //track how many LVR tokens use got
        lenderTokenTracker[msg.sender] += tokenQuantity;
        //actually move the tokens to pool
        pool.depositTransfer(msg.sender, _asset, _quantity); //possible issue- should we be minting before we get the money?

        //adds user to lender list if not already in it
        if (!initializedLenderTracker[_asset][msg.sender]) {
            lendersByAsset[_asset].push(msg.sender);
            initializedLenderTracker[_asset][msg.sender] = true;
        }
        //track how much asset lender gave
        LentAmountTracker[_asset][msg.sender] += _quantity;

        emit depositEvent(msg.sender, _asset, _quantity, tokenQuantity);
    }

    // //withdraw based on asset quantity desired
    // function Withdraw(address _desiredAsset, uint256 _amountToRemove) public {
    //     uint256 assetPriceUSD = conversion.getPrice(_desiredAsset);

    //     //check if enough liquid to send
    //     require(
    //         _amountToRemove <= pool.getLiquidQuantity(_desiredAsset),
    //         "User cannot redeem more than the available balance"
    //     ); // future this will only check to see if we have any liquid - engine will swap currencies to allow user to withdraw anything they want.

    //     // total value of currency redeemable by user
    //     uint256 totalAssetValueFromOwnedTokens = ((token.balanceOf(msg.sender) *
    //         token.tokenDollarValue()) / assetPriceUSD); // Units: N token * USD/token / USD/currency = N currency

    //     // check that the user is allowed to redeem the amount
    //     // seems to be some precision errors
    //     require(
    //         (totalAssetValueFromOwnedTokens >= _amountToRemove),
    //         "Cannot redeem more tokens than number owned"
    //     );

    //     uint256 burnNumber = ((assetPriceUSD * _amountToRemove) /
    //         token.tokenDollarValue()); // Units: USD/currecny * N currency / (USD/token) = N token

    //     lenderTokenTracker[msg.sender] -= burnNumber;
    //     if (lenderTokenTracker[msg.sender] == 0) {
    //         delete lenderTokenTracker[msg.sender];
    //     }
    //     pool.withdrawTransfer(msg.sender, _desiredAsset, _amountToRemove);
    //     token.burn(msg.sender, burnNumber);
    // }

    //////////////// function if we want to withdraw based on LVR token quanitity//////////////////

    /// @notice function takes asset and LVR token quanity and returns the max amount of _asset redeemable with _tokenQuantity
    /// @dev There are a bunch of checks to make sure there is enough liquidity and if not funds have to come from somewhere else
    /// @param _tokenQuantity Amount of LVR tokens to redeem for _asset
    /// @param _asset The desired asset to withdraw
    function Withdraw(address _asset, uint256 _tokenQuantity) public {
        //withdraw takes in desired asset and how much LVR you want to redeem

        require(supportedAssetTracker[_asset], "asset not supported");
        // check that the user is allowed to redeem the amount
        require(
            (token.balanceOf(msg.sender) >= _tokenQuantity),
            "Cannot redeem more tokens than number owned"
        );

        //makre sure enough currency can be converted to desired currency
        require(
            pool.getWithdrawableUSD() >=
                ((_tokenQuantity * token.tokenDollarValue()) / (10**18)),
            "Not enough free funds"
        );

        accrueInterest();

        uint256 assetPriceUSD = conversion.getPrice(_asset);

        // total value of currency redeemable by user
        uint256 totalAssetFromTokens = ((_tokenQuantity *
            token.tokenDollarValue()) / assetPriceUSD); // Units: N token * USD/token / USD/currency = N currency

        //burn LVR tokens
        token.burn(msg.sender, _tokenQuantity);
        //remove tokens from tracker
        lenderTokenTracker[msg.sender] -= _tokenQuantity;
        if (lenderTokenTracker[msg.sender] == 0) {
            delete lenderTokenTracker[msg.sender]; // does delete work/make sense?
        }

        if (LentAmountTracker[_asset][msg.sender] == 0) {
            //if they didnt lend the asset, withraw comes from reserve// make sure reserve has enough

            //minumum(totalAssetFromTokens, pool.getReserveQuantity(_asset));
            //min(amount in reserve, amount from tokens)
            //remove from reserve only
            //leftover request will not be withdrawn
            // burn/subtract tokens from assetwithdrawn

            /*
             *try catch here
             */
            pool.reserveWithdrawTransfer(
                msg.sender,
                _asset,
                totalAssetFromTokens
            );
            // try
            //     pool.reserveWithdrawTransfer(
            //         msg.sender,
            //         _asset,
            //         totalAssetFromTokens
            //     )
            // {} catch Error(string memory) {
            //     revert("pool issue");
            // }
        } else if (
            LentAmountTracker[_asset][msg.sender] < totalAssetFromTokens
        ) {
            uint256 quantityFromReserves = totalAssetFromTokens -
                LentAmountTracker[_asset][msg.sender];

            if (
                LentAmountTracker[_asset][msg.sender] >
                pool.getLiquidQuantity(_asset)
            ) {
                //transfer from reserve if pool doesnt have enough liquidity

                uint256 residualQuantity = (totalAssetFromTokens -
                    pool.getLiquidQuantity(_asset));

                pool.withdrawTransfer(
                    msg.sender,
                    _asset,
                    pool.getLiquidQuantity(_asset)
                );

                pool.reserveWithdrawTransfer(
                    msg.sender,
                    _asset,
                    residualQuantity
                );
            } else {
                pool.withdrawTransfer(
                    msg.sender,
                    _asset,
                    LentAmountTracker[_asset][msg.sender]
                );

                pool.reserveWithdrawTransfer(
                    msg.sender,
                    _asset,
                    quantityFromReserves
                );
            }
            LentAmountTracker[_asset][msg.sender] = 0;
            //pool.balanceReserves(_asset);
        } else {
            uint256 assetQuantity = minimum(
                totalAssetFromTokens,
                LentAmountTracker[_asset][msg.sender]
            );
            LentAmountTracker[_asset][msg.sender] -= assetQuantity;
            if (assetQuantity > pool.getLiquidQuantity(_asset)) {
                //transfer from reserve if pool doesnt have enough liquidity

                uint256 residualReserve = (assetQuantity -
                    pool.getLiquidQuantity(_asset));

                pool.withdrawTransfer(
                    msg.sender,
                    _asset,
                    pool.getLiquidQuantity(_asset)
                );
                pool.reserveWithdrawTransfer(
                    msg.sender,
                    _asset,
                    residualReserve
                );
            } else {
                pool.withdrawTransfer(msg.sender, _asset, totalAssetFromTokens);
            }
            //If they lent more than withdrawing, subtract total withdraw from amount lent
            //pool.balanceReserves(_asset);
        }
        // here we should first replenish reserve using the reservs from other coins
        //pool.balanceReserves(_asset); //balance here or onyl when asset is removed by same asset lender?// or only on  reserve wiyhdraw transfer in pool contract
        emit redeemEvent(msg.sender, _asset, _tokenQuantity);
    }

    /// @notice function takes _asset / _borrowQuantity <- assets/amount to borrow, and _collateral / _collateralQuantity <- collateral asset/amount
    /// @dev The calling address must approve this contract to pull _collateralQuantity amount of _collateral asset
    /// @param _borrowQuantity Amount of _asset to borrow
    /// @param _asset The desired asset to borrow
    /// @param _collateralQuantity Amount of _collateral asset to use a collateral
    /// @param _collateral The asset to be used as colalteral
    function Borrow(
        uint256 _borrowQuantity,
        address _asset,
        uint256 _collateralQuantity,
        address _collateral
    ) public {
        //this function allows a user to deposit collateral, borrow, or both

        require(supportedAssetTracker[_asset], "asset not supported");
        require(supportedAssetTracker[_collateral], "asset not supported");

        require( // check if pool has funds
            ((_borrowQuantity <= pool.getLiquidQuantity(_asset))),
            "not enough liquidity to borrow"
        ); // can only borrow from liquid pool

        accrueInterest();

        // check if deposited collateral + outstanding collateral is enough to cover thier borrow request
        uint256 usdCollateralValueScaled = ((conversion.getPrice(_collateral) *
            _collateralQuantity) / collateral.collReqByAsset(_collateral)) +
            collateral.scaledCollateralValue(msg.sender); //scaled value is adjusted for risk

        uint256 usdBorrowValue = (conversion.getPrice(_asset) *
            _borrowQuantity) /
            (10**18) +
            totalValueBorrowed(msg.sender);

        require(
            usdCollateralValueScaled >= usdBorrowValue,
            "not enough collateral to borrow"
        );

        if (_collateralQuantity > 0) {
            //transfer from thier wallet to collateral contract
            collateral.depositCollateral(
                msg.sender,
                _collateral,
                _collateralQuantity
            );
        }

        //transfer loan from pool contract to user
        if (_borrowQuantity > 0) {
            pool.borrowTransfer(msg.sender, _asset, _borrowQuantity);

            //add quantity to principal loan value
            borrowTracker[_asset][msg.sender].principal += _borrowQuantity;

            //only add to array if user doesnt exist already
            if (!initializedBorrowerTracker[_asset][msg.sender]) {
                borrowersByAsset[_asset].push(msg.sender);
                initializedBorrowerTracker[_asset][msg.sender] = true;
            }

            //only add user if it doesnt exist in borrower list already
            if (!initializedBorrowers[msg.sender]) {
                borrowers.push(msg.sender);
                initializedBorrowers[msg.sender] = true;
            }
            // rebalance reserve and pool
            pool.balanceReserves(_asset);
        }
        emit borrowEvent(
            msg.sender,
            _borrowQuantity,
            _asset,
            _collateralQuantity,
            _collateral
        );
    }

    /// @notice function takes _asset and repayQuantity which are how much of _asset loan user wants to repay
    /// @notice repaying loan involves returning borrowed asset quantity
    /// @dev The calling address must approve this contract to pull _repayQuantity amount of _asset
    /// @param _asset The desired asset loan to repay
    /// @param _repayQuantity Amount of loan to repay
    function Repay(address _asset, uint256 _repayQuantity) public {
        require(supportedAssetTracker[_asset], "asset not supported");

        accrueInterest();

        if (_repayQuantity == 1) {
            //repay all owed- dont need this?
            _repayQuantity = getOutstandingLoan(msg.sender, _asset);
        }

        //cant return more than borrowed
        require(
            (borrowTracker[_asset][msg.sender].principal +
                borrowTracker[_asset][msg.sender].interest) >= _repayQuantity,
            "Returned more than borrowed"
        );

        //remove interest first, then principal balance upon repayment
        uint256 interest_portion = minimum(
            _repayQuantity,
            borrowTracker[_asset][msg.sender].interest
        ); //  sub1 = min(repayment, interest)
        uint256 principal_portion = (_repayQuantity - interest_portion); //  principal_portion  = repayment - sub1
        //this after interest_portion and principal_portion so we can subtract this from brwQty in Pool.sol

        //transfer from wallet to pool cotract
        pool.repayTransfer(
            msg.sender,
            _asset,
            _repayQuantity,
            principal_portion,
            interest_portion
        );

        borrowTracker[_asset][msg.sender].principal -= principal_portion; //  subtract that from principal so that it goes to zero
        borrowTracker[_asset][msg.sender].interest -= interest_portion; //  subtract interest_portion from interest

        if (borrowTracker[_asset][msg.sender].principal == 0) {
            delete borrowTracker[_asset][msg.sender].principal; // delete?
        }
        if (borrowTracker[_asset][msg.sender].interest == 0) {
            delete borrowTracker[_asset][msg.sender].interest; //delete?
        }

        pool.balanceReserves(_asset);

        emit repayEvent(msg.sender, _asset, _repayQuantity);

        //interest is payed out everytime someone repays a loan
        payoutInterest();
    }

    /// @notice function allows user to unlock thier collateral if they are not borrowing, or if they repay part of loan
    /// @dev
    /// @param _asset The desired asset to unlock
    /// @param _quantity Amount of assset to unlock
    /// @param _toPool Boolean to decide if user will receive asset directly or deposit it to pool
    function unlockCollateral(
        address _asset,
        uint256 _quantity,
        bool _toPool
    ) public {
        require(supportedAssetTracker[_asset], "asset not supported");
        accrueInterest();
        //check if they have loan value less than collat value/collatQtyReq
        //all require checks must happen here first because we have to update our internal strcutures first before transfering
        //so that means transfer of collateral must go through.

        //make sure collateral covers loan value
        require(
            (collateral.scaledCollateralValue(msg.sender) -
                ((conversion.getPrice(_asset) * _quantity) /
                    collateral.collReqByAsset(_asset))) >=
                totalValueBorrowed(msg.sender),
            "Cannot withdraw collateral before paying back loan"
        );

        uint256 collateralDeposited = collateral.userCollateral(
            _asset,
            msg.sender
        );

        require(
            _quantity <= collateralDeposited,
            "Redeeming more collateral than deposited"
        );

        //tranfer to pool as a lender if True, else return to user
        if (_toPool == true) {
            uint256 tokenQuantity = token.mint(msg.sender, _quantity, _asset);
            lenderTokenTracker[msg.sender] += tokenQuantity;

            if (!initializedLenderTracker[_asset][msg.sender]) {
                lendersByAsset[_asset].push(msg.sender);
                initializedLenderTracker[_asset][msg.sender] = true;
            }
            LentAmountTracker[_asset][msg.sender] += _quantity;
            emit depositEvent(msg.sender, _asset, _quantity, tokenQuantity);
        } else {
            emit withdrawCollateralEvent(msg.sender, _asset, _quantity);
        }
        collateral.removeCollateral(msg.sender, _asset, _quantity, _toPool);
    }

    //add interest to each borrower's balance
    // loop through asset, user of each asset, multiply principal by interest rate, add to interest balance
    function accrueInterest() internal {
        uint256 numAssets = supportedAssets.length;
        for (uint16 i = 0; i < numAssets; i++) {
            address asset = supportedAssets[i];
            uint256 numBorrowers = borrowersByAsset[asset].length;
            uint256 assetInterestRate = pool.InterestRate(asset, interestTime);
            for (uint16 j = 0; j < numBorrowers; j++) {
                address user = borrowersByAsset[asset][j];
                borrowTracker[asset][user].interest += ((assetInterestRate *
                    borrowTracker[asset][user].principal) / (1 * 10**18));
            }
        }
        interestTime = block.timestamp;
    }

    /// @notice function pays out interest to each lender
    /// @dev
    function payoutInterest() public onlyOwner {
        //accrueInterest(); should this be here? no because this is called in repay which calls accrue
        /*
        Note:  when calculating pool value, liquidity should be used, not balance of contract itself. 
`       For each asset
        1) need total amount of asset lent
        2) need how much each person lent of that asset
        3) ratio of those (call it r1) is how much of interest they get
        For each person:
        1) list of lenders
        2) how much they lent in lVR
        3) current number of LVR
        4) ratio of those(call it r2) is what they get of thier cut
        5) multiply r1*r2 to get total interest ratio recieved
        6) mint LVR for the value of r1*r2*totalInterest to payout
                if user withdraws, delete old lending stats, so if they re-deposit they start fresh
         */
        accrueInterest();
        uint256 numAssets = supportedAssets.length;
        for (uint16 i = 0; i < numAssets; i++) {
            address asset = supportedAssets[i];
            uint256 totalAsset = totalAssetLent(asset);
            uint256 interest = pool.getInterestQuantity(asset);
            uint256 numLenders = lendersByAsset[asset].length;
            for (uint16 j = 0; j < numLenders; j++) {
                address user = lendersByAsset[asset][j];
                if (token.balanceOf(user) < 1 * 10**16) {
                    //arbitrary cutoff^- should it be lower? this would be less than 1 cent
                    lenderTokenTracker[user] = 0;
                    LentAmountTracker[asset][user] = 0;
                    //token.burn(user, token.balanceOf(user)); // remove any dust from thier account- do we need this?
                    totalAsset = totalAssetLent(asset); // recalculate total lent if their's is removed
                } else {
                    uint256 retainedTokenRatio = (token.balanceOf(user) *
                        (10**18)) / lenderTokenTracker[user];
                    uint256 percentOfPool = (LentAmountTracker[asset][user] *
                        (10**18)) / totalAsset;
                    uint256 userInterestQuantity = (retainedTokenRatio *
                        percentOfPool *
                        interest) / ((10**18)**2);
                    uint256 tokenQuantity = token.mint(
                        user,
                        userInterestQuantity,
                        asset
                    ); //mint token since interest goes to pool, then
                    lenderTokenTracker[user] += tokenQuantity; //update how much lvr user has, then
                    LentAmountTracker[asset][user] += userInterestQuantity; //update how much they lent
                }
            }
            pool.resetInterest(asset);
        }
    }

    /// @notice function loops through users and ensures they are properly collateralized
    /// @dev
    function liquidationManager() public onlyOwner returns (string memory) {
        /*
        -loop maybe once per hour or day
        1) loop through borrowers, make sure collat value > collreq*loanValue
        2) if it is close, alert the user
        3) if below, scale thier loan value, transfer part of collat to pool, dont mint tokens
        */
        uint256 numBorrowers = borrowers.length;
        uint256 numAssets = supportedAssets.length;

        for (uint16 i = 0; i < numBorrowers; i++) {
            address user = borrowers[i];
            uint256 usdCollateralValueScaled = collateral.scaledCollateralValue(
                user
            );
            uint256 usdCollateralValue = collateral.collateralValue(user);
            uint256 usdBorrowValue = totalValueBorrowed(user);

            if (usdCollateralValueScaled < usdBorrowValue) {
                for (uint16 j = 0; j < numAssets; j++) {
                    address asset = supportedAssets[j];
                    uint256 multiplier = collateral.collReqByAsset(asset);
                    //set loan value lower
                    //transfer to pool without minting tokens

                    uint256 loanFactor = loanLiquidationFactor(
                        usdBorrowValue,
                        multiplier,
                        usdCollateralValue
                    ); // see function below

                    uint256 collFactor = collateralLiquidationFactor(
                        usdBorrowValue,
                        multiplier,
                        usdCollateralValue
                    ); //see function below

                    if (
                        borrowTracker[asset][user].principal > 0 ||
                        borrowTracker[asset][user].interest > 0
                    ) {
                        // amount of loan to move back into pool after siezing collateral
                        uint256 amountToReplenish = ((1 * 10**18) -
                            loanFactor) *
                            (borrowTracker[asset][user].interest +
                                borrowTracker[asset][user].principal);

                        //reduce their interest amount by the scalar
                        borrowTracker[asset][user].interest =
                            (borrowTracker[asset][user].interest * loanFactor) /
                            (10**18);

                        //reduce thier principal amount by the scalar
                        borrowTracker[asset][user].principal =
                            (borrowTracker[asset][user].principal *
                                loanFactor) /
                            (10**18);

                        //send equal amount from reserve to pool
                        pool.replenishPoolOnDefault(asset, amountToReplenish);
                    }

                    //now take thier collateral
                    if (collateral.userCollateral(user, asset) > 0) {
                        //take a proportion of collateral to put them back in the overcollateralized state
                        uint256 collatQuantity = (collateral.userCollateral(
                            user,
                            asset
                        ) * collFactor) / (10**18);
                        /*
                         * collat to reserve
                         * borrow asset to pool from reserve
                         */
                        //sends collat asset to pool
                        collateral.defaultCollateralTransfer(
                            user,
                            asset,
                            collatQuantity
                        );

                        //have pool account for this transfer
                        pool.recieveDefaultCollateral(asset, collatQuantity);
                    }
                    pool.balanceReserves(asset);
                }

                return ("Loan Partially Liquidated");
            } else if (
                usdCollateralValueScaled < (105 * usdBorrowValue) / 100
            ) {
                return (
                    "Liquidation Risk: Collateral value approaching LTV requirement"
                );
            }
        }

        //delete borrower if they repayed all- how?
        // if (totalValueBorrowed(msg.sender) == 0) {
        //     borrowers :remove (msg.sender);
        //     initializedBorrowers[msg.sender] = false;
        // }
    }

    //next 2 functoins: if undercollateralized, these are the factors to multiply loan or collat by to bring them back into correct proportions
    //these functions determine how much collat/loan needs to be siezed without taking all of it
    function loanLiquidationFactor(
        uint256 _loan,
        uint256 _multiplier,
        uint256 _collateral
    ) internal pure returns (uint256) {
        uint256 scale = (11 *
            10**17 *
            (((_loan * _multiplier) / 10**18) - _collateral)) /
            ((((_multiplier - 1 * 10**18) * _loan) / (1 * 10**18)));
        return (1 * 10**18 - scale); //multiply loan value by this
    }

    function collateralLiquidationFactor(
        uint256 _loan,
        uint256 _multiplier,
        uint256 _collateral
    ) internal pure returns (uint256) {
        uint256 scale = (11 *
            10**17 *
            (((_loan * _multiplier) / 10**18) - _collateral)) /
            ((((_multiplier - 1 * 10**18) * _collateral) / (1 * 10**18)));
        return (scale); //take this much from collat
    }

    // calculate USD value of loan- loops through assets for the specified user
    function totalValueBorrowed(address _borrower)
        public
        view
        returns (uint256)
    {
        uint256 totalBorrowValue = 0;

        // make this less bits?
        uint256 numAssets = supportedAssets.length;

        //loop to calculate the value of the pool liquid + borrowed
        for (uint16 i = 0; i < numAssets; i++) {
            address asset = supportedAssets[i];
            uint256 assetPrice = conversion.getPrice(asset);
            totalBorrowValue += (((borrowTracker[asset][_borrower].principal +
                borrowTracker[asset][_borrower].interest) * assetPrice) /
                (1 * 10**18));
        }
        return totalBorrowValue;
    }

    function interestQuantity(address _user, address _asset)
        public
        view
        returns (uint256)
    {
        return borrowTracker[_asset][_user].interest;
    }

    //total amount of a single asset lent
    function totalAssetLent(address _asset) internal view returns (uint256) {
        uint256 numLenders = lendersByAsset[_asset].length;
        uint256 totalLent = 0;

        for (uint16 i = 0; i < numLenders; i++) {
            totalLent += LentAmountTracker[_asset][lendersByAsset[_asset][i]];
        }
        return totalLent;
    }

    function getInterestRate(address _asset) public view returns (uint256) {
        return pool.InterestRate(_asset, interestTime);
    }

    function getAnnualBorrowInterestRate(address _asset)
        public
        view
        returns (uint256)
    {
        return (pool.annualBorrowInterestRate(_asset) * 100);
    }

    function getAnnualLendInterestRate(address _asset)
        public
        view
        returns (uint256)
    {
        return (pool.annualLendInterestRate(_asset, interestTime));
    }

    function minimum(uint256 a, uint256 b) internal pure returns (uint256) {
        return a.min(b);
    }

    function getLiquidity(address _token) public view returns (uint256) {
        return pool.getLiquidQuantity(_token);
    }

    function getTotalBorrow(address _token) public view returns (uint256) {
        return pool.getBorrowQuantity(_token);
    }

    function getPoolBalance(address _token) public view returns (uint256) {
        return pool.getBalance(_token);
    }

    function getLiquidPct(address _token) public view returns (uint256) {
        return pool.getLiquidPct(_token);
    }

    function getLockedCollateral(address _token) public view returns (uint256) {
        return collateral.getCollateralQuantity(_token);
    }

    function getCollBalance(address _token) public view returns (uint256) {
        return collateral.getBalance(_token);
    }

    function getPoolAddr() public view returns (address) {
        return address(pool);
    }

    function getCollAddr() public view returns (address) {
        return address(collateral);
    }

    function getTokenAddr() public view returns (address) {
        return address(token);
    }

    function getTokenDollarValue() public view returns (uint256) {
        return token.tokenDollarValue();
    }

    function getPoolValue() public view returns (uint256) {
        return pool.getTotalPool();
    }

    function getTotalSupply() public view returns (uint256) {
        return token.totalSupply();
    }

    function getBalanceOf(address _user) public view returns (uint256) {
        return token.balanceOf(_user);
    }

    function getCollateralValue(address _user) public view returns (uint256) {
        return collateral.collateralValue(_user);
    }

    function getOutstandingLoan(address _user, address _asset)
        public
        view
        returns (uint256)
    {
        return (borrowTracker[_asset][_user].principal +
            borrowTracker[_asset][_user].interest);
    }

    function getUserCollateral(address _user, address _asset)
        public
        view
        returns (uint256)
    {
        return collateral.userCollateral(_asset, _user);
    }

    function getTotalInterest(address _asset) public view returns (uint256) {
        return pool.totalInterest(_asset);
    }

    function getLentAmount(address _user) public view returns (uint256) {
        return lenderTokenTracker[_user];
    }

    function getTimeDelta() public view returns (uint256) {
        return pool.getTimeDelta(interestTime);
    }

    function getInterestQuantity(address _asset) public view returns (uint256) {
        return pool.getInterestQuantity(_asset);
    }

    function updateCollReqByAsset(address _asset, uint256 _updated_threshold)
        public
        onlyOwner
    {
        collateral.updateCollReqByAsset(_asset, _updated_threshold);
    }

    function updateSupportedAssets(address _asset) public onlyOwner {
        supportedAssets.push(_asset);
        pool.addSupportedAsset(_asset);
        collateral.addSupportedAsset(_asset);
    }

    function maxLoanValue(address _user) public view returns (uint256) {
        return collateral.scaledCollateralValue(_user);
    }

    function availableAssetLoan(address _asset, address _user)
        public
        view
        returns (uint256)
    {
        return
            ((maxLoanValue(_user) - totalValueBorrowed(_user)) * 10**18) /
            conversion.getPrice(_asset);
    }

    function getReserveBalance(address _asset) public view returns (uint256) {
        return pool.getReserveQuantity(_asset);
    }

    function collectFees() public onlyOwner {
        pool.transferFees(owner);
    }
}
