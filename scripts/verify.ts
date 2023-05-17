import hre from "hardhat";
import fs from "fs";

async function main() {
  const data = JSON.parse(fs.readFileSync("config.json").toString());

  await hre.run("verify:verify", {
    address: data.airdrop,
    constructorArguments: [],
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
