const {ethers, deployments, getNamedAccounts, network} = require("hardhat");
const {assert, expect} = require("chai");
const helpers = require("@nomicfoundation/hardhat-network-helpers");
const {developmentChains} = require("../../helper-hardhat-config");

!developmentChains.includes(network.name) ? describe.skip :
describe("test fundme contract", async function() {
    let fundMe;
    let firstAccount;
    let secondAccount;
    let mockV3Aggregator;
    let fundMeSecondAccount;

    beforeEach(async function() {
        await deployments.fixture(["all"]);
        firstAccount = (await getNamedAccounts()).firstAccount;
        secondAccount = (await getNamedAccounts()).secondAccount;
        const fundMeDeployment = await deployments.get("FundMe");
        mockV3Aggregator = await deployments.get("MockV3Aggregator");
        fundMe = (await ethers.getContractAt("FundMe",fundMeDeployment.address));
        //fundMeSecondAccount = ethers.getContract("FundMe", secondAccount);
        // 2. 获取 'secondAccount' (地址) 对应的 *签名者 (Signer)* 对象
        const secondAccountSigner = await ethers.getSigner(secondAccount);
        // 3. 使用 .connect() 方法将合约实例连接到这个新的签名者
        fundMeSecondAccount = fundMe.connect(secondAccountSigner);
    });

    // it("test if owner is msg.sender", async function() {
    //     const [firstAccount] = await ethers.getSigners();
    //     const fundMeFactory = await ethers.getContractFactory("FundMe");
    //     const fundMe = await fundMeFactory.deploy(180);
    //     await fundMe.waitForDeployment();
        
    //     assert.equal((await fundMe.owner()), firstAccount.address);
    // });

    // it("test if datafeed is assigned correctly", async function() {
    //     const fundMeFactory = await ethers.getContractFactory("FundMe");
    //     const fundMe = await fundMeFactory.deploy(180);
    //     await fundMe.waitForDeployment();
        
    //     assert.equal((await fundMe.dataFeed()), "0x694AA1769357215DE4FAC081bf1f309aDC325306");
    // });

    it("test if owner is msg.sender", async function() {
        await fundMe.waitForDeployment();
        
        assert.equal((await fundMe.owner()), firstAccount);
    });

    it("test if datafeed is assigned correctly", async function() {
        await fundMe.waitForDeployment();
        
        assert.equal((await fundMe.dataFeed()), mockV3Aggregator.address);
    });

    // fund, getFund, refund
    // unit test for fund
    // window open, value >= MINIMUM_VALUE, funder balance
    it("window closed, value greater and equal than minimum, fund failed", async function() {
        // make sure the window is closed
        await helpers.time.increase(200);
        await helpers.mine();
        // value >= minimum value
        expect(fundMe.fund({value: ethers.parseEther("0.1")})).to.be.revertedWith("window is closed");
    });

    it("window open, value is less than minimum, fund failed", async function() {
        expect(fundMe.fund({value: ethers.parseEther("0.01")})).to.be.revertedWith("Send more ETH");
    });

    it("window open, value is greater and equal than minimum, fund success", async function() {
        await fundMe.fund({value: ethers.parseEther("0.1")});

        const balance = await fundMe.fundersToAmount(firstAccount);
        expect(balance).to.equal(ethers.parseEther("0.1"));


    });

    // unit test for getFund
    // only owner, window closed, target reached
    it("not owner, window closed, target reached, getFund failed", async function() {
        // make sure target is reached
        await fundMe.fund({value: ethers.parseEther("1")});
        // make sure the window is closed
        await helpers.time.increase(200);
        await helpers.mine();

        await expect(fundMeSecondAccount.getFund()).to.be.revertedWith("this function can only be called by owner");

    });

    it("window open, target reached, getFund failed", async function() {
        // make sure target is reached
        await fundMe.fund({value: ethers.parseEther("1")});
        
        await expect(fundMe.getFund()).to.be.revertedWith("Window is not closed");

    });

    it("window closed, target not reached, getFund failed", async function() {
        // make sure target is reached
        await fundMe.fund({value: ethers.parseEther("0.1")});

        // make sure the window is closed
        await helpers.time.increase(200);
        await helpers.mine();
        
        await expect(fundMe.getFund()).to.be.revertedWith("Target is not reached");

    });

    it("window closed, target reached, getFund success", async function(){
        // make sure target is reached
        await fundMe.fund({value: ethers.parseEther("1")});

        // make sure the window is closed
        await helpers.time.increase(200);
        await helpers.mine();

        // 1. 在调用 getFund() 之前，获取合约的 *当前总余额*
        const contractAddress = await fundMe.getAddress();
        const contractBalance = await ethers.provider.getBalance(contractAddress);

        // 2. 断言 getFund() 发出的事件，其参数 *等于* 合约的 *总余额*
        await expect(fundMe.getFund())
          .to.emit(fundMe, "FundWithdrawByOwner")
          .withArgs(contractBalance); // <-- 不再硬编码 "1 ETH"
    });

    // refund
    // window closed, target not reached, 
    it("window open, target not reached, funder has balance", async function() {
        await fundMe.fund({value: ethers.parseEther("0.1")});
        await expect(fundMe.refund()).to.be.revertedWith("Window is not closed");
    });

    it("window closed, target reached, funder has balance", async function() {
        await fundMe.fund({value: ethers.parseEther("1")});

        await helpers.time.increase(200);
        await helpers.mine();

        await expect(fundMe.refund()).to.be.revertedWith("Target is reached");
    });

    it("window closed, target not reached, funder dose not have balance", async function() {
        await fundMe.fund({value: ethers.parseEther("0.1")});

        await helpers.time.increase(200);
        await helpers.mine();

        await expect(fundMeSecondAccount.refund()).to.be.revertedWith("there is no fund for you");
    });

    it("window closed, target not reached, funder has balance", async function() {
        await fundMe.fund({value: ethers.parseEther("0.1")});

        await helpers.time.increase(200);
        await helpers.mine();

        await expect(fundMe.refund()).to.emit(fundMe, "RefundByFounder").withArgs(firstAccount, ethers.parseEther("0.1"));
    });
});