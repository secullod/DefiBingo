import React, {useEffect, useState} from "react";
import {Button, Navbar, NavbarBrand} from "react-bootstrap";
import {connectPlayer, listenForBingoFactoryEvent} from "../bingo-sdk";
import {getBingoGameAddresses, newBingoGame} from "../bingo-sdk/BingoFactoryFunctions";
import './bingo.scss'
import {BingoGame} from "./components";

export function App() {

    const [gameAddresses, setGameAddresses] = useState<string[]>();
    const getAddresses = async () => setGameAddresses(await getBingoGameAddresses())

    useEffect(() => {
        getAddresses()
        listenForBingoFactoryEvent('GameCreated', getAddresses)
    }, [])

    return <>
        <Navbar className='header fixed-top'>
            <NavbarBrand>BINGO</NavbarBrand>
        </Navbar>
        <Button onClick={connectPlayer}>Connect</Button>
        <Button onClick={() => newBingoGame(10, 120, 5)}>New Bingo Game</Button>
        {gameAddresses && gameAddresses.map(gameAddress => <BingoGame gameAddress={gameAddress} />)}
    </>;
}
