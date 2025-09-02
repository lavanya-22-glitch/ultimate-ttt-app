import React, { useState, useEffect } from "react";
const API_BASE = "http://127.0.0.1:5000";


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

  // const API_BASE = "http://127.0.0.1:5000";

const runBotBattle = async () => {
  console.log("runBotBattle called"); // ✅ entry point
  try {
    const res = await fetch(`${API_BASE}/bot-vs-bot-run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ game_id }),
    });

    console.log("Response received:", res); // ✅ check if server responded

    const text = await res.text(); // get raw response
    console.log("Raw response text:", text); // ✅ see what backend returned

    const data = JSON.parse(text); // parse JSON manually
    console.log("Parsed JSON:", data); // ✅ parsed object

    if (data.success) {
      const { move_history = [], winner, board, mainboard } = data;

      const playMoves = async () => {
        for (let i = 0; i < move_history.length; i++) {
          const partialHistory = move_history.slice(0, i + 1);

          // Update UI for this step
          setMoveHistory(partialHistory);
          setMoveNumber(partialHistory.length);

          // If you want to recompute board at each step, do it here
          setBoard([...board]);
          setMainboard([...mainboard]);

          // 🔥 Give React time to render
          await new Promise((resolve) => setTimeout(resolve, 1000)); 
        }

        setWinner(winner);
      };

      playMoves();
    } else {
      console.log("Bot battle failed:", data.error);
      alert(data.error || "Bot battle failed");
    }
  } catch (err) {
    console.error("Error running bot battle:", err); // ✅ catch errors
    alert("Error running bot battle");
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
      const res = await fetch("/move", {
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
      } else {
        setActiveMiniBoard(null);
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
                {/* <button
        onClick={async () => {
          try {
            const res = await fetch("/bot-vs-bot-move", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ game_id }),
            });
            const data = await res.json();
            if (data.success) {
              setBoard(data.board);
              setMainboard(data.mainboard);
              setCurrentPlayer(data.currentPlayer);
              setWinner(data.winner);
              setMoveNumber(data.move_history?.length || 0);
              setReplayIndex(-1);

              // ✅ Save move history
              setMoveHistory(data.move_history || []);
            } else {
              alert(data.error || "Error running bot battle");
            }
          } catch (err) {
            alert("Error running bot match");
          }
        }}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-700 transition"
      >
        Run Bot Battle
      </button> */}
              <button
                onClick={runBotBattle}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md 
                          hover:bg-blue-600 active:scale-95 transition-transform duration-150"
              >
                Run Bot Battle
              </button>

                {/* Replay Controls (only show if a game has finished & there are moves) */}
                {winner && moveHistory.length > 0 && (
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => {
                        setReplayIndex(0);
                        setBoard(Array(9).fill().map(() => Array(9).fill(0))); // Reset board
                        setMainBoard(Array(9).fill(0));
                      }}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                    >
                      Start Replay
                    </button>
                    {replayIndex >= 0 && replayIndex < moveHistory.length && (
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
                      >
                        Next Move
                      </button>
                    )}
                  </div>
                )}

                <input
                  type="range"
                  min="100"
                  max="2000"
                  step="50"
                  value={replayInterval}
                  onChange={(e) => setReplayInterval(Number(e.target.value))}
                />
                <span>{(1000 / replayInterval).toFixed(1)} moves/sec</span>

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

                return (
                  <div
                    key={`${r}-${c}`}
                    onClick={() => handleCellClick(r, c)}
                    className={`flex items-center justify-center rounded-md border bg-white border-brown_dark text-lg sm:text-xl font-bold aspect-square cursor-pointer transition ${value === 1
                      ? "text-red_accent"
                      : value === 2
                        ? "text-blue-500"
                        : "hover:bg-amber_dark/20"
                      }`}
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
          {winner === 3 ? "It's a Draw!" : `Player ${winner} Wins!`}
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
    </div>
  );
};

export default GameBoard;
