import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import fs from "fs";

const getRoot = (airdropId: string, values: any[][]) => {
  const tree = StandardMerkleTree.of(values, ["address", "uint256"]);
  fs.writeFileSync(`trees/tree-${airdropId}.json`, JSON.stringify(tree.dump()));
  return tree.root;
};

const getProof = (airdropId: string, address: string) => {
  const tree = StandardMerkleTree.load(
    JSON.parse(fs.readFileSync(`trees/tree-${airdropId}.json`).toString())
  );

  for (const [i, v] of tree.entries()) {
    if (v[0] === address) {
      const proof = tree.getProof(i);
      return proof;
    }
  }
};

export { getRoot, getProof };
