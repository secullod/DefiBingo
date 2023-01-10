import {loadFixture} from "@nomicfoundation/hardhat-network-helpers";
import {expect} from "chai";
import {ethers} from "hardhat";
import {delay} from "@nomiclabs/hardhat-etherscan/dist/src/etherscan/EtherscanService";
import {Signer} from "ethers";


describe("Bingo", function () {
    const entryFee = 500000000000
    const joinDuration = 5
    const turnDuration = 0

    async function deployBingoFixture() {
        const [owner, playerOne, playerTwo, playerThree] = await ethers.getSigners();
        const Bingo = await ethers.getContractFactory("Bingo");
        const bingo = await Bingo.deploy(turnDuration, joinDuration, entryFee);

        async function pickUntilWin(player: Signer, attempt = 1): Promise<boolean> {
            await bingo.pickNumber()
            let won = attempt > 4 ? await bingo.connect(player).isWinningBoard() : false
            return won ? true : await pickUntilWin(player, attempt + 1)
        }

        return {bingo, owner, playerOne, playerTwo, playerThree, pickUntilWin};
    }

    it("should allow a player to join game in join duration", async function () {
        const {bingo, owner} = await loadFixture(deployBingoFixture);
        await expect(await bingo.joinGame({value: entryFee})).to.emit(bingo, 'PlayerJoined')
        await expect(await bingo.provider.getBalance(bingo.address)).to.equal(entryFee)
        await expect(await bingo.players(0)).to.equal(owner.address)
        let boardSquare = await bingo.bingoBoards(owner.address, 0, 0)
        expect(boardSquare).to.be.greaterThanOrEqual(0);
        expect(boardSquare).to.be.lessThan(256);
    });

    it("should not allow a player to join game outside join duration", async function () {
        const {bingo} = await loadFixture(deployBingoFixture);
        await delay((joinDuration + 1) * 1000)
        await expect(bingo.joinGame({value: entryFee})).to.be.revertedWith('player joining has ended')
    });

    it("should not allow a player to join the game more than one time", async function () {
        const {bingo} = await loadFixture(deployBingoFixture);
        await bingo.joinGame({value: entryFee})
        await expect(bingo.joinGame({value: entryFee})).to.be.revertedWith('player already joined')
    });

    it("should not allow player to join with incorrect entry fee", async function () {
        const {bingo} = await loadFixture(deployBingoFixture);
        await expect(bingo.joinGame({value: entryFee + 1})).to.be.revertedWith('incorrect entry fee')
        await expect(bingo.joinGame({value: entryFee - 1})).to.be.revertedWith('incorrect entry fee')
    });

    it("should allow owner to pick bingo number after join duration", async function () {
        const {bingo} = await loadFixture(deployBingoFixture);
        await delay((joinDuration + 1) * 1000)
        let picksBeg = await bingo.getPickedNumbers()
        await expect(await bingo.pickNumber()).to.emit(bingo, 'NumberPicked')
        let picksEnd = await bingo.getPickedNumbers()
        expect(picksEnd.length - picksBeg.length).to.equal(1)
        expect(picksEnd[0]).to.be.an('number')
    })

    it("should not allow owner to pick bingo number before join duration ends", async function () {
        const {bingo} = await loadFixture(deployBingoFixture);
        await expect(bingo.pickNumber()).to.be.revertedWith('can\'t pick number before join period ends')
    })

    it("should not allow owner to pick bingo number before turn duration ends", async function () {
        const turnDuration = 5
        const Bingo = await ethers.getContractFactory("Bingo");
        const bingo = await Bingo.deploy(turnDuration, joinDuration, entryFee);
        await delay((joinDuration + 1) * 1000)
        await bingo.pickNumber()
        await expect(bingo.pickNumber()).to.be.revertedWith('can\'t pick number before turn period ends')
    })

    it("should not allow non-owner to pick bingo number", async function () {
        const {bingo, playerOne} = await loadFixture(deployBingoFixture);
        await delay((joinDuration + 1) * 1000);
        await expect(bingo.connect(playerOne).pickNumber()).to.be.reverted
    })

    it("should not allow owner to pick number after game ends", async function () {
        const {bingo, playerOne, pickUntilWin} = await loadFixture(deployBingoFixture);
        await bingo.connect(playerOne).joinGame({value: entryFee})
        await delay(6000)
        await pickUntilWin(playerOne)
        await expect(await bingo.connect(playerOne).submitWinningBoard()).to.emit(bingo, 'GameWon')
        await expect(bingo.pickNumber()).to.be.revertedWith('game has ended')
    })

    it("should not allow player to check board before 4 picked numbers", async function () {
        const {bingo} = await loadFixture(deployBingoFixture);
        await bingo.joinGame({value: entryFee})
        await delay((joinDuration + 1) * 1000)
        await expect(bingo.isWinningBoard()).to.be.reverted
        await bingo.pickNumber()
        await expect(bingo.isWinningBoard()).to.be.reverted
        await bingo.pickNumber()
        await expect(bingo.isWinningBoard()).to.be.reverted
        await bingo.pickNumber()
        await expect(bingo.isWinningBoard()).to.be.reverted
    })

    it("should allow player to check board after 4 picked numbers", async function () {
        const {bingo} = await loadFixture(deployBingoFixture);
        await bingo.joinGame({value: entryFee})
        await delay(6000)
        await bingo.pickNumber()
        await bingo.pickNumber()
        await bingo.pickNumber()
        await bingo.pickNumber()
        await expect(bingo.isWinningBoard()).to.not.be.reverted
    })

    it("should create a player board of 5 X 5 containing numbers between 0-255", async function () {
        const {bingo, owner} = await loadFixture(deployBingoFixture);
        await bingo.joinGame({value: entryFee})

        for (let x = 0; x < 5; x++) {
            for (let y = 0; y < 5; y++) {
                let bingoNum = await bingo.bingoBoards(owner.address, x, y)
                await expect(bingoNum).to.be.greaterThanOrEqual(0);
                await expect(bingoNum).to.be.lessThanOrEqual(256);
            }
        }
    })

    it("should allow player to win and emit win event", async function () {
        const {bingo, playerOne, pickUntilWin} = await loadFixture(deployBingoFixture);
        await bingo.connect(playerOne).joinGame({value: entryFee})
        await delay(6000)
        await pickUntilWin(playerOne)
        await expect(await bingo.connect(playerOne).submitWinningBoard()).to.emit(bingo, 'GameWon')
    })

    it("should allow player to win and receive all the Eth in the contract", async function () {
        const {bingo, playerOne, playerTwo, playerThree, pickUntilWin} = await loadFixture(deployBingoFixture);
        await bingo.connect(playerOne).joinGame({value: entryFee})
        await bingo.connect(playerTwo).joinGame({value: entryFee})
        await bingo.connect(playerThree).joinGame({value: entryFee})
        await delay(6000)
        await pickUntilWin(playerOne)

        let picks: number[] = await bingo.getPickedNumbers()
        let pickSet: Set<number> = new Set<number>();
        let board: number[][] = [[], [], [], [], []]

        for (let x = 0; x < picks.length; x++) {
            pickSet.add(picks[x])
        }

        for (let x = 0; x < 5; x++) {
            for (let y = 0; y < 5; y++) {
                let bingoNum = await bingo.bingoBoards(playerOne.address, x, y)
                board[x].push(bingoNum)
            }
        }

        let contractBalanceStart = await ethers.provider.getBalance(bingo.address)
        expect(contractBalanceStart.toNumber() === 3 * entryFee)
        let playerBalBeg = await ethers.provider.getBalance(playerOne.address)
        let tx = await bingo.connect(playerOne).submitWinningBoard()
        let receipt = await tx.wait()
        let contractBalanceEnd = await ethers.provider.getBalance(bingo.address)
        expect(contractBalanceEnd.toNumber() === 0)
        let playerBalEnd = await ethers.provider.getBalance(playerOne.address)
        expect(playerBalEnd.sub(playerBalBeg).add(receipt.gasUsed.mul(receipt.effectiveGasPrice)).toNumber() === 3 * entryFee)

        console.log(picks)
        console.log(board)
        console.log(checkBoard(pickSet, board))
    });

    it("should allow owner to update join duration", async function () {
        const {bingo} = await loadFixture(deployBingoFixture);
        let newJoinDuration = 6
        let oldJoinDuration = await bingo.joinDuration()
        await expect(await bingo.setJoinDuration(newJoinDuration)).to.emit(bingo, 'JoinDurationUpdated')
        let updatedJoinDuration = await bingo.joinDuration()
        expect(oldJoinDuration.toNumber() !== updatedJoinDuration.toNumber())
        expect(newJoinDuration === updatedJoinDuration.toNumber())
    })

    it("should not allow owner to update join duration after join period has ended", async function () {
        const {bingo} = await loadFixture(deployBingoFixture);
        let newJoinDuration = 6
        await delay((joinDuration + 1) * 1000)
        await expect(bingo.setJoinDuration(newJoinDuration)).to.be.revertedWith('can\'t execute outside of join period')
    })

    it("should not allow non-owner to update join duration", async function () {
        const {bingo, playerOne} = await loadFixture(deployBingoFixture);
        let newJoinDuration = 6
        await expect(bingo.connect(playerOne).setJoinDuration(newJoinDuration)).to.be.reverted
    })

    it("should allow owner to update turn duration", async function () {
        const {bingo} = await loadFixture(deployBingoFixture);
        let newTurnDuration = 6
        let oldTurnDuration = await bingo.turnDuration()
        await expect(await bingo.setTurnDuration(newTurnDuration)).to.emit(bingo, 'TurnDurationUpdated')
        let updatedTurnDuration = await bingo.turnDuration()
        expect(oldTurnDuration.toNumber() !== updatedTurnDuration.toNumber())
        expect(newTurnDuration === updatedTurnDuration.toNumber())
    })

    it("should not allow owner to update turn duration after join period has ended", async function () {
        const {bingo, playerOne} = await loadFixture(deployBingoFixture);
        let newTurnDuration = 6
        await delay((joinDuration + 1) * 1000)
        await expect(bingo.setTurnDuration(newTurnDuration)).to.be.revertedWith('can\'t execute outside of join period')
    })

    it("should not allow non-owner to update turn duration", async function () {
        const {bingo, playerOne} = await loadFixture(deployBingoFixture);
        let newTurnDuration = 6
        await expect(bingo.connect(playerOne).setTurnDuration(newTurnDuration)).to.be.reverted
    })

    it("should allow owner to update entry fee", async function () {
        const {bingo} = await loadFixture(deployBingoFixture);
        let newEntryFee = 6
        let oldEntryFee = await bingo.entryFee()
        await expect(await bingo.setEntryFee(newEntryFee)).to.emit(bingo, 'EntryFeeUpdated')
        let updatedEntryFee = await bingo.entryFee()

        expect(oldEntryFee.toNumber() !== updatedEntryFee.toNumber())
        expect(newEntryFee === updatedEntryFee.toNumber())
    })

    it("should not allow owner to update entry fee after join period has ended", async function () {
        const {bingo} = await loadFixture(deployBingoFixture);
        let newEntryFee = 6
        await delay((joinDuration + 1) * 1000)
        await expect(bingo.setEntryFee(newEntryFee)).to.be.revertedWith('can\'t execute outside of join period')
    })

    it("should not allow non-owner to update entry fee", async function () {
        const {bingo, playerOne} = await loadFixture(deployBingoFixture);
        let newEntryFee = 6
        await expect(bingo.connect(playerOne).setEntryFee(newEntryFee)).to.be.reverted
    })

    function checkBoard(bingoNumbers: Set<number>, board: number[][]): string {

        let correct = 0;
        let winningNumbers: number[] = []

        for (let x = 0; x < 5; x++) {
            correct = 0;
            winningNumbers = []
            for (let y = 0; y < 5; y++) {
                if (bingoNumbers.has(board[y][x]) && !(x == 2 && y == 2)) {
                    correct++;
                    winningNumbers.push(board[y][x])
                }
            }
            if (correct == 5 || (correct == 4 && x == 2)) {
                return `Bingo! ${winningNumbers} vertical`;
            }
        }

        for (let x = 0; x < 5; x++) {
            correct = 0;
            winningNumbers = []
            for (let y = 0; y < 5; y++) {
                if (bingoNumbers.has(board[x][y]) && !(x == 2 && y == 2)) {
                    correct++;
                    winningNumbers.push(board[x][y]);
                }
            }
            if (correct == 5 || (correct == 4 && x == 2)) {
                return `Bingo! ${winningNumbers} horizontal`;
            }
        }

        correct = 0;
        winningNumbers = []
        for (let x = 0; x < 5; x++) {
            if (bingoNumbers.has(board[x][x]) && x !== 2) {
                correct++;
                winningNumbers.push(board[x][x]);
            }
        }
        if (correct == 4) {
            return `Bingo! ${winningNumbers} diagonal`;
        }

        correct = 0;
        winningNumbers = []
        for (let x = 0; x < 5; x++) {

            if (bingoNumbers.has(board[x][4 - x]) && x !== 2) {
                correct++;
                winningNumbers.push(board[x][4 - x]);
            }
        }
        if (correct == 4) {
            return `Bingo! ${winningNumbers} diagonal`;
        }
        return "no winning numbers :(";
    }
})
