// contracts/LVRToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./Conversion.sol";
import "./Pool.sol";

contract LVRToken is AccessControlEnumerable, ERC20 {
    using SafeMath for uint256;
    Conversion public conversion;
    Pool public pool;
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor(
        string memory _name,
        string memory _symbol,
        address _poolContractAddress
    ) ERC20(_name, _symbol) {
        _setupRole(MINTER_ROLE, msg.sender);
        conversion = new Conversion();
        pool = Pool(_poolContractAddress);
    }

    function mint(
        address _to,
        uint256 _quantity,
        address _assetContractAddress
    ) public virtual returns (uint256) {
        require(
            hasRole(MINTER_ROLE, msg.sender),
            "must have minter role to mint"
        );
        uint256 usd_quantity = getTotalValue(_assetContractAddress, _quantity);
        uint256 amount = mintQuantity(usd_quantity);
        _mint(_to, amount);
        return amount;
    }

    // number of tokens to mint- takes input of USD dollar value of deposit
    function mintQuantity(uint256 _depositValue)
        internal
        view
        returns (uint256)
    {
        uint256 poolValue = (totalPoolValue());
        if (totalSupply() == 0) {
            return _depositValue;
        } else {
            return ((totalSupply() * _depositValue) / poolValue); //Units: N tokens * USD / USD = N tokens
        }
    }

    /// @notice gets total USD value of a currency desposited
    /// @param _asset asset address to value
    /// @param _quantity quantity of asset to value
    function getTotalValue(address _asset, uint256 _quantity)
        public
        view
        returns (uint256)
    {
        uint256 asset_price = conversion.getPrice(_asset);
        return ((asset_price * _quantity) / (1 * 10**18));
    }

    /// @notice returns USD value of one LEVR token
    function tokenDollarValue() public view returns (uint256) {
        require(totalSupply() > 0, "supply is zero");
        return ((totalPoolValue() * 10**18) / totalSupply()); // Dollar value times 10**18: ie output of 1.20*10**18 would be $1.20
    }

    function totalPoolValue() public view returns (uint256) {
        // return pool value
        return pool.getTotalPool();
    }

    /// @notice burns LEVR tokens from a user's address
    /// @param _formerOwner address to burn from
    /// @param _amountToBurn quantity of LEVR to burn in 10**18
    function burn(address _formerOwner, uint256 _amountToBurn) external {
        require(_amountToBurn > 0, "Amount to redeem needs to be > 0");
        // burns tokens equivalent to the amount requested
        _burn(_formerOwner, _amountToBurn);
    }
}
