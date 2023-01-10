import {BingoFactory__factory} from "../typechain-types";
import {queryConnect, transactionConnect} from "./common";


export async function queryConnectBingoFactory() {
    let provider = await queryConnect()
    let bingoFactory = BingoFactory__factory.connect(process.env.DEPLOYED_BINGO_FACTORY as string, provider);
    return bingoFactory
}

export async function transactionConnectBingoFactory() {
    let signer = await transactionConnect()
    let bingoFactory = BingoFactory__factory.connect(process.env.DEPLOYED_BINGO_FACTORY as string, signer);
    return bingoFactory
}

export async function newBingoGame(turnDuration: number, joinDuration: number, entryFee: number) {
    let bingoFactory = await transactionConnectBingoFactory()
    let tx = await bingoFactory.createBingo(turnDuration, joinDuration, entryFee)
    return await tx.wait()
}

export async function getBingoGameAddresses() {
    let bingoFactory = await queryConnectBingoFactory()
    let gameAddresses = await bingoFactory.getDeployedBingoGames()
    return gameAddresses
}

export async function getBingoGameContracts() {
    let gameAddresses = await getBingoGameAddresses()
    let bingoGames = await Promise.all(gameAddresses.map(gameAddress => transactionConnectBingoFactory()))
    return bingoGames
}

export async function listenForBingoFactoryEvent(eventName: string, fn: () => any) {
    let bingoFactory = await queryConnectBingoFactory()
    bingoFactory.on(eventName, fn)
}

