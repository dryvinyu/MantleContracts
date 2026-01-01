import { expect } from "chai";
import { ethers } from "hardhat";
import { YieldDistributor, RWAToken } from "../typechain-types";

describe("YieldDistributor", function () {
  let yieldDistributor: YieldDistributor;
  let rwaToken: RWAToken;
  let owner: any;
  let addr1: any;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();

    // Deploy RWA Token first
    const RWATokenFactory = await ethers.getContractFactory("RWAToken");
    rwaToken = await RWATokenFactory.deploy(
      "Mantle US Treasury 6M",
      "mUSTB6M",
      "Treasury",
      520,
      15,
      180 * 24 * 60 * 60
    );
    await rwaToken.waitForDeployment();

    // Deploy YieldDistributor
    const YieldDistributorFactory = await ethers.getContractFactory("YieldDistributor");
    yieldDistributor = await YieldDistributorFactory.deploy();
    await yieldDistributor.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await yieldDistributor.owner()).to.equal(owner.address);
    });

    it("Should start with zero distributions", async function () {
      expect(await yieldDistributor.getDistributionsCount()).to.equal(0);
    });
  });

  describe("Distribution", function () {
    it("Should allow owner to distribute yield", async function () {
      const tokenAddress = await rwaToken.getAddress();

      await yieldDistributor["distributeYield(address,uint256,uint256,string)"](
        tokenAddress,
        ethers.parseEther("1000"),
        100,
        "Monthly"
      );

      const count = await yieldDistributor.getDistributionsCount();
      expect(count).to.equal(1);
    });

    it("Should track distribution stats correctly", async function () {
      const tokenAddress = await rwaToken.getAddress();

      await yieldDistributor["distributeYield(address,uint256,uint256,string)"](
        tokenAddress,
        ethers.parseEther("1000"),
        100,
        "Monthly"
      );

      const stats = await yieldDistributor.getTokenStats(tokenAddress);
      expect(stats._totalDistributed).to.equal(ethers.parseEther("1000"));
      expect(stats._distributionCount).to.equal(1);
    });

    it("Should not allow non-owner to distribute", async function () {
      const tokenAddress = await rwaToken.getAddress();

      await expect(
        yieldDistributor.connect(addr1)["distributeYield(address,uint256,uint256,string)"](
          tokenAddress,
          ethers.parseEther("1000"),
          100,
          "Monthly"
        )
      ).to.be.revertedWithCustomError(yieldDistributor, "OwnableUnauthorizedAccount");
    });

    it("Should reject zero amount", async function () {
      const tokenAddress = await rwaToken.getAddress();

      await expect(
        yieldDistributor["distributeYield(address,uint256,uint256,string)"](
          tokenAddress,
          0,
          100,
          "Monthly"
        )
      ).to.be.revertedWith("Amount must be > 0");
    });

    it("Should reject zero recipients", async function () {
      const tokenAddress = await rwaToken.getAddress();

      await expect(
        yieldDistributor["distributeYield(address,uint256,uint256,string)"](
          tokenAddress,
          ethers.parseEther("1000"),
          0,
          "Monthly"
        )
      ).to.be.revertedWith("Recipients must be > 0");
    });
  });

  describe("Scheduled Distributions", function () {
    it("Should allow scheduling distributions", async function () {
      const tokenAddress = await rwaToken.getAddress();
      const futureDate = Math.floor(Date.now() / 1000) + 86400; // 1 day from now

      await yieldDistributor.scheduleDistribution(
        tokenAddress,
        ethers.parseEther("1200"),
        futureDate
      );

      const count = await yieldDistributor.getScheduledCount();
      expect(count).to.equal(1);

      const scheduled = await yieldDistributor.getScheduledDistribution(0);
      expect(scheduled.token).to.equal(tokenAddress);
      expect(scheduled.amount).to.equal(ethers.parseEther("1200"));
      expect(scheduled.executed).to.equal(false);
    });

    it("Should reject scheduling in the past", async function () {
      const tokenAddress = await rwaToken.getAddress();
      const pastDate = Math.floor(Date.now() / 1000) - 86400; // 1 day ago

      await expect(
        yieldDistributor.scheduleDistribution(
          tokenAddress,
          ethers.parseEther("1200"),
          pastDate
        )
      ).to.be.revertedWith("Date must be in the future");
    });

    it("Should allow cancelling scheduled distributions", async function () {
      const tokenAddress = await rwaToken.getAddress();
      const futureDate = Math.floor(Date.now() / 1000) + 86400;

      await yieldDistributor.scheduleDistribution(
        tokenAddress,
        ethers.parseEther("1200"),
        futureDate
      );

      await yieldDistributor.cancelScheduledDistribution(0);

      const scheduled = await yieldDistributor.getScheduledDistribution(0);
      expect(scheduled.executed).to.equal(true); // Marked as executed to prevent future execution
    });
  });

  describe("Recent Distributions", function () {
    it("Should return recent distributions", async function () {
      const tokenAddress = await rwaToken.getAddress();

      // Add multiple distributions
      for (let i = 0; i < 3; i++) {
        await yieldDistributor["distributeYield(address,uint256,uint256,string)"](
          tokenAddress,
          ethers.parseEther((1000 + i * 100).toString()),
          100 + i,
          "Monthly"
        );
      }

      const recent = await yieldDistributor.getRecentDistributions(tokenAddress, 10);

      expect(recent.amounts.length).to.equal(3);
      expect(recent.timestamps.length).to.equal(3);
      expect(recent.recipients.length).to.equal(3);
    });
  });

  describe("Events", function () {
    it("Should emit YieldDistributed event", async function () {
      const tokenAddress = await rwaToken.getAddress();

      await expect(
        yieldDistributor["distributeYield(address,uint256,uint256,string)"](
          tokenAddress,
          ethers.parseEther("1000"),
          100,
          "Monthly"
        )
      )
        .to.emit(yieldDistributor, "YieldDistributed")
        .withArgs(
          tokenAddress,
          ethers.parseEther("1000"),
          100,
          await ethers.provider.getBlock("latest").then((b) => b!.timestamp + 1),
          "Monthly"
        );
    });

    it("Should emit DistributionScheduled event", async function () {
      const tokenAddress = await rwaToken.getAddress();
      const futureDate = Math.floor(Date.now() / 1000) + 86400;

      await expect(
        yieldDistributor.scheduleDistribution(
          tokenAddress,
          ethers.parseEther("1200"),
          futureDate
        )
      )
        .to.emit(yieldDistributor, "DistributionScheduled")
        .withArgs(0, tokenAddress, ethers.parseEther("1200"), futureDate);
    });
  });
});
