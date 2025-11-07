const {task} = require("hardhat/config");

task("interact-fundme", "interact with fundme contract")
    .addParam("addr", "fundme contract address")
    .setAction(async(taskArgs,hre)=>{
        const fundMeFactory = await ethers.getContractFactory("FundMe");
        const fundMe = fundMeFactory.attach(taskArgs.addr);

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
});