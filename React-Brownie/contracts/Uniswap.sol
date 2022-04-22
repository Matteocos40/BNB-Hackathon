// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
pragma abicoder v2;

//import "@Uniswap/contracts/interfaces/ISwapRouter.sol";
import "../interfaces/ISwapRouter.sol";
import "uniswap/v3-periphery@1.0.0/contracts/libraries/TransferHelper.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Uniswap {
    //We need to inherit the swap router safely instead of pass it in
    ISwapRouter public immutable swapRouter;

    address public constant LINK = 0x01BE23585060835E02B77ef475b0Cc51aA1e0709;
    address public constant WETH = 0xc778417E063141139Fce010982780140Aa0cD5Ab;
    address public constant DAI = 0x5592EC0cfb4dbc12D3aB100b257153436a1f0FEa;

    // set the pool fee to 0.3%, should be dynamic
    uint24 public constant poolFee = 3000;

    constructor() {
        swapRouter = ISwapRouter(0xE592427A0AEce92De3Edee1F18E0157C05861564); //address on Rinkeby- same on mainnet?
    }

    /// @notice swapInputMultiplePools swaps a fixed amount of one asset for a maximum possible amount of a different asset through an intermediary pool.
    /// @dev The calling address must approve this contract to spend at least `amountIn` worth of its DAI for this function to succeed.
    /// @param _amountIn The amount of asset to be swapped.
    /// @param _assetIn The asset to be swapped.
    /// @param _assetOut The _asset to be swapped for.
    /// @return amountOut The amount of WETH9 received after the swap.
    function swapExactInputMultihop(
        address _assetIn,
        uint256 _amountIn,
        address _assetOut
    ) external returns (uint256 amountOut) {
        // Transfer `amountIn` of DAI to this contract.
        TransferHelper.safeTransferFrom(
            _assetIn,
            msg.sender,
            address(this),
            _amountIn
        );

        // Approve the router to spend DAI.
        TransferHelper.safeApprove(_assetIn, address(swapRouter), _amountIn);

        // Multiple pool swaps are encoded through bytes called a `path`. A path is a sequence of token addresses and poolFees that define the pools used in the swaps.
        // The format for pool encoding is (tokenIn, fee, tokenOut/tokenIn, fee, tokenOut) where tokenIn/tokenOut parameter is the shared token across the pools.
        // Since we are swapping DAI to USDC and then USDC to WETH9 the path encoding is (DAI, 0.3%, USDC, 0.3%, WETH9).
        ISwapRouter.ExactInputParams memory params = ISwapRouter
            .ExactInputParams({
                path: abi.encodePacked(
                    _assetIn,
                    poolFee,
                    WETH,
                    poolFee,
                    _assetOut
                ),
                recipient: msg.sender,
                deadline: block.timestamp,
                amountIn: _amountIn,
                amountOutMinimum: 0
            });

        // Executes the swap.
        amountOut = swapRouter.exactInput(params);
    }

    /// @notice this is called to swap an amount of an asset for a miximal amount of WETH
    /// @dev The calling address must approve this contract to spend at least `amountIn` worth of its DAI for this function to succeed.
    /// @param _amountIn The amount of asset to be swapped.
    /// @param _assetIn The asset to be swapped.
    /// @return amountOut The amount of WETH9 received after the swap.
    function swapExactInputSingleOutWETH(address _assetIn, uint256 _amountIn)
        external
        returns (uint256 amountOut)
    {
        // msg.sender must approve this contract

        // Transfer the specified amount of DAI to this contract.
        TransferHelper.safeTransferFrom(
            _assetIn,
            msg.sender,
            address(this),
            _amountIn
        );

        // Approve the router to spend DAI.
        TransferHelper.safeApprove(_assetIn, address(swapRouter), _amountIn);

        // Naively set amountOutMinimum to 0. In production, use an oracle or other data source to choose a safer value for amountOutMinimum.
        // We also set the sqrtPriceLimitx96 to be 0 to ensure we swap our exact input amount.
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
            .ExactInputSingleParams({
                tokenIn: _assetIn,
                tokenOut: WETH,
                fee: poolFee,
                recipient: msg.sender,
                deadline: block.timestamp,
                amountIn: _amountIn,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            });

        // The call to `exactInputSingle` executes the swap.
        amountOut = swapRouter.exactInputSingle(params);
    }

    // is asset == WETH
    /// @notice This function is used when we are swapping WETH for an asset
    /// @dev The calling address must approve this contract to spend at least `amountIn` worth of its DAI for this function to succeed.
    /// @param _amountIn The amount of asset to be swapped.
    /// @param _assetOut The _asset to be swapped for.
    /// @return amountOut The amount of WETH9 received after the swap.
    function swapExactInputSingleInWETH(uint256 _amountIn, address _assetOut)
        external
        returns (uint256 amountOut)
    {
        // msg.sender must approve this contract

        // Transfer the specified amount of DAI to this contract.
        TransferHelper.safeTransferFrom(
            WETH,
            msg.sender,
            address(this),
            _amountIn
        );

        // Approve the router to spend DAI.
        TransferHelper.safeApprove(WETH, address(swapRouter), _amountIn);

        // Naively set amountOutMinimum to 0. In production, use an oracle or other data source to choose a safer value for amountOutMinimum.
        // We also set the sqrtPriceLimitx96 to be 0 to ensure we swap our exact input amount.
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
            .ExactInputSingleParams({
                tokenIn: WETH,
                tokenOut: _assetOut,
                fee: poolFee,
                recipient: msg.sender,
                deadline: block.timestamp,
                amountIn: _amountIn,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            });

        // The call to `exactInputSingle` executes the swap.
        amountOut = swapRouter.exactInputSingle(params);
    }
}
