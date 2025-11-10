const { DECIMAL, INITIAL_ANSWER, developmentChains } = require("../helper-hardhat-config");

module.exports = async ({ getNamedAccounts, deployments }) => {

    if (developmentChains.includes(network.name)) {

        const firstAccount = (await getNamedAccounts()).firstAccount;
        //const {deploy} = deployments;
        const deploy = deployments.deploy;
        await deploy("MockV3Aggregator", {
            from: firstAccount,
            args: [DECIMAL, INITIAL_ANSWER],
            log: true
        });
        console.log(`first account is ${firstAccount}`);
        console.log("this is a deploy function");
    } else {
        console.log("Environment is not local, mock contract deployment is skipped");
    }
}

module.exports.tags = ["all", "mock"]