pragma solidity >=0.7.0 <0.9.0;

contract Bingo {

    event GameWon(address indexed player, uint indexed winnings);
    event NumberPicked(uint8 indexed pick);
    event PlayerJoined(address indexed player);
    event EntryFeeUpdated(uint indexed newEntryFee);
    event JoinDurationUpdated(uint indexed newJoinDuration);
    event TurnDurationUpdated(uint indexed newTurnDuration);

    address public owner;
    uint256 public turnDuration;
    uint256 public joinDuration;
    uint256 public entryFee;
    uint256 public bingoStartTime;
    uint256 public lastTurnTime;
    bool gameOver = false;
    address public winner;
    mapping(address => uint8[5][5]) public bingoBoards;
    address[] public players;
    mapping(address => bool) public playersHash;
    mapping(uint8 => bool) public pickedNumbersHash;
    uint8[] public pickedNumbersArray;

    constructor(
        address _owner,
        uint256 _turnDuration,
        uint256 _joinDuration,
        uint256 _entryFee
    ) {
        turnDuration = _turnDuration;
        joinDuration = _joinDuration;
        entryFee = _entryFee;
        bingoStartTime = block.timestamp;
        lastTurnTime = block.timestamp;
        owner = _owner;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "only owner can perform operation");
        _;
    }

    modifier gameRunning() {
        require(!gameOver, "game has ended");
        _;
    }

    modifier inJoinDuration() {
        require(block.timestamp - bingoStartTime < joinDuration, "can't execute outside of join period");
        _;
    }

    modifier notAlreadyJoined() {
        require(!(playersHash[msg.sender] == true), "player already joined");
        _;
    }

    function pickNumber() public gameRunning onlyOwner() {
        require(block.timestamp - bingoStartTime > joinDuration, "can't pick number before join period ends");
        require(block.timestamp - lastTurnTime > turnDuration, "can't pick number before turn period ends");
        lastTurnTime = block.timestamp;
        uint8 draw = uint8(uint(blockhash(block.number - 1)) % 256);
        pickedNumbersHash[draw] = true;
        pickedNumbersArray.push(draw);
        emit NumberPicked(draw);
    }

    function getPickedNumbers() public view returns (uint8[] memory) {
        return pickedNumbersArray;
    }

    function getPlayers() public view returns (address[] memory) {
        return players;
    }

    function joinGame() public payable notAlreadyJoined {
        require(block.timestamp - bingoStartTime < joinDuration, "player joining has ended");
        require(msg.value == entryFee, "incorrect entry fee");

        uint8[5][5] memory _board;

        for (uint8 x = 0; x < 5; x++) {
            for (uint8 y = 0; y < 5; y++) {
                _board[y][x] = uint8(uint(keccak256(abi.encode(blockhash(block.number - 1), y, x))) % 256);
            }
        }

        bingoBoards[msg.sender] = _board;
        players.push(msg.sender);
        playersHash[msg.sender] = true;
        emit PlayerJoined(msg.sender);
    }

    function setJoinDuration(uint _joinDuration) public onlyOwner() inJoinDuration {
        require(block.timestamp - bingoStartTime < joinDuration);
        joinDuration = _joinDuration;
        emit JoinDurationUpdated(joinDuration);
    }

    function setTurnDuration(uint _turnDuration) public onlyOwner() inJoinDuration {
        require(block.timestamp - bingoStartTime < joinDuration);
        turnDuration = _turnDuration;
        emit TurnDurationUpdated(turnDuration);
    }

    function setEntryFee(uint _entryFee) public onlyOwner() inJoinDuration {
        require(block.timestamp - bingoStartTime < joinDuration);
        entryFee = _entryFee;
        emit EntryFeeUpdated(entryFee);
    }

    function submitWinningBoard() public gameRunning {
        if (isWinningBoard()) {
            uint winnings = address(this).balance;
            gameOver = true;
            winner = msg.sender;
            (bool success, bytes memory data) = payable(msg.sender).call{value : winnings}("");
            emit GameWon(winner, winnings);
        }
    }

    function isWinningBoard() public view returns (bool) {
        require(pickedNumbersArray.length >= 4);
        uint8[5][5] memory _board;

        _board = bingoBoards[msg.sender];

        if (checkDiagonal1(_board)) {
            return true;
        }
        if (checkDiagonal2(_board)) {
            return true;
        }
        if (checkHorizontalRows(_board)) {
            return true;
        }
        if (checkVerticalRows(_board)) {
            return true;
        }
        return false;
    }

    function checkVerticalRows(uint8[5][5] memory _board) private view returns (bool) {
        uint8 correct = 0;
        for (uint8 x = 0; x < 5; x++) {
            correct = 0;
            for (uint8 y = 0; y < 5; y++) {
                if (pickedNumbersHash[_board[y][x]] && !(x == 2 && y == 2)) {
                    correct++;
                }
            }
            if (correct == 5 || (correct == 4 && x == 2)) {
                return true;
            }
        }
        return false;
    }

    function checkHorizontalRows(uint8[5][5] memory _board) private view returns (bool) {
        uint8 correct = 0;
        for (uint8 x = 0; x < 5; x++) {
            correct = 0;
            for (uint8 y = 0; y < 5; y++) {
                if (pickedNumbersHash[_board[x][y]] && !(x == 2 && y == 2)) {
                    correct++;
                }
            }
            if (correct == 5 || (correct == 4 && x == 2)) {
                return true;
            }
        }
        return false;
    }

    function checkDiagonal1(uint8[5][5] memory _board) private view returns (bool) {
        uint8 correct = 0;
        for (uint8 x = 0; x < 5; x++) {
            if (pickedNumbersHash[_board[x][x]] && x != 2) {
                correct++;
            }
        }
        if (correct == 4) {
            return true;
        }
        return false;
    }

    function checkDiagonal2(uint8[5][5] memory _board) private view returns (bool) {
        uint8 correct = 0;
        for (uint8 x = 0; x < 5; x++) {
            if (pickedNumbersHash[_board[x][4 - x]] && x != 2) {
                correct++;
            }
        }
        if (correct == 4) {
            return true;
        }
        return false;
    }
}
