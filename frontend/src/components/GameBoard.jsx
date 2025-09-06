

import React, { useState, useEffect } from "react";

const API_BASE = "https://ultimate-ttt-app.onrender.com";


const GameBoard = ({ config, onQuit }) => {
  const { game_id, initialState } = config;
  const [board, setBoard] = useState(initialState.board || Array(9).fill().map(() => Array(9).fill(0)));
  const [mainboard, setMainboard] = useState(initialState.mainboard || Array(3).fill().map(() => Array(3).fill(0)));
  const [currentPlayer, setCurrentPlayer] = useState(initialState.currentPlayer);
  const [winner, setWinner] = useState(initialState.winner);
  const [activeMiniBoard, setActiveMiniBoard] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [moveNumber, setMoveNumber] = useState(0);
  const [moveHistory, setMoveHistory] = useState([]);
  const [replayIndex, setReplayIndex] = useState(-1);
  const [replayInterval, setReplayInterval] = useState(500); // ms per move
  const [isAutoReplay, setIsAutoReplay] = useState(false);
  const [lastMoveCell, setLastMoveCell] = useState(null); // [row, col] of last move

  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  const showPopup = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000); // hide after 3s
  };


  const [loading, setLoading] = useState(false); // ⬅️ add at top of GameBoard

  const runBotBattle = async () => {
    console.log("runBotBattle called");
    try {
      setLoading(true); // Show loading while waiting for backend
      const res = await fetch(`${API_BASE}/bot-vs-bot-run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game_id }),
      });

      const text = await res.text();
      console.log("Raw response text:", text);

      const data = JSON.parse(text);
      console.log("Parsed JSON:", data);

      if (data.success) {
        const { move_history = [], winner } = data;

        // Save move history
        setMoveHistory(move_history);

        let tempBoard = Array(9).fill().map(() => Array(9).fill(0));
        let tempMain = Array(3).fill().map(() => Array(3).fill(0));

        // Hide loading NOW, before animating
        setLoading(false);

        const playMoves = async () => {
          for (let i = 0; i < move_history.length; i++) {
            const { player, move } = move_history[i];
            const [r, c] = move;

            tempBoard = tempBoard.map(row => [...row]);
            tempBoard[r][c] = player;
            
            setLastMoveCell([r, c]); // highlight last bot move

            setBoard(tempBoard);
            setMainboard(tempMain);
            setMoveNumber(i + 1);

            await new Promise(resolve => setTimeout(resolve, 200));
          }
          setWinner(winner);
        };

        playMoves();
      } else {
        console.log("Bot battle failed:", data.error);
        alert(data.error || "Bot battle failed");
        setLoading(false);
      }
    } catch (err) {
      console.error("Error running bot battle:", err);
      alert("Error running bot battle");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAutoReplay || replayIndex === -1 || replayIndex >= moveHistory.length) return;

    const interval = setInterval(() => {
      setReplayIndex(prev => {
        if (prev + 1 >= moveHistory.length) {
          clearInterval(interval);
          setIsAutoReplay(false);
          return prev;
        }

        const nextMove = moveHistory[prev + 1];
        const [r, c] = nextMove.move;
        setBoard(prevBoard => {
          const newBoard = prevBoard.map(row => [...row]);
          newBoard[r][c] = nextMove.player;
          return newBoard;
        });

        return prev + 1;
      });
    }, replayInterval);

    return () => clearInterval(interval);
  }, [isAutoReplay, replayIndex, replayInterval, moveHistory]);


  const handleCellClick = async (row, col) => {
    if (winner) return;

    try {
      const res = await fetch(`${API_BASE}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game_id, row, col }),
      });

      const data = await res.json();
      if (!data.success) {
        alert(data.error || "Invalid move!");
        return;
      }

      const { board, mainboard, currentPlayer, winner, lastMove } = data;
      setBoard(board);
      setMainboard(mainboard);
      setCurrentPlayer(currentPlayer);
      setWinner(winner || null);
      setMoveNumber((prev) => prev + 1);

      if (lastMove && mainboard) {
  const [lastRow, lastCol] = lastMove;
  const miniRow = lastRow % 3;
  const miniCol = lastCol % 3;
  const nextIndex = miniRow * 3 + miniCol;
  const miniStatus = mainboard[miniRow]?.[miniCol];
  setActiveMiniBoard(miniStatus === 0 ? nextIndex : null);

  // Highlight last move
  setLastMoveCell(lastMove);
} else {
  setActiveMiniBoard(null);
  setLastMoveCell(null);
}


      if (winner) {
        alert(winner === 3 ? "It's a Draw!" : `Winner: ${winner === 1 ? "X" : "O"}`);
      }
    } catch (err) {
      console.error("Error during move:", err);
      alert("Error making move");
    }
  };

  const handleQuit = () => {
    if (window.confirm("Quit the game?")) onQuit();
  };

  const handleRestart = async () => {
    try {
      const res = await fetch(`${API_BASE}/restart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game_id }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || "Failed to restart game");
        return;
      }

      // Update frontend state with new board
      setBoard(data.board);
      setMainboard(data.mainboard);
      setCurrentPlayer(data.currentPlayer);
      setWinner(null);
      alert("Game restarted!");
    } catch (err) {
      console.error(err);
      alert("Error restarting game");
    }
  };


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-amber_light text-brown_dark p-4">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center w-full max-w-5xl mb-6 gap-3">
        <h2 className="text-2xl sm:text-3xl font-bold text-center order-1 sm:order-none">
          Move#{moveNumber}
        </h2>
        <div className="flex gap-2 order-2 sm:order-none">
          <button
            onClick={handleQuit}
            className="px-4 py-2 bg-red_accent text-white rounded-lg shadow hover:bg-amber_dark transition"
          >
            Quit
          </button>
          <button
            onClick={() => setIsPaused(true)}
            className="px-4 py-2 bg-amber_dark text-white rounded-lg shadow hover:bg-gold_accent transition"
          >
            Pause
          </button>

          {/* Show Run Bot Battle ONLY if Bot vs Bot */}
          <div>
            {config.mode === "Bot vs Bot" && (
              <>
                <button
                  onClick={runBotBattle}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md 
                          hover:bg-blue-600 active:scale-95 transition-transform duration-150"
                >
                  Run Bot Battle
                </button>

                <div
                  className={`fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 transition-opacity duration-500 ${loading ? "opacity-100" : "opacity-0 pointer-events-none"
                    }`}
                >
                  <div className="bg-white p-6 rounded-2xl shadow-lg flex flex-col items-center transform transition-transform duration-500 scale-100">
                    <img
                      src="/assets/sword-clash.gif"
                      alt="Bots battling"
                      className="w-32 h-32 object-contain mb-4 animate-pulse"
                    />
                    <p className="text-lg font-bold text-gray-800">Bots are battling...</p>
                  </div>
                </div>


              </>
            )}
          </div>

        </div>
      </div>

      {/* Game Board */}
      <div className="grid grid-cols-3 lg:gap-2 gap-1 bg-brown_dark p-2 rounded-lg max-w-xl w-full aspect-square">
        {Array.from({ length: 9 }).map((_, miniIndex) => {
          const miniRow = Math.floor(miniIndex / 3);
          const miniCol = miniIndex % 3;
          const isActive = activeMiniBoard === null || activeMiniBoard === miniIndex;

          return (
            <div
              key={miniIndex}
              className={`grid grid-cols-3 gap-1 p-1 lg:p-2 border-2 rounded-md transition ${isActive
                ? "border-gold_accent bg-amber_light"
                : "border-gray-400 bg-gray-100 opacity-70"
                }`}
            >
              {Array.from({ length: 9 }).map((_, i) => {
                const r = miniRow * 3 + Math.floor(i / 3);
                const c = miniCol * 3 + (i % 3);
                const value = board[r]?.[c];

                const isLastMove = lastMoveCell && lastMoveCell[0] === r && lastMoveCell[1] === c;

                if (isLastMove) console.log("Highlighting last move at:", r, c);

                return (
                  <div
                    key={`${r}-${c}`}
                    onClick={() => handleCellClick(r, c)}
                    className={`flex items-center justify-center rounded-md border border-brown_dark text-lg sm:text-xl font-bold aspect-square cursor-pointer transition ${value === 1
                      ? "text-red_accent"
                      : value === 2
                        ? "text-blue-500"
                        : "hover:bg-amber_dark/20"
                      }
                      ${isLastMove ? "bg-gold_accent/45" : "bg-white"}  // highlight entire cell if last move
                      `}
                  >
                    {value === 1 ? "X" : value === 2 ? "O" : ""}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Winner Banner */}
      {winner && (
        <div className="mt-4 text-xl font-bold text-center">
          {winner === 3
            ? "It's a Draw!"
            : `${winner === 1 ? "Uploaded Bot" : "Game Bot"} Wins!`}
        </div>
      )}


      {/* Pause Modal */}
      {isPaused && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-amber_light p-6 rounded-xl shadow-xl w-11/12 max-w-md text-center">
            <h2 className="text-2xl font-bold mb-6">Game Paused</h2>
            <div className="flex flex-col items-center gap-4">
              <div className="flex justify-center gap-4 w-full">
                <button
                  onClick={() => setIsPaused(false)}
                  className="flex-1 px-6 py-2 bg-gold_accent text-white rounded-lg hover:bg-amber_dark transition"
                >
                  Resume
                </button>
                <button
                  onClick={handleRestart}
                  className="flex-1 px-6 py-2 bg-amber_dark text-white rounded-lg hover:bg-gold_accent transition"
                >
                  Restart
                </button>
              </div>
              <div className="flex justify-center w-full">
                <button
                  onClick={handleQuit}
                  className="px-6 py-2 bg-red_accent text-white rounded-lg hover:bg-amber_dark transition"
                >
                  Quit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === Replay & Speed Controls (Bottom) === */}
      {config.mode === "Bot vs Bot" && winner && moveHistory.length > 0 && (
        <div className="mt-8 flex flex-col items-center gap-4">
          {/* Replay Buttons */}
          <div className="flex gap-3 items-center mt-1">

            <button
              onClick={() => {
                setReplayIndex(0);
                setBoard(Array(9).fill().map(() => Array(9).fill(0)));
                setMainboard(Array(3).fill().map(() => Array(3).fill(0)));
              }}
              className="bg-red_accent text-white px-4 py-2 rounded-lg shadow hover:bg-blue-600 transition"
            >
              Start Replay
            </button>

            {/* Step Backward */}
            <button
              onClick={() => {
                if (replayIndex > 0) {
                  const prevIndex = replayIndex - 1;

                  // Rebuild board up to prevIndex
                  const newBoard = Array(9).fill().map(() => Array(9).fill(0));
                  for (let i = 0; i <= prevIndex; i++) {
                    const { move, player } = moveHistory[i];
                    const [r, c] = move;
                    newBoard[r][c] = player;
                  }

                  setBoard(newBoard);
                  setReplayIndex(prevIndex);
                }
              }}
              className="bg-amber_dark text-white px-4 py-2 rounded-lg shadow hover:bg-gold_accent transition"
            >
              {"<"}
            </button>

            {/* Step Forward */}
            <button
              onClick={() => {
                if (replayIndex + 1 < moveHistory.length) {
                  const nextMove = moveHistory[replayIndex + 1];
                  const [r, c] = nextMove.move;

                  setBoard(prevBoard => {
                    const newBoard = prevBoard.map(row => [...row]);
                    newBoard[r][c] = nextMove.player;
                    return newBoard;
                  });

                  setReplayIndex(replayIndex + 1);
                }
              }}
              className="bg-amber_dark text-white px-4 py-2 rounded-lg shadow hover:bg-gold_accent transition"
            >
              {">"}
            </button>

            {/* Auto Replay Toggle */}
            <button
              onClick={() => setIsAutoReplay(prev => !prev)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-600 transition"
            >
              {isAutoReplay ? "Pause Auto Replay <3" : "Play Auto Replay <3"}
            </button>
          </div>

          {/* Speed Slider */}
          <div className="flex flex-col items-center">
            <input
              type="range"
              min="100"
              max="2000"
              step="50"
              value={replayInterval}
              onChange={(e) => setReplayInterval(Number(e.target.value))}
              className="w-64"
            />
            <span className="mt-1 text-sm text-gray-700">
              {(1000 / replayInterval).toFixed(1)} moves/sec
            </span>
          </div>
        </div>
      )}

    </div>
  );
};

export default GameBoard;
