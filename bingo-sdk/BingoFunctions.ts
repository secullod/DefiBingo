import {Bingo, Bingo__factory} from "../typechain-types";
import {queryConnect, transactionConnect} from "./common";

export async function queryConnectBingo(contractAddress: string) {
    let provider = await queryConnect()
    let bingo = Bingo__factory.connect(contractAddress, provider);
    return bingo
}

export async function transactionConnectBingo(contractAddress: string) {
    let signer = await transactionConnect()
    let bingo = Bingo__factory.connect(contractAddress, signer);
    return bingo
}

export async function getBingoBoards(contractAddress: string) {
    let players = await getPlayers(contractAddress);
    let bingo = await queryConnectBingo(contractAddress);
    let bingoBoards = await Promise.all(players.map(player => createBoard(bingo, player)));
    return bingoBoards;

    async function createBoard(bingo: Bingo, player: string) {
        let board: number[][] = [[], [], [], [], []]

        for (let x = 0; x < 5; x++) {
            for (let y = 0; y < 5; y++) {
                let bingoNum = await bingo.bingoBoards(player, x, y)
                board[x].push(bingoNum);
            }
        }
        return board
    }
}

export async function getPlayers(contractAddress: string) {
    let bingo = await queryConnectBingo(contractAddress)
    return await bingo.getPlayers()
}

export async function listenForBingoEvent(contractAddress: string, eventName: string, fn: () => any) {
    let bingo = await queryConnectBingo(contractAddress)
    bingo.on(eventName, fn)
}

export async function getPicks(contractAddress: string) {
    let bingo = await queryConnectBingo(contractAddress)
    let picks = await bingo.getPickedNumbers()
    return picks
}

export async function playerJoin(contractAddress: string) {
    let bingo = await transactionConnectBingo(contractAddress)
    let tx = await bingo.joinGame({value: 5})
    return await tx.wait()
}

export async function pickNumber(contractAddress: string) {
    let bingo = await transactionConnectBingo(contractAddress)
    let tx = await bingo.pickNumber()
    return await tx.wait()
}

export async function checkWin(contractAddress: string) {
    let bingo = await transactionConnectBingo(contractAddress)
    let tx = await bingo.submitWinningBoard()
    return await tx.wait()
}

export async function updateEntryFee(contractAddress: string, entryFee: number) {
    let bingo = await transactionConnectBingo(contractAddress)
    let tx = await bingo.setEntryFee(entryFee)
    return await tx.wait()
}

export async function updateJoinDuration(contractAddress: string, joinDuration: number) {
    let bingo = await transactionConnectBingo(contractAddress)
    let tx = await bingo.setJoinDuration(joinDuration)
    return await tx.wait()
}

export async function updateTurnDuration(contractAddress: string, turnDirection: number) {
    let bingo = await transactionConnectBingo(contractAddress)
    let tx = await bingo.setTurnDuration(turnDirection)
    return await tx.wait()
}
