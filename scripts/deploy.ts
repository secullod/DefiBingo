import {ethers} from "hardhat";

async function main() {
    const BingoFactory = await ethers.getContractFactory("BingoFactory");
    const bingoFactory = await BingoFactory.deploy();

    await bingoFactory.deployed();

    console.log(`BingoFactory deployed to ${bingoFactory.address}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
