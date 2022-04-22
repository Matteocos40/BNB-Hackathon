// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "./Pool.sol";
import "./LVRToken.sol";
import "./Conversion.sol";

contract Collateral is AccessControlEnumerable {
    using SafeMath for uint256;
    Conversion public conversion;

    event collateralTransferEvent(
        address _from,
        address _to,
        address _asset,
        uint256 _quantity
    );

    struct Lockup {
        uint256 lockQty;
    }

    mapping(address => Lockup) totalLock;

    mapping(address => uint256) collReq;

    //need to have mapping of all collat currency which will be used to calc USD value of collat
    mapping(address => mapping(address => uint256)) userColl;

    address[] supportedAssets;

    Pool public pool;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // public?
    constructor(
        address poolContractAddress //address tokenContractAddress,
    ) {
        pool = Pool(poolContractAddress);
        conversion = new Conversion();

        address WETH = 0xc778417E063141139Fce010982780140Aa0cD5Ab;
        address LINK = 0x01BE23585060835E02B77ef475b0Cc51aA1e0709;
        address DAI = 0x5592EC0cfb4dbc12D3aB100b257153436a1f0FEa;

        collReq[DAI] = 125 * 10**16; //DAI
        collReq[LINK] = 166 * 10**16; //LINK
        collReq[WETH] = 166 * 10**16; //WETH

        supportedAssets.push(DAI);
        supportedAssets.push(WETH);
        supportedAssets.push(LINK);

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

    function depositCollateral(
        address _borrower,
        address _asset,
        uint256 _quantity
    ) public onlyOwner {
        IERC20(_asset).transferFrom(_borrower, address(this), _quantity);
        totalLock[_asset].lockQty += _quantity;
        userColl[_asset][_borrower] += _quantity;

        emit collateralTransferEvent(
            _borrower,
            address(this),
            _asset,
            _quantity
        );
    }

    // borrower repays part of loan, so return proportional amount of collateral
    function removeCollateral(
        address _borrower,
        address _asset,
        uint256 _quantity,
        bool _toPool
    ) public onlyOwner {
        if (_toPool == true) {
            IERC20(_asset).approve(address(pool), _quantity);
            pool.depositTransfer(address(this), _asset, _quantity);
            emit collateralTransferEvent(
                address(this),
                address(pool),
                _asset,
                _quantity
            );
        } else {
            IERC20(_asset).transfer(_borrower, _quantity); //transfer collateral back to owner
            emit collateralTransferEvent(
                address(this),
                _borrower,
                _asset,
                _quantity
            );
        }

        userColl[_asset][_borrower] -= _quantity;
        if (userColl[_asset][_borrower] == 0) {
            delete userColl[_asset][_borrower];
            //delete element from array, or dont delete either?
        }
    }

    function collateralValue(address _borrower) public view returns (uint256) {
        uint256 totalCollateralValue = 0;

        // make this less bits?
        uint256 numberAssets = supportedAssets.length;
        //loop to calculate the value of the pool liquid + borrowed
        for (uint16 i = 0; i < numberAssets; i++) {
            totalCollateralValue +=
                ((userColl[supportedAssets[i]][_borrower]) *
                    conversion.getPrice(supportedAssets[i])) /
                (1 * 10**18);
        }

        return totalCollateralValue;
    }

    function defaultCollateralTransfer(
        address _borrower,
        address _asset,
        uint256 _quantity
    ) public onlyOwner {
        IERC20(_asset).transfer(address(pool), _quantity);
        emit collateralTransferEvent(
            address(this),
            address(pool),
            _asset,
            _quantity
        );

        userColl[_asset][_borrower] -= _quantity; //use min(userColl[_asset][_borrower], _quantity) to avoid errors?
        if (userColl[_asset][_borrower] == 0) {
            delete userColl[_asset][_borrower];
            //delete element from array, or dont delete either?
        }
    }

    /// @notice calculates value of user collateral divided by multiplier requirement
    function scaledCollateralValue(address _borrower)
        public
        view
        returns (uint256)
    {
        uint256 discountedCollateralValue = 0;

        // make this less bits?
        uint256 numberAssets = supportedAssets.length;
        //loop to calculate the value of the pool liquid + borrowed
        for (uint16 i = 0; i < numberAssets; i++) {
            address asset = supportedAssets[i];
            discountedCollateralValue +=
                ((userColl[asset][_borrower]) * conversion.getPrice(asset)) /
                (collReq[asset]);
        }
        return discountedCollateralValue;
    }

    function collReqByAsset(address _asset) public view returns (uint256) {
        return collReq[_asset];
    }

    function updateCollReqByAsset(address _asset, uint256 _updated_threshold)
        public
        onlyOwner
    {
        /*
         * LTV of .8 -> _updated_threshold = 1.25 or 125*10**16
         * LTV of .6 -> _updated_threshold = 1.66 or 166*10**16
         * LTV of .4 -> _updated_threshold = 2.5 or 25*10**17
         */
        collReq[_asset] = _updated_threshold;
    }

    function addSupportedAsset(address _asset) public onlyOwner {
        //standard multiplier applied to new assets
        supportedAssets.push(_asset);
        collReq[_asset] = 166 * 10**16;
    }

    function userCollateral(address _asset, address _user)
        public
        view
        returns (uint256)
    {
        return userColl[_asset][_user];
    }

    function getCollateralQuantity(address _asset)
        public
        view
        returns (uint256)
    {
        return totalLock[_asset].lockQty;
    }

    function getBalance(address _asset) public view returns (uint256) {
        return IERC20(_asset).balanceOf(address(this));
    }
}
