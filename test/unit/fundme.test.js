const {ethers, deployments, getNamedAccounts} = require("hardhat");
const {assert} = require("chai");
const helpers = require("@nomicfoundation/hardhat-network-helpers");

describe("test fundme contract", async function() {
    let fundMe;
    let firstAccount;

    beforeEach(async function() {
        await deployments.fixture(["all"]);
        firstAccount = (await getNamedAccounts()).firstAccount;
        const fundMeDeployment = await deployments.get("FundMe");
        fundMe = (await ethers.getContractAt("FundMe",fundMeDeployment.address));
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
        
        assert.equal((await fundMe.dataFeed()), "0x694AA1769357215DE4FAC081bf1f309aDC325306");
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

});