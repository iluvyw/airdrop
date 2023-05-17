import { ethers } from "hardhat";
import fs from "fs";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const Airdrop = await ethers.getContractFactory("AirdropContract");

  const airdrop = await Airdrop.deploy();

  console.log("Aidrop address:", airdrop.address);

  const data = {
    airdrop: airdrop.address,
  };
  fs.writeFileSync("config.json", JSON.stringify(data));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
