// import ethers.js
// create main function
//  // init 2 accounts
//  // fund contract with first account
//  // check balance of contract
//  // fund contract with second account
//  // check balance of contract
//  // check mapping fundersToAmount
// execute main function

const {ethers} = require("hardhat")

async function main() {
    // create factory
    const fundMeFactory = await ethers.getContractFactory("FundMe");
    console.log("contract deploying");
    //deploy contract from factory
    const fundMe = await fundMeFactory.deploy(300);
    await fundMe.waitForDeployment();
    console.log("contract has been deployed successfully, contract address is " + fundMe.target);
    // console.log(`contract has been deployed successfully, contract address is ${fundMe.target}`);

    if(hre.network.config.chainId == 11155111 && process.env.ETHERSCAN_API_KEY){
        console.log("Waiting for 5 confirmations");
        await fundMe.deploymentTransaction().wait(5);

    // await hre.run("verify:verify", {
    //    address: fundMe.target,
    //    constructorArguments: [
    //     10
    //    ] 
    // });

        await verifyFundMe(fundMe.target, [300]);
    } else {
        console.log("Verification skipped..");
    }

    // init 2 accounts
    const [firstAccount, secondAccount] = await ethers.getSigners();

    // fund contract with first account
    const fundTx = await fundMe.fund({value: ethers.parseEther("0.05")});
    await fundTx.wait();

    // check balance of contract
    const balanceOfContrace = await ethers.provider.getBalance(fundMe.target);
    console.log(`Balance of Contract ${balanceOfContrace}`);

    // fund contract with second account
    const fundTxWithSecondAccount = await fundMe.connect(secondAccount).fund({value: ethers.parseEther("0.05")});
    await fundTxWithSecondAccount.wait();

    const balanceOfContraceAfterSecond = await ethers.provider.getBalance(fundMe.target);
    console.log(`Balance of Contract ${balanceOfContraceAfterSecond}`);

    // check mapping fundersToAmount
    const firstAccountBalanceInFundMe = await fundMe.fundersToAmount(firstAccount.address);
    const secondAccountBalanceInFundMe = await fundMe.fundersToAmount(secondAccount.address);
    console.log(`Balance of First Account ${firstAccount.address} is ${firstAccountBalanceInFundMe}`);
    console.log(`Balance of Second Account ${secondAccount.address} is ${secondAccountBalanceInFundMe}`);
}

async function verifyFundMe(fundMeAddr, args) {
    await hre.run("verify:verify", {
       address: fundMeAddr,
       constructorArguments: args,
    });
}

// execute function
main().then().catch((error) => {
    console.error(error);
    process.exit(1);
})