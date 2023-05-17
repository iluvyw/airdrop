import { ethers } from "hardhat";
import { AirdropContract, Token } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { getRoot } from "../utils/merkle-tree";
import { getProof } from "../utils/merkle-tree";

describe("Airdrop", function () {
  const AIRDROP_1_ADDR_1_AMOUNT = 1000;
  const AIRDROP_1_ADDR_2_AMOUNT = 2000;
  const AIRDROP_2_ADDR_1_AMOUNT = 3000;
  const AIRDROP_2_ADDR_2_AMOUNT = 4000;

  let owner: SignerWithAddress,
    addr1: SignerWithAddress,
    addr2: SignerWithAddress;

  let airdrop: AirdropContract, tokenA: Token, tokenB: Token;

  let mockAirdrop1: any[][];
  let mockAirdrop2: any[][];

  beforeEach(async function () {
    const AidropFactory = await ethers.getContractFactory("AirdropContract");
    const TokenFactory = await ethers.getContractFactory("Token");

    airdrop = await AidropFactory.deploy();
    tokenA = await TokenFactory.deploy("Token A", "TKA");
    tokenB = await TokenFactory.deploy("Token B", "TKB");

    const [signer1, signer2, signer3] = await ethers.getSigners();

    owner = signer1;
    addr1 = signer2;
    addr2 = signer3;

    await tokenA.mint(owner.address, 1_000_000);
    await tokenB.mint(owner.address, 1_000_000);

    mockAirdrop1 = [
      [addr1.address, AIRDROP_1_ADDR_1_AMOUNT.toString()],
      [addr2.address, AIRDROP_1_ADDR_2_AMOUNT.toString()],
    ];

    mockAirdrop2 = [
      [addr1.address, AIRDROP_2_ADDR_1_AMOUNT.toString()],
      [addr2.address, AIRDROP_2_ADDR_2_AMOUNT.toString()],
    ];
  });

  it("Balance of owner in 2 contract", async function () {
    const balanceOfTokenA = await tokenA.balanceOf(owner.address);
    const balanceOfTokenB = await tokenB.balanceOf(owner.address);
    expect(balanceOfTokenA).to.equal(1_000_000);
    expect(balanceOfTokenB).to.equal(1_000_000);
  });

  describe("New Airdrop", async function () {
    let rootAirdrop1: string, rootAirdrop2: string;
    beforeEach(async function () {
      rootAirdrop1 = getRoot("1", mockAirdrop1);
      rootAirdrop2 = getRoot("2", mockAirdrop2);
    });

    it("Revert when allowance of airdrop contract for token is 0", async function () {
      await expect(
        airdrop
          .connect(owner)
          .newAirdrop("First Airdrop", rootAirdrop1, tokenA.address)
      ).to.be.revertedWith(
        "This contract should be allowed to spend on behalf of owner"
      );
    });

    it("Successfully create new airdrop", async function () {
      const totalAmount = AIRDROP_1_ADDR_1_AMOUNT + AIRDROP_1_ADDR_2_AMOUNT;
      await tokenA.connect(owner).approve(airdrop.address, totalAmount);
      await expect(
        airdrop
          .connect(owner)
          .newAirdrop("First Airdrop", rootAirdrop1, tokenA.address)
      )
        .to.emit(airdrop, "NewAirdrop")
        .withArgs(1, "First Airdrop", tokenA.address, owner.address);
    });
  });

  describe("Withdraw", async function () {
    beforeEach(async function () {
      const rootAirdrop1 = getRoot("1", mockAirdrop1);
      const rootAirdrop2 = getRoot("2", mockAirdrop2);
      const totalAmountAirdrop1 =
        AIRDROP_1_ADDR_1_AMOUNT + AIRDROP_1_ADDR_2_AMOUNT;
      const totalAmountAirdrop2 =
        AIRDROP_2_ADDR_1_AMOUNT + AIRDROP_2_ADDR_2_AMOUNT;
      await tokenA.connect(owner).approve(airdrop.address, totalAmountAirdrop1);
      airdrop
        .connect(owner)
        .newAirdrop("First Airdrop", rootAirdrop1, tokenA.address);
      await tokenB.connect(owner).approve(airdrop.address, totalAmountAirdrop2);
      airdrop
        .connect(owner)
        .newAirdrop("Second Airdrop", rootAirdrop2, tokenB.address);
    });

    it("Invalid airdrop id", async function () {
      const proof = getProof("1", addr1.address);
      expect(proof).to.not.equal(undefined);
      await expect(
        airdrop
          .connect(addr1)
          .withdraw(5, proof as string[], AIRDROP_1_ADDR_1_AMOUNT)
      ).to.revertedWith("Invalid airdrop id");
    });

    it("Invalid proof", async function () {
      const proof = [ethers.constants.HashZero]; // empty bytes32(0)
      expect(proof).to.not.equal(undefined);
      await expect(
        airdrop
          .connect(addr1)
          .withdraw(1, proof as string[], AIRDROP_1_ADDR_1_AMOUNT)
      ).to.revertedWith("Invalid proof");
    });

    it("Successfully withdraw", async function () {
      const proof = getProof("1", addr1.address);
      expect(proof).to.not.equal(undefined);
      await expect(
        airdrop
          .connect(addr1)
          .withdraw(1, proof as string[], AIRDROP_1_ADDR_1_AMOUNT)
      )
        .to.emit(airdrop, "UserWithdraw")
        .withArgs(1, "First Airdrop", addr1.address, AIRDROP_1_ADDR_1_AMOUNT);
    });

    it("Already claim", async function () {
      const proof = getProof("1", addr1.address);
      expect(proof).to.not.equal(undefined);
      await airdrop
        .connect(addr1)
        .withdraw(1, proof as string[], AIRDROP_1_ADDR_1_AMOUNT);
      await expect(
        airdrop
          .connect(addr1)
          .withdraw(1, proof as string[], AIRDROP_1_ADDR_1_AMOUNT)
      ).to.revertedWith("You already claimed");
    });
  });
});
