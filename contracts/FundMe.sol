// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
// 1.合约可以收集资产，创建一个收款函数
// 2.记录投资人，并且查看
// 3.在锁定期内，达到目标值，生产商可以提款
// 4.在锁定期内，没有达到目标值，投资人可以在锁定期之后退款

contract FundMe {
    AggregatorV3Interface public dataFeed;
    mapping (address => uint256) public fundersToAmount;

    uint256 constant MINIMUM_VALUE = 100 * 10 ** 18;   //USD

    uint256 constant TARGET = 1000 * 10 ** 18;

    address public owner;

    uint256 deploymentTimestamp;
    uint256 lockTime;

    address erc20Addr;

    bool public getFundSuccess = false; //flag

    constructor(uint256 _lockTime, address dataFeedAddr) {
        // sepolia testnet
        // dataFeed = AggregatorV3Interface(0x694AA1769357215DE4FAC081bf1f309aDC325306);
        dataFeed = AggregatorV3Interface(dataFeedAddr);
        owner = msg.sender;
        deploymentTimestamp = block.timestamp;
        lockTime = _lockTime;
    }

    function fund() external payable {
        require(convertETHToUSD(msg.value) >= MINIMUM_VALUE, "Send more ETH"); // revert
        require(block.timestamp < deploymentTimestamp + lockTime, "Window is closed");
        fundersToAmount[msg.sender] = msg.value;
    }

    /**
    * Returns the latest answer.
    */
    function getChainlinkDataFeedLatestAnswer() public view returns (int256) {
        // prettier-ignore
        (
        /* uint80 roundId */
        ,
        int256 answer,
        /*uint256 startedAt*/
        ,
        /*uint256 updatedAt*/
        ,
        /*uint80 answeredInRound*/
        ) = dataFeed.latestRoundData();
        return answer;
    }

    function convertETHToUSD(uint256 ethAmount) internal view returns(uint256){
        uint256 price = uint256(getChainlinkDataFeedLatestAnswer());
        return ethAmount * price / (10 ** 8);
        // ETH / USD precision = 10 ** 8
        // X / ETH precision = 10 ** 18
    }

    function getFund() external onlyOwner {
        require(convertETHToUSD(address(this).balance) >= TARGET, "Target is not reached"); 
        require(block.timestamp >= deploymentTimestamp + lockTime, "Window is not closed");
        // transfer: transfer ETH and revert if tx failed
        // payable(msg.sender).transfer(address(this).balance);

        // send: transfer ETH and return bool( false if failed )
        // bool success = payable(msg.sender).send(address(this).balance);
        // require(success, "tx failed");

        // call: transfer ETH with data return value of function and bool 
        bool success;
        (success, ) = payable(msg.sender).call{value: address(this).balance}("");
        require(success, "tx failed");
        fundersToAmount[msg.sender] = 0;
        getFundSuccess = true;
    }

    function transferOwnership(address newOwner) public {
        require(msg.sender == owner, "this function can only be called by owner");
        owner = newOwner;
    }

    function refund() external windowClosed {
        require(convertETHToUSD(address(this).balance) < TARGET, "Target is reached");
        require(fundersToAmount[msg.sender] != 0, "there is no fund for you");
        
        bool success;
        (success, ) = payable(msg.sender).call{value: fundersToAmount[msg.sender]}("");
        require(success, "tx failed");
        fundersToAmount[msg.sender] = 0;
    }

    modifier windowClosed(){
        require(block.timestamp >= deploymentTimestamp + lockTime, "Window is not closed");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "this function can only be called by owner");
        _;
    }

    function setErcc20Addr(address _erc20Addr) public onlyOwner {
        erc20Addr = _erc20Addr;
    }

    function setFunderToAmount(address funder, uint256 amountToUpdate) external {
        require(msg.sender == erc20Addr, "You do not have permission to call this function");
        fundersToAmount[funder] = amountToUpdate;
    }
}