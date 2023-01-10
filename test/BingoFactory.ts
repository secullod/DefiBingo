import {ethers} from "hardhat";
import {loadFixture} from "@nomicfoundation/hardhat-network-helpers";
import {expect} from "chai";

describe("BingoFactory", function () {
    const entryFee = 500000000000
    const joinDuration = 5
    const turnDuration = 5

    async function deployBingoFactoryFixture() {
        const [owner] = await ethers.getSigners();
        const BingoFactory = await ethers.getContractFactory("BingoFactory");
        const bingoFactory = await BingoFactory.deploy();
        return {bingoFactory, owner};
    }

    it("should allow bingo games to be created", async function () {
        const {bingoFactory} = await loadFixture(deployBingoFactoryFixture);
        await expect(await bingoFactory.createBingo(turnDuration, joinDuration, entryFee)).to.emit(bingoFactory, 'GameCreated')
        await expect(await bingoFactory.createBingo(turnDuration, joinDuration, entryFee)).to.emit(bingoFactory, 'GameCreated')
        await expect(await bingoFactory.createBingo(turnDuration, joinDuration, entryFee)).to.emit(bingoFactory, 'GameCreated')
        let games = await bingoFactory.getDeployedBingoGames()
        expect(games.length).to.equal(3)
    });
});


















