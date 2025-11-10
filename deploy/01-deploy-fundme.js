// function deployFunction() {
//     console.log("this is a deploy function");
// }

const { getNamedAccounts, deployments, network } = require("hardhat");
const {developmentChains, networkConfig, LOCK_TIME, CONFIRMATIONS} = require("../helper-hardhat-config");
// module.exports.default = deployFunction;

// module.exports=async(hre) => {
//     const getNamedAccounts = hre.getNamedAccounts;
//     const deployments = hre.deployments;
//     console.log("this is a deploy function");
// }

module.exports=async({getNamedAccounts, deployments}) => {
    const firstAccount = (await getNamedAccounts()).firstAccount;
    //const {deploy} = deployments;
    const deploy = deployments.deploy;

    // let dataFeedAddr;
    // if(/*local */network.name == "hardhat") {
    //     dataFeedAddr = await deployments.get("MockV3Aggregator");
    // } else {
    //     dataFeedAddr = "";
    // }

    let dataFeedAddr;
    if(developmentChains.includes(network.name)) {
        const mockV3Aggregator = await deployments.get("MockV3Aggregator");
        dataFeedAddr = mockV3Aggregator.address;
    } else {
        dataFeedAddr = networkConfig[network.config.chainId].ethUsdDataFeed;
    }

    const fundMe = await deploy("FundMe", {
        from: firstAccount,
        args: [LOCK_TIME, dataFeedAddr],
        log: true,
        waitConfirmations: CONFIRMATIONS
    });
    console.log(`first account is ${firstAccount}`);
    console.log("this is a deploy function");

    // remove deployments directory or add --reset flag if you redeploy contract

    if(hre.network.config.chainId == 11155111 && process.env.ETHERSCAN_API_KEY) {
        await hre.run("verify:verify", {
            address: fundMe.address,
            constructorArguments: [LOCK_TIME, dataFeedAddr],
        });
    } else {
        console.log("Network is not sepolia, verification is skipped");
    }
}

module.exports.tags = ["all", "fundme"]