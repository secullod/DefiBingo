import React from "react";


interface Props {
    bingoBoard: number[][]
    playerAddress: string
    picks: number[]
}

export function createBoardRow(boardRow: number[], picks: number[]) {
    return <div className='board-row'>
        {boardRow.map(boardNumber => boardSquare(boardNumber, picks))}
    </div>
}

function createBoard(board: number[][], picks: number[]) {
    return board.map(boardRow => createBoardRow(boardRow, picks))
}

function boardSquare(boardNumber: number, picks: number[]) {
    return <div className={`bingo-square ${picks.includes(boardNumber) ? 'red' : ''}`}>{boardNumber}</div>
}

export function BingoBoard({bingoBoard, playerAddress, picks}: Props) {
    return <div className="board-container">
        <h1>Bingo</h1>
        <h3>{`Player: ...${playerAddress.slice(35)}`}</h3>
        <div className="board">{createBoard(bingoBoard, picks)}</div>
    </div>;
}
