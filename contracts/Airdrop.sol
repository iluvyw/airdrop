// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract AirdropContract is ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private currentAirdropId;

    event NewAirdrop(uint256 id, string name, address tokenAddress, address owner);
    event UserWithdraw(uint256 id, string airdropName, address user, uint256 amount);

    struct Airdrop {
        string name;
        bytes32 root;
        address tokenAddress;
        address owner;
    }
    
    mapping (uint256 => Airdrop) public idToAirdrop;
    mapping (uint256 => mapping(address => bool)) public claimed;

    function newAirdrop(string memory _name, bytes32 _root, address _tokenAddress) public {
        require(IERC20(_tokenAddress).allowance(msg.sender, address(this)) > 0, "This contract should be allowed to spend on behalf of owner");
        currentAirdropId.increment();
        idToAirdrop[currentAirdropId.current()] = Airdrop(_name, _root, _tokenAddress, msg.sender);
        emit NewAirdrop(currentAirdropId.current(), _name, _tokenAddress, msg.sender);
    }

    function withdraw(uint256 _id, bytes32[] memory _proof, uint256 _amount) public payable nonReentrant {
        require(0 < _id && _id <= currentAirdropId.current(), "Invalid airdrop id");
        require(claimed[_id][msg.sender] == false, "You already claimed");
        Airdrop memory airdrop = idToAirdrop[_id];
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(msg.sender, _amount))));
        require(MerkleProof.verify(_proof, airdrop.root, leaf), "Invalid proof");
        IERC20(airdrop.tokenAddress).transferFrom(airdrop.owner, msg.sender, _amount);
        claimed[_id][msg.sender] = true;
        emit UserWithdraw(_id, airdrop.name, msg.sender, _amount);
    }
}