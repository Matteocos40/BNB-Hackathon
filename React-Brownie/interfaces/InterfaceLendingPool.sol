// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface InterfaceLendingPool {
    function Deposit(uint256 _quantity, address _asset) external;

    function Withdraw(address _desiredAsset, uint256 _tokenQuantity) external;

    function Borrow(
        uint256 _borrowQuantity,
        address _asset,
        uint256 _collateralQuantity,
        address _collateral
    ) external;

    function Repay(address _asset, uint256 _repayQuantity) external;

    function unlockCollateral(
        address _asset,
        uint256 _quantity,
        bool _toPool
    ) external;

    function totalValueBorrowed(address _borrower)
        external
        view
        returns (uint256);

    function interestQuantity(address _user, address _asset)
        external
        view
        returns (uint256);

    function getLiquidity(address _token) external view returns (uint256);

    function getTotalBorrow(address _token) external view returns (uint256);

    function getPoolBalance(address _token) external view returns (uint256);

    function getLiquidPct(address _token) external view returns (uint256);

    function getLockedCollateral(address _token)
        external
        view
        returns (uint256);

    function getCollBalance(address _token) external view returns (uint256);

    function getTokenAddr() external view returns (address);

    function getTokenDollarValue() external view returns (uint256);

    function getPoolValue() external view returns (uint256);

    function getTotalSupply() external view returns (uint256);

    function getBalanceOf(address _user) external view returns (uint256);

    function getCollateralValue(address _user) external view returns (uint256);

    function getOutstandingLoan(address _user, address _asset)
        external
        view
        returns (uint256);

    function getUserCollateral(address _user, address _asset)
        external
        view
        returns (uint256);

    function getLentAmount(address _user) external view returns (uint256);

    function getInterestQuantity(address _asset)
        external
        view
        returns (uint256);

    function getPoolAddr() external view returns (address);

    function getCollAddr() external view returns (address);

    function getInterestRate(address _asset) external view returns (uint256);

    function getAnnualBorrowInterestRate(address _asset)
        external
        view
        returns (uint256);
}
