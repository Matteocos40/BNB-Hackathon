// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

// Get the latest ___/USD price from chainlink price feed
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract Conversion {
    mapping(address => address) public priceFeedMap;

    /*
     *rinkeby LINK contract location: 0x01BE23585060835E02B77ef475b0Cc51aA1e0709
     *rinkeby DAI  contract location: 0x5592EC0cfb4dbc12D3aB100b257153436a1f0FEa
     *rinkeby WETH contract location: 0xc778417E063141139Fce010982780140Aa0cD5Ab
     */

    constructor() {
        //rinkeby addresses
        // priceFeedMap["eth"] = 0x8A753747A1Fa494EC906cE90E9f37563A8AF630e;
        // priceFeedMap["dai"] = 0x2bA49Aaa16E6afD2a993473cfB70Fa8559B523cF;
        // priceFeedMap["atom"] = 0x3539F2E214d8BC7E611056383323aC6D1b01943c;
        // priceFeedMap["ltc"] = 0x4d38a35C2D87976F334c2d2379b535F1D461D9B4;
        // priceFeedMap["link"] = 0xd8bD0a1cB028a31AA859A21A3758685a95dE4623;
        // priceFeedMap["matic"] = 0x7794ee502922e2b723432DDD852B3C30A911F021;
        // priceFeedMap["btc"] = 0xECe365B379E1dD183B20fc5f022230C044d51404;
        // priceFeedMap["usdc"] = 0xa24de01df22b63d23Ebc1882a5E3d4ec0d907bFB;
        // priceFeedMap["xrp"] = 0xc3E76f41CAbA4aB38F00c7255d4df663DA02A024;

        //rinkeby addresses using token contract addresses
        // should have all possible tokens even if they are not yet supported
        priceFeedMap[
            0x01BE23585060835E02B77ef475b0Cc51aA1e0709
        ] = 0xd8bD0a1cB028a31AA859A21A3758685a95dE4623; //LINK
        priceFeedMap[
            0x5592EC0cfb4dbc12D3aB100b257153436a1f0FEa
        ] = 0x2bA49Aaa16E6afD2a993473cfB70Fa8559B523cF; //DAI
        priceFeedMap[
            0xc778417E063141139Fce010982780140Aa0cD5Ab
        ] = 0x8A753747A1Fa494EC906cE90E9f37563A8AF630e; //WETH
    }

    // safe math library check uint256 for integer overflows
    using SafeMath for uint256;

    /// @notice calculate USD value of a token
    /// @param tokenContractAddress token to be determined in USD
    function getPrice(address tokenContractAddress)
        public
        view
        returns (uint256)
    {
        AggregatorV3Interface priceFeed = AggregatorV3Interface(
            priceFeedMap[tokenContractAddress]
        );
        (, int256 answer, , , ) = priceFeed.latestRoundData();
        // ___/USD rate in 18 digit
        return uint256(answer * 10000000000);
    }
}
