import React, { useState } from "react";
import Menu from "./components/Menu";
import GameBoard from "./components/GameBoard";

function App() {
  const [screen, setScreen] = useState("menu"); // 'menu' or 'game'
  const [gameConfig, setGameConfig] = useState(null); // store mode, difficulty, etc.

  const startGame = (config) => {
    console.log("Starting game with config:", config);
    setGameConfig(config);
    setScreen("game");
  };

  const quitGame = () => {
    setScreen("menu");
    setGameConfig(null);
  };

  {screen === "game" && (
    <>
      <pre>{JSON.stringify(gameConfig, null, 2)}</pre>
      <GameBoard config={gameConfig} onQuit={quitGame} />
    </>
  )}

  return (
    <div className="min-h-screen">
      {screen === "menu" && <Menu onSelect={startGame} />}
      {screen === "game" && <GameBoard config={gameConfig} onQuit={quitGame} />}
    </div>
  );
}

export default App;
