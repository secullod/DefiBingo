pragma solidity >=0.7.0 <0.9.0;

import "./Bingo.sol";

contract BingoFactory {

    event GameCreated(address indexed _gameAddress);

    Bingo[] public bingoGames;

    function createBingo(uint256 _turn_duration,
        uint256 _join_duration,
        uint256 _entry_fee) public {
        Bingo newBingoGame = new Bingo(msg.sender, _turn_duration, _join_duration, _entry_fee);
        bingoGames.push(newBingoGame);
        emit GameCreated(address(newBingoGame));
    }

    function getDeployedBingoGames() public view returns (Bingo[] memory) {
        return bingoGames;
    }
}
