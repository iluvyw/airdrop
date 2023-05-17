# Airdrop Hardhat Project (Merkle Proof)

This project supports users in creating their own airdrops and verifies data using Merkle Tree proof.
It comes with a sample contract, a test for that contract, and a script that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat coverage
npx hardhat run scripts/deploy.ts --network sepolia
npx hardhat run scripts/verify.ts --network sepolia
```

**Reference**

[Openzeppelin](https://docs.openzeppelin.com/contracts/3.x/api/cryptography#MerkleProof)
