import {Button, Row} from "react-bootstrap";
import React, {useEffect, useState} from "react";
import {getBingoBoards, getPlayers, listenForBingoEvent, pickNumber, playerJoin} from "../../bingo-sdk";
import {getPicks} from "../../bingo-sdk/BingoFunctions";
import {BingoBoard, createBoardRow} from "./BingoBoard";

interface Props {
    gameAddress: string
}

export function BingoGame({gameAddress}: Props) {
    const join = async () => await playerJoin(gameAddress)

    const pick = async () => await pickNumber(gameAddress)

    const getBoards = async () =>
        setBingoBoards(await getBingoBoards(gameAddress))

    const getPickedNumbers = async () =>
        setPicks(await getPicks(gameAddress))

    const getPlayerAddresses = async () =>
        setPlayers(await getPlayers(gameAddress))

    const [bingoBoards, setBingoBoards] = useState<number[][][]>();
    const [picks, setPicks] = useState<number[]>();
    const [players, setPlayers] = useState<string[]>();

    useEffect(() => {
        getBoards()
        getPickedNumbers()
        getPlayerAddresses()
        listenForBingoEvent(gameAddress, 'NumberPicked', getPickedNumbers)
        listenForBingoEvent(gameAddress, 'PlayerJoined', () => {
            getPlayerAddresses()
            getBoards()
        })
    }, [])


    return <Row className='game-row'>
        <h2>{`Game: ${gameAddress}`}</h2>
        <div>
            <Button onClick={join}>Join Game</Button>
            <Button onClick={pick}>Pick Bingo Number</Button>
        </div>
        <div className='picks'>
            <h2>Picks:</h2>
            {picks && createBoardRow(picks, [])}
        </div>
        <div className='boards-row'>
            {bingoBoards && players && picks && bingoBoards.map((bingoBoard, index) =>
                <BingoBoard bingoBoard={bingoBoard} playerAddress={players[index]} picks={picks} />)}
        </div>
    </Row>;
}
