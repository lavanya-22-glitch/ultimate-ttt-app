import React, { useState, useEffect } from "react";

const GameBoard = ({ config, onQuit }) => {
  const { game_id, initialState } = config;
  const [board, setBoard] = useState(initialState.board);
  const [mainboard, setMainboard] = useState(initialState.mainboard);
  const [currentPlayer, setCurrentPlayer] = useState(initialState.currentPlayer);
  const [winner, setWinner] = useState(initialState.winner);
  const [activeMiniBoard, setActiveMiniBoard] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [moveNumber, setMoveNumber] = useState(0);

  // Restart game when component mounts
  useEffect(() => {
    const startGame = async () => {
      const res = await fetch("/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          difficulty,
          playerRole,
          player1Name,
          player2Name
        }),
      });
      const data = await res.json();
      setBoard(data.board);
      setMainboard(data.mainboard || []);
      setCurrentPlayer(data.currentPlayer);
      setActiveMiniBoard(null);
      setWinner(null);
      setMoveNumber(0);
    };
    startGame();
  }, [config]);

  const handleCellClick = async (row, col) => {
    if (winner) return; // Game over

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

      setBoard(data.board);
      setCurrentPlayer(data.currentPlayer);
      setWinner(data.winner || null);
      setMoveNumber((prev) => prev + 1);

      if (data.mainboard) {
        setMainboard(data.mainboard);
        const r = row % 3;
        const c = col % 3;
        const nextIndex = r * 3 + c;
        const miniStatus = data.mainboard[r]?.[c];
        setActiveMiniBoard(miniStatus === 0 ? nextIndex : null);
      }

      if (data.winner) {
        alert(data.winner === 3 ? "It's a Draw!" : `Winner: ${data.winner === 1 ? "X" : "O"}`);
      }
    } catch (err) {
      console.error("Error during move:", err);
      alert("Illegal Move");
    }
  };

  const handleQuit = () => {
    if (window.confirm("Quit the game?")) onQuit();
  };

  const handleRestart = async () => {
    if (!window.confirm("Restart the game?")) return;

    const res = await fetch("/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: config.mode,
        difficulty: config.difficulty,
        playerRole: config.playerRole,
        player1Name: config.player1Name,
        player2Name: config.player2Name,
      }),
    });

    const data = await res.json();
    setBoard(data.board);
    setMainboard(data.mainboard || []);
    setCurrentPlayer(1);
    setWinner(null);
    setActiveMiniBoard(null);
    setIsPaused(false);
    setMoveNumber(0);
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
              className={`grid grid-cols-3 gap-1 p-1 lg:p-2 border-2 rounded-md transition ${
                isActive
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
                    className={`flex items-center justify-center rounded-md border bg-white border-brown_dark text-lg sm:text-xl font-bold aspect-square cursor-pointer transition ${
                      value === 1
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
