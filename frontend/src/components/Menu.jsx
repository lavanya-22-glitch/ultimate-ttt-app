import React, { useState, useEffect } from "react";

const Menu = ({ onSelect }) => {
  const [mode, setMode] = useState(null);
  const [difficulty, setDifficulty] = useState("Medium");
  const [animate, setAnimate] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [playerRole, setPlayerRole] = useState("Player 1");
  const [player1Name, setPlayer1Name] = useState("Player 1");
  const [player2Name, setPlayer2Name] = useState("Player 2");
  const [botFile, setBotFile] = useState(null); // NEW
  const [isSubmitting, setIsSubmitting] = useState(false); // optional for UX
  const [showDetailedRules, setShowDetailedRules] = useState(false);


  const difficulties = ["Very Easy", "Easy", "Medium", "Hard", "Ultimate"];
  const modes = ["Player vs Bot", "Player vs Player", "Bot vs Bot"];

  useEffect(() => {
    setTimeout(() => setAnimate(true), 50);
  }, []);

  const handleStart = async () => {
    if (!mode) return;

    setIsSubmitting(true);

    try {
      let body;
      let headers = { "Content-Type": "application/json" };

      // Handle Bot file upload for Bot vs Bot
      if (mode === "Bot vs Bot" && botFile) {
        body = new FormData();
        body.append("mode", mode);
        body.append("difficulty", difficulty);
        body.append("botFile", botFile);
        headers = {}; // Let browser set multipart/form-data
      } else {
        body = JSON.stringify({
          mode,
          difficulty,
          playerRole,
          player1Name,
          player2Name,
        });
      }

      const res = await fetch("/start", { method: "POST", body, headers });
      const data = await res.json();

      if (data.success) {
        onSelect({
          game_id: data.game_id,
          mode: data.mode,
          initialState: data,
        });
      } else {
        alert(data.error || "Failed to start game");
      }
    } catch (err) {
      console.error("Error starting game:", err);
      alert("Failed to start game");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    setMode(null);
    setDifficulty("Medium");
    setPlayerRole("Player 1");
    setPlayer1Name("Player 1");
    setPlayer2Name("Player 2");
    setBotFile(null);
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-amber_light text-brown_dark overflow-hidden relative">
      {/* IMAGE SECTION */}
      <div
        className={`flex-shrink-0 lg:w-1/2 flex justify-center items-center p-6 transition-all duration-700 ease-out ${
          animate ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
        }`}
      >
        <img
          src="/assets/ttt board.png"
          alt="Tic Tac Toe Board"
          className="w-3/4 lg:w-[80%] max-w-md lg:max-w-lg drop-shadow-2xl transform hover:scale-105 transition duration-500 ease-in-out"
        />
      </div>

      {/* MENU SECTION */}
      <div
        className={`flex-1 flex flex-col items-center justify-center p-6 transition-all duration-700 ease-out delay-100 ${
          animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <h1 className="text-5xl lg:text-6xl font-extrabold mb-3 tracking-wider text-brown_dark drop-shadow-md">
          Move#81
        </h1>
        <p className="mb-8 italic text-brown_dark/80 text-lg">Master all 81 moves</p>

        {!mode ? (
          <div className="grid gap-4 w-full max-w-sm">
            {modes.map((m) => (
              <button
                key={m}
                className={`px-6 py-3 rounded-xl shadow-md transition duration-300 ease-in-out font-semibold tracking-wide transform hover:scale-105 hover:shadow-xl
                  ${
                    mode === m
                      ? "bg-gold_accent text-white ring-4 ring-amber_dark"
                      : "bg-amber_dark text-white hover:bg-gold_accent"
                  }`}
                onClick={() => setMode(m)}
              >
                {m}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 w-full max-w-md">
            {/* Difficulty + Role selection */}
            {mode === "Player vs Bot" && (
              <div className="transition-all duration-500">
                <p className="mb-3 text-center text-brown_dark text-lg font-semibold">
                  Select Difficulty
                </p>
                <div className="grid grid-cols-3 sm:flex sm:flex-nowrap justify-center gap-2">
                  {difficulties.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`px-4 py-2 rounded-lg transition-all duration-300 ease-in-out font-medium text-sm transform hover:scale-105
                        ${
                          difficulty === d
                            ? "bg-gold_accent text-white shadow-md"
                            : "bg-amber_light text-brown_dark border border-amber_dark hover:bg-amber_dark hover:text-white"
                        }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>

                <div className="mt-6">
                  <p className="mb-3 text-center text-brown_dark text-lg font-semibold">
                    Choose Your Role
                  </p>
                  <div className="flex gap-4 justify-center">
                    {["Player 1", "Player 2"].map((role) => (
                      <button
                        key={role}
                        onClick={() => setPlayerRole(role)}
                        className={`px-4 py-2 rounded-lg transition-all duration-300 ease-in-out font-medium text-sm
                          ${
                            playerRole === role
                              ? "bg-gold_accent text-white shadow-md"
                              : "bg-amber_light text-brown_dark border border-amber_dark hover:bg-amber_dark hover:text-white"
                          }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Player vs Player names */}
            {mode === "Player vs Player" && (
              <div className="mt-6 w-full max-w-sm">
                <p className="mb-3 text-center text-brown_dark text-lg font-semibold">
                  Enter Player Names
                </p>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-brown_dark">X:</span>
                    <input
                      type="text"
                      value={player1Name}
                      onChange={(e) => setPlayer1Name(e.target.value)}
                      placeholder="Player 1"
                      className="flex-1 px-4 py-2 rounded-lg border border-amber_dark text-brown_dark placeholder-brown_dark/50 focus:outline-none focus:ring-2 focus:ring-gold_accent"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-brown_dark">O:</span>
                    <input
                      type="text"
                      value={player2Name}
                      onChange={(e) => setPlayer2Name(e.target.value)}
                      placeholder="Player 2"
                      className="flex-1 px-4 py-2 rounded-lg border border-amber_dark text-brown_dark placeholder-brown_dark/50 focus:outline-none focus:ring-2 focus:ring-gold_accent"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Bot vs Bot file upload + difficulty */}
            {mode === "Bot vs Bot" && (
              <div className="mt-0 w-full max-w-lg">
                <p className="mb-3 text-center text-brown_dark text-lg font-semibold">
                  Upload Your Bot
                </p>
                <div className="flex justify-center items-center">
                <input
                  type="file"
                  accept=".py"
                  onChange={(e) => setBotFile(e.target.files[0])}
                  className=" px-4 py-1 text-sm rounded-lg border border-amber_dark text-brown_dark file:mr-3 file:px-4 file:py-2 file:rounded-lg file:border-none file:bg-gold_accent file:text-white hover:file:bg-amber_dark focus:outline-none"
                />
                </div>

                <p className="mt-6 mb-3 text-center text-brown_dark text-lg font-semibold">
                  Select Difficulty
                </p>
                <div className="grid grid-cols-3 sm:flex sm:flex-nowrap justify-center gap-2">
                  {difficulties.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`px-4 py-2 rounded-lg transition-all duration-300 ease-in-out font-medium text-sm transform hover:scale-105
                        ${
                          difficulty === d
                            ? "bg-gold_accent text-white shadow-md"
                            : "bg-amber_light text-brown_dark border border-amber_dark hover:bg-amber_dark hover:text-white"
                        }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>

                <div className="mt-6">
                  <p className="mb-2 text-center text-brown_dark text-lg font-semibold">
                    Choose Your Role
                  </p>
                  <div className="flex gap-4 justify-center">
                    {["Player 1", "Player 2"].map((role) => (
                      <button
                        key={role}
                        onClick={() => setPlayerRole(role)}
                        className={`px-4 py-2 rounded-lg transition-all duration-300 ease-in-out font-medium text-sm
                          ${
                            playerRole === role
                              ? "bg-gold_accent text-white shadow-md"
                              : "bg-amber_light text-brown_dark border border-amber_dark hover:bg-amber_dark hover:text-white"
                          }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-4 mt-5">
              <button
                disabled={isSubmitting || !mode}
                className="px-8 py-3 bg-amber_dark text-white font-bold rounded-xl shadow-lg hover:bg-gold_accent transform hover:scale-105 transition duration-300 ease-in-out disabled:opacity-50"
                onClick={handleStart}
              >
                {isSubmitting ? "Starting..." : "Start Game"}
              </button>
              <button
                className="px-8 py-3 bg-red_accent text-white font-bold rounded-xl shadow-lg hover:bg-gold_accent transform hover:scale-105 transition duration-300 ease-in-out"
                onClick={handleBack}
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* RULES BUTTON */}
        <button
          className="mt-4 px-6 py-2 bg-gold_accent text-white font-semibold rounded-lg shadow hover:scale-105 hover:bg-amber_dark transition duration-300 ease-in-out"
          onClick={() => setShowRules(true)}
        >
          Rules
        </button>
      </div>

      {/* RULES MODAL */}
      {showRules && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 transition-opacity duration-300">
          <div className="bg-amber_light p-6 rounded-xl shadow-xl w-11/12 max-w-lg text-brown_dark">
            <h2 className="text-2xl font-bold mb-4">Game Rules</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>The game is Ultimate Tic-Tac-Toe (9 mini-boards).</li>
              <li>Winning a mini-board earns you that square on the big board.</li>
              <li>Your move decides where your opponent must play next.</li>
              <li>Win the overall board by making 3-in-a-row on the big board!</li>
            </ul>
            <button
              onClick={() => setShowRules(false)}
              className="mt-6 px-6 py-2 bg-gold_accent text-white font-semibold rounded-lg shadow hover:bg-amber_dark transition duration-300 ease-in-out"
            >
              Close
            </button>
            {/* KNOW MORE BUTTON */}
            <button
              className="ml-4 mt-2 px-6 py-2 bg-amber_dark text-white font-semibold rounded-lg shadow hover:scale-105 hover:bg-gold_accent transition duration-300 ease-in-out"
              onClick={() => setShowDetailedRules(true)}
            >
              Know More
            </button>

{/* DETAILED RULES MODAL */}
              {showDetailedRules && (
                <div
                  className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50"
                  onClick={() => setShowDetailedRules(false)}
                >
                  <div
                    className="bg-amber_light p-6 rounded-xl shadow-xl w-11/12 max-w-2xl text-brown_dark max-h-[85vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h2 className="text-3xl font-bold mb-4 text-center">Ultimate Tic-Tac-Toe Rules</h2>
                    <div className="space-y-3 text-lg">
                      <p>
                        Ultimate Tic-Tac-Toe is a strategic twist on the classic Tic-Tac-Toe game, played
                        on a 3×3 grid of 3×3 boards (9 mini-boards total).
                      </p>
                      <ol className="list-decimal list-inside space-y-2">
                        <li><strong>The Board:</strong> The big board is divided into 9 smaller Tic-Tac-Toe boards.</li>
                        <li><strong>First Move:</strong> X always plays first and can choose any square on any mini-board.</li>
                        <li><strong>Move Restriction:</strong> The square you pick inside a mini-board determines the mini-board your opponent must play in next.</li>
                        <li><strong>Full Mini-Boards:</strong> If a mini-board is already won or filled, the next player can move anywhere.</li>
                        <li><strong>Winning Mini-Boards:</strong> Win a mini-board by making 3 in a row inside that board. You claim that square on the big board.</li>
                        <li><strong>Winning the Game:</strong> Get 3 in a row on the big board to win the game.</li>
                        <li><strong>Draw:</strong> If all mini-boards are filled without a big-board winner, the game is a draw.</li>
                      </ol>
                    </div>
                    <button
                      onClick={() => setShowDetailedRules(false)}
                      className="mt-6 px-6 py-2 bg-gold_accent text-white font-semibold rounded-lg shadow hover:bg-amber_dark transition duration-300 ease-in-out"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

          </div>
        </div>
      )}
    </div>
  );
};

export default Menu;
