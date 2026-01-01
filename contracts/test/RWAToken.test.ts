import { expect } from "chai";
import { ethers } from "hardhat";
import { RWAToken } from "../typechain-types";

describe("RWAToken", function () {
  let rwaToken: RWAToken;
  let owner: any;
  let addr1: any;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();

    const RWATokenFactory = await ethers.getContractFactory("RWAToken");
    rwaToken = await RWATokenFactory.deploy(
      "Mantle US Treasury 6M",
      "mUSTB6M",
      "Treasury",
      520, // 5.20% APY
      15, // Risk score
      180 * 24 * 60 * 60 // 6 months duration
    );
    await rwaToken.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await rwaToken.name()).to.equal("Mantle US Treasury 6M");
      expect(await rwaToken.symbol()).to.equal("mUSTB6M");
    });

    it("Should set the correct asset type", async function () {
      expect(await rwaToken.assetType()).to.equal("Treasury");
    });

    it("Should set the correct APY", async function () {
      expect(await rwaToken.expectedAPY()).to.equal(520);
    });

    it("Should set the correct risk score", async function () {
      expect(await rwaToken.riskScore()).to.equal(15);
    });

    it("Should mint initial supply to owner", async function () {
      const balance = await rwaToken.balanceOf(owner.address);
      expect(balance).to.equal(ethers.parseEther("10000000"));
    });
  });

  describe("Asset Info", function () {
    it("Should return correct asset info", async function () {
      const info = await rwaToken.getAssetInfo();
      expect(info[0]).to.equal("Treasury"); // assetType
      expect(info[1]).to.equal(520); // expectedAPY
      expect(info[2]).to.equal(15); // riskScore
    });

    it("Should return correct extended info", async function () {
      const info = await rwaToken.getExtendedInfo();
      expect(info[0]).to.equal(85); // yieldConfidence (default)
      expect(info[3]).to.equal(0); // payoutCount (no payouts yet)
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update APY", async function () {
      await rwaToken.updateAPY(600);
      expect(await rwaToken.expectedAPY()).to.equal(600);
    });

    it("Should not allow non-owner to update APY", async function () {
      await expect(rwaToken.connect(addr1).updateAPY(600)).to.be.revertedWithCustomError(
        rwaToken,
        "OwnableUnauthorizedAccount"
      );
    });

    it("Should allow owner to update risk score", async function () {
      await rwaToken.updateRiskScore(25);
      expect(await rwaToken.riskScore()).to.equal(25);
    });

    it("Should reject risk score above 100", async function () {
      await expect(rwaToken.updateRiskScore(101)).to.be.revertedWith(
        "Risk score must be <= 100"
      );
    });
  });

  describe("Yield Components", function () {
    it("Should allow adding yield components", async function () {
      await rwaToken.addYieldComponent(
        "US Treasury Rate",
        550,
        "6-month Treasury bill rate"
      );

      const count = await rwaToken.getYieldComponentsCount();
      expect(count).to.equal(1);

      const component = await rwaToken.getYieldComponent(0);
      expect(component.name).to.equal("US Treasury Rate");
      expect(component.value).to.equal(550);
    });

    it("Should calculate net APY from components", async function () {
      await rwaToken.addYieldComponent("Base Rate", 550, "Base rate");
      await rwaToken.addYieldComponent("Management Fee", -20, "Fee");
      await rwaToken.addYieldComponent("Platform Fee", -10, "Fee");

      const netAPY = await rwaToken.calculateNetAPY();
      expect(netAPY).to.equal(520);
    });

    it("Should allow clearing yield components", async function () {
      await rwaToken.addYieldComponent("Test", 100, "Test");
      await rwaToken.clearYieldComponents();

      const count = await rwaToken.getYieldComponentsCount();
      expect(count).to.equal(0);
    });
  });

  describe("Payout Records", function () {
    it("Should record payouts", async function () {
      await rwaToken.recordPayout(ethers.parseEther("1000"), 100);

      const count = await rwaToken.getPayoutHistoryCount();
      expect(count).to.equal(1);

      const record = await rwaToken.getPayoutRecord(0);
      expect(record.amount).to.equal(ethers.parseEther("1000"));
      expect(record.recipientCount).to.equal(100);
    });
  });

  describe("Events", function () {
    it("Should emit APYUpdated event", async function () {
      await expect(rwaToken.updateAPY(600))
        .to.emit(rwaToken, "APYUpdated")
        .withArgs(520, 600, await ethers.provider.getBlock("latest").then((b) => b!.timestamp + 1));
    });

    it("Should emit PayoutExecuted event", async function () {
      await expect(rwaToken.recordPayout(ethers.parseEther("1000"), 100)).to.emit(
        rwaToken,
        "PayoutExecuted"
      );
    });
  });
});
