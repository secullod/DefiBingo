import {ethers} from "ethers";

export async function connectPlayer() {
    let provider = new ethers.providers.Web3Provider((window as any).ethereum)
    await provider.send("eth_requestAccounts", []);
}

export async function queryConnect() {
    return new ethers.providers.Web3Provider((window as any).ethereum)
}

export async function transactionConnect() {
    let provider = new ethers.providers.Web3Provider((window as any).ethereum)
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    return signer
}
